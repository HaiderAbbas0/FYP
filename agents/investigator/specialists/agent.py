"""Investigator sub-agents (specialist evidence workers).

Each specialist is an independent, individually-timeoutable worker. They run
concurrently because they have no dependency on each other (pipeline doc ?22),
but concurrency is a latency optimisation only - the Investigator still waits at
the fusion barrier before any decision is made.

**Evidence provenance is enforced here.** Every finding carries a `provenance`
tag, and a worker that cannot compute something from a real source declares
itself `unavailable` rather than producing a plausible number:

  capture     - aggregated from the scored CICIoMT2024 flow window
  registry    - testbed device metadata (device class, allowed actions)
  case-store  - counted from the real case store
  unavailable - no source wired up in this PoC

That last category is deliberate. The CICIoMT2024 feature schema is
post-extraction: it has no addresses, no host identifiers and no service logs,
so a Threat Intelligence worker has nothing real to look up and source
cardinality cannot be derived. Reporting that honestly makes the Policy Gate
fail safe (see `agents.investigator.agent._constraints`), which is the correct
behaviour - a fabricated finding would instead have silently unlocked
single-IP blocking.

Each worker now lives in its own module next to this one; this file holds the
registry and the supervisor that runs them. The names are re-exported so every
existing import keeps working.
"""

from __future__ import annotations

import asyncio
import os
import time
from typing import Any, Awaitable, Callable

from app.config import settings
from app.schemas import DetectorEvent, SpecialistResult

from .common import (
    _WORKER_LIMITS,
    _connection_state_summary,
    _missing_stats,
    _ratio,
    _stat,
    _timed,
    _traffic_summary,
)
from .device_context import device_context
from .history_analysis import history_analysis
from .log_analysis import log_analysis
from .threat_intel import threat_intel
from .traffic_analysis import traffic_analysis

#: Advisory workers can never be the sole basis for a response decision, so
#: losing one records an evidence gap but must NOT degrade the measured outcome.
#: Everything else is decision-relevant: its absence really does mean the
#: Investigator reasoned with less than it should have.
ADVISORY = {"threat"}

REGISTRY: dict[str, Callable[[DetectorEvent, dict[str, Any]], Awaitable[SpecialistResult]]] = {
    "log": log_analysis,
    "threat": threat_intel,
    "device": device_context,
    "traffic": traffic_analysis,
    "history": history_analysis,
}


async def run_specialists(
    event: DetectorEvent,
    names: list[str],
    stats: dict[str, Any] | None = None,
    *,
    stall: set[str] | None = None,
    run_id: str = "standalone",
    run_started_at: float | None = None,
    cancel_event: asyncio.Event | None = None,
) -> list[SpecialistResult]:
    """Fan out to the selected specialists concurrently, then join.

    The join is the synchronisation barrier: parallelism reduces latency but
    never lets a decision be made on incomplete evidence without that gap being
    recorded.
    """
    stall = stall or set()
    if len(names) > 32 or len(set(names)) != len(names):
        raise ValueError("specialist selection must contain at most 32 unique names")
    window_stats = stats or {}
    history_stats = window_stats
    if "history" in names and "_history_snapshot" not in window_stats:
        def snapshot_history():
            from app.memory import MemoryAgent
            return [c.model_dump(mode="json") for c in MemoryAgent().cases]
        history_stats = {**window_stats, "_history_snapshot": await asyncio.to_thread(snapshot_history)}
    run_started_at = run_started_at or time.perf_counter()
    execution_mode = os.getenv("SPECIALIST_EXECUTION", "process")
    if execution_mode not in ("process", "inprocess"):
        raise ValueError("SPECIALIST_EXECUTION must be process or inprocess")
    capacity = int(os.getenv("SPECIALIST_CONCURRENCY", "5"))
    if capacity < 1:
        raise ValueError("SPECIALIST_CONCURRENCY must be positive")
    loop = asyncio.get_running_loop()
    if loop not in _WORKER_LIMITS:
        _WORKER_LIMITS[loop] = asyncio.Semaphore(capacity)
    semaphore = _WORKER_LIMITS[loop]
    tasks: list[asyncio.Task[SpecialistResult]] = []
    for name in names:
        fn = REGISTRY.get(name)

        if fn is None:
            async def unsupported(_event, _stats, worker_name=name):
                raise ValueError(f"no specialist registered as {worker_name!r}")

            fn = unsupported

        async def call(f=fn, stalled=(name in stall), worker_name=name):
            async with semaphore:
                inputs = history_stats if worker_name == "history" else window_stats
                if execution_mode == "process" and worker_name in REGISTRY:
                    from app.worker_runtime import process_specialist
                    return await process_specialist(worker_name, event.model_dump(mode="json"), inputs, stalled)
                if stalled:
                    await asyncio.sleep(settings.specialist_timeout_s + 1.0)
                result = await f(event, inputs)
                result.findings.pop('_resource_usage', None)
                return result

        tasks.append(asyncio.create_task(_timed(
            name, call, settings.specialist_timeout_s,
            run_id=run_id, run_started_at=run_started_at,
            synthetic=event.detector_source == "synthetic",
        )))

    if cancel_event is None:
        return list(await asyncio.gather(*tasks))

    cancel_wait = asyncio.create_task(cancel_event.wait())
    try:
        unfinished: set[asyncio.Task] = set(tasks)
        while unfinished:
            done, _ = await asyncio.wait(
                unfinished | {cancel_wait}, return_when=asyncio.FIRST_COMPLETED,
            )
            if cancel_wait in done and cancel_event.is_set():
                for task in unfinished:
                    if not task.done():
                        task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)
                return []
            unfinished.difference_update(done)
        return list(await asyncio.gather(*tasks))
    finally:
        if not cancel_wait.done():
            cancel_wait.cancel()
