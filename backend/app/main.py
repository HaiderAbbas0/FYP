"""FastAPI surface for the agent runtime.

Endpoints
---------
GET  /api/health              service + LLM provider status (no key required)
GET  /api/scenarios           the three demo incidents
GET  /api/memory/cases        the case store
GET  /api/memory/coverage     what the store currently knows (adaptation surface)
POST /api/simulate            run one incident, return the full event list
GET  /api/simulate/stream     run one incident as Server-Sent Events

The SSE stream emits exactly the `SimEvent` objects that
`src/agents/types.ts` already understands, so pointing the UI at this service is
a matter of replacing the local timer in `useSimRun` with an EventSource.
"""

from __future__ import annotations

import asyncio
import json

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from .config import settings
from .detector import get_detector
from .incidents import (
    DEVICES, SCENARIOS, build_event, detector_artifact, replay_scenario, source_cardinality,
)
from .llm import LLMClient
from .memory import CACHE, MemoryAgent
from .monitor import GATEWAY, GATEWAY_HEALTH_URL, PROBE_INTERVAL_S
from .planner import Faults, Planner
from .schemas import RunRequest

app = FastAPI(title="MediSOC Agent Runtime", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Scenario definitions and the device registry live in `incidents.py`; the
# detector event is built from real scored capture windows, not constants.
# --------------------------------------------------------------------------- #


#: One shared client for the whole process. Key parking, circuit-breaker state
#: and call counters are cross-incident concerns: a key rate-limited by incident
#: N must still be parked for incident N+1, and the health endpoint has to report
#: cumulative usage rather than the last request's.
LLM = LLMClient()


def _planner(faults: Faults) -> Planner:
    memory = MemoryAgent(available=not faults.memory_down)
    # the llm-down fault uses a throwaway client so it cannot poison shared state
    llm = LLMClient(force_unavailable=True) if faults.llm_down else LLM
    return Planner(memory, llm, faults)


# --------------------------------------------------------------------------- #
# --------------------------------------------------------------------------- #
# Edge gateway stub.
#
# The availability monitor needs a real HTTP endpoint to probe. Until the
# testbed gateway exists, this stands in for it: it answers 200 while the
# service is healthy and 503 while it is saturated, and the incident run drives
# that state. The probing is real; only the thing being probed is a stub.
#
# Point GATEWAY_HEALTH_URL at the real gateway and nothing else changes.
# --------------------------------------------------------------------------- #
@app.get("/gateway/health")
async def gateway_health() -> JSONResponse:
    code, body = GATEWAY.status()
    return JSONResponse(status_code=code, content=body)


@app.get("/api/monitor/info")
async def monitor_info() -> dict:
    return {
        "probe_url": GATEWAY_HEALTH_URL,
        "probe_rate_hz": round(1 / PROBE_INTERVAL_S, 1),
        "interval_s": PROBE_INTERVAL_S,
        "healthy_now": GATEWAY.healthy,
        "success_criterion": "HTTP 200 = traffic healthy; any other status, timeout or connection error = outage",
        "note": (
            "Probing is real HTTP. The default target is the built-in gateway stub in this service; "
            "set GATEWAY_HEALTH_URL to point the same probe at the real edge gateway."
        ),
    }


@app.get("/api/health")
async def health() -> dict:
    return {
        "status": "ok",
        "llm": LLM.stats(),
        "thresholds": settings.thresholds.__dict__,
        "note": (
            "The runtime is fully operational without an API key. With no key configured every "
            "agent takes its deterministic path: retrieval + rule-based fusion + the policy action "
            "table. Reasoning quality drops on novel incidents; safety properties do not change."
        ),
    }


@app.get("/api/scenarios")
async def scenarios() -> dict:
    return {
        "scenarios": [
            {
                "key": s.key,
                "name": s.name,
                "blurb": s.blurb,
                "device": DEVICES[s.device_id].__dict__,
                "src_ip": s.src_ip,
                "replay": {
                    "windows": s.profile.windows,
                    "rows_per_window": s.profile.rows_per_window,
                    "attack_start": s.profile.attack_start,
                    "attack_ratio": s.profile.attack_ratio,
                    "window_seconds": s.profile.window_seconds,
                },
            }
            for s in SCENARIOS.values()
        ]
    }


@app.get("/api/detector/info")
async def detector_info() -> dict:
    """Model card for the trained detector - what it is and what it covers."""
    return get_detector().info()


@app.get("/api/detector/replay")
async def detector_replay(scenario_key: str = Query("medium", alias="scenario")) -> dict:
    """Score a capture timeline without running the agent chain."""
    windows, trigger = replay_scenario(scenario_key)
    return {
        "scenario": scenario_key,
        "windows": [w.to_json() for w in windows],
        "trigger_index": trigger.index if trigger else None,
    }


@app.get("/api/memory/cases")
async def cases() -> dict:
    return {"cases": [c.model_dump(mode="json") for c in MemoryAgent().cases]}


@app.get("/api/memory/coverage")
async def coverage() -> dict:
    return MemoryAgent().coverage()


@app.get("/api/memory/cache")
async def memory_cache() -> dict:
    """Secondary memory: what is cached right now and how long it has left."""
    return CACHE.stats()


@app.post("/api/memory/cache/clear")
async def memory_cache_clear() -> dict:
    CACHE.clear()
    return {"cleared": True, **CACHE.stats()}


@app.get("/api/memory/benchmark")
async def memory_benchmark(sizes: str = Query("7,100,1000,10000")) -> dict:
    """Measure primary-scan cost against store size, versus the bounded cache.

    The point of secondary memory is that its cost does not grow with the store.
    At seven cases that is an architectural claim rather than a visible saving,
    so this measures it properly: the same incident scored against progressively
    larger stores, with the <=10-entry cache lookup alongside for comparison.

    Stores are grown by cloning the seed cases with fresh ids - the similarity
    maths per case is identical, which is exactly what we are timing.
    """
    import time as _t

    from .memory import CaseCache

    windows, trigger = replay_scenario("low")
    if trigger is None:
        raise HTTPException(status_code=422, detail="replay produced no detection")
    event = build_event("low", trigger)
    base = MemoryAgent()
    cardinality = source_cardinality(event)

    # a full cache, so the comparison is against the worst case (10 entries)
    cache = CaseCache()
    for c in base.cases[: CaseCache.CAPACITY]:
        cache.promote(c, promoted_by="benchmark")

    def time_it(fn, reps: int) -> float:
        start = _t.perf_counter()
        for _ in range(reps):
            fn()
        return (_t.perf_counter() - start) / reps * 1_000_000  # microseconds

    cache_us = time_it(
        lambda: cache.lookup(event, cardinality, base.similarity, base.context_compatible), 200
    )

    rows = []
    for size in [int(x) for x in sizes.split(",") if x.strip().isdigit()][:6]:
        agent = MemoryAgent()
        seed = list(agent.cases)
        clones = []
        i = 0
        while len(clones) < size:
            c = seed[i % len(seed)].model_copy(deep=True)
            c.case_id = f"BENCH-{len(clones):06d}"
            clones.append(c)
            i += 1
        agent.cases = clones
        reps = 50 if size <= 1000 else 5
        primary_us = time_it(lambda: agent.retrieve(event, cardinality), reps)
        rows.append({
            "store_size": size,
            "primary_us": round(primary_us, 1),
            "cache_us": round(cache_us, 1),
            "speedup_x": round(primary_us / cache_us, 1) if cache_us else None,
        })

    return {
        "note": (
            "Primary scores every case; the cache scores at most 10. Measured on this machine, "
            "single-threaded, structured similarity only (no embedding term)."
        ),
        "cache_entries_scored": len(cache.entries),
        "results": rows,
    }


@app.post("/api/memory/reset")
async def reset_memory() -> dict:
    """Restore the pristine seed store.

    Every completed run appends a validated case, which is the point of the
    system but means a demo store drifts after a few runs. This puts it back to
    the seven curated cases so a walkthrough tells the same story twice.
    """
    seed = settings.cases_seed_path.read_text(encoding="utf-8")
    settings.cases_path.write_text(seed, encoding="utf-8")
    CACHE.clear()  # secondary memory holds copies of primary; reset both together
    return {"reset": True, "cases": len(json.loads(seed)), "cache_cleared": True}


def _prepare(scenario_key: str):
    """Replay the capture, score it, and build the real detector event."""
    windows, trigger = replay_scenario(scenario_key)
    if trigger is None:
        return windows, None, None
    event = build_event(scenario_key, trigger)
    return windows, event, detector_artifact(trigger, event)


@app.post("/api/simulate")
async def simulate(req: RunRequest) -> dict:
    """Run one incident to completion and return every event at once."""
    planner = _planner(Faults.from_dict(req.faults))
    windows, event, payload = _prepare(req.scenario)
    if event is None:
        return {"events": [], "error": "no detection in replay"}
    events = [
        e.model_dump(mode="json", by_alias=True, exclude_none=True)
        async for e in planner.run(event, req.scenario, windows, payload)
    ]
    return {"events": events, "llm": planner.llm.stats()}


@app.get("/api/simulate/stream")
async def simulate_stream(
    scenario: str = Query("medium"),  # noqa: A002 - matches the UI query param
    llmDown: bool = False,
    plannerCrash: bool = False,
    memoryDown: bool = False,
    subAgentTimeout: bool = False,
    policyConflict: bool = False,
    speed: float = Query(1.0, gt=0),
) -> StreamingResponse:
    """Server-Sent Events version, for the live UI.

    `speed` only scales the presentation delay between events; it does not
    change any agent behaviour or timing measurement.
    """
    faults = Faults(
        llm_down=llmDown, planner_crash=plannerCrash, memory_down=memoryDown,
        sub_agent_timeout=subAgentTimeout, policy_conflict=policyConflict,
    )
    planner = _planner(faults)
    windows, event, payload = _prepare(scenario)
    if event is None:
        raise HTTPException(status_code=422, detail="replay produced no detection")

    async def gen():
        try:
            async for e in planner.run(event, scenario, windows, payload):
                yield f"data: {json.dumps(e.model_dump(mode='json', by_alias=True, exclude_none=True), default=str)}\n\n"
                await asyncio.sleep(0.18 / speed)
        except Exception as exc:  # noqa: BLE001
            # The stream itself must fail loudly rather than truncate silently:
            # a UI that stops receiving events has to know why.
            err = {"type": "log", "ts": 0, "level": "error", "agent": "runtime", "msg": f"stream aborted: {exc}"}
            yield f"data: {json.dumps(err)}\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
