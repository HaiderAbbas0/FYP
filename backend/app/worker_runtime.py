"""Leased durable run scheduling and disposable specialist processes."""
from __future__ import annotations

import asyncio
import json
import logging
import multiprocessing
import os
import time
import uuid
from typing import Any, Awaitable, Callable

logger = logging.getLogger(__name__)


def _peak_rss_bytes() -> int | None:
    """Read the OS process peak resident working set, with explicit units."""
    if os.name == 'nt':
        try:
            import ctypes
            from ctypes import wintypes

            class Counters(ctypes.Structure):
                _fields_ = [('cb', wintypes.DWORD), ('PageFaultCount', wintypes.DWORD),
                            ('PeakWorkingSetSize', ctypes.c_size_t), ('WorkingSetSize', ctypes.c_size_t),
                            ('QuotaPeakPagedPoolUsage', ctypes.c_size_t), ('QuotaPagedPoolUsage', ctypes.c_size_t),
                            ('QuotaPeakNonPagedPoolUsage', ctypes.c_size_t), ('QuotaNonPagedPoolUsage', ctypes.c_size_t),
                            ('PagefileUsage', ctypes.c_size_t), ('PeakPagefileUsage', ctypes.c_size_t)]

            kernel = ctypes.WinDLL('kernel32', use_last_error=True)
            kernel.GetCurrentProcess.restype = wintypes.HANDLE
            psapi = ctypes.WinDLL('psapi', use_last_error=True)
            psapi.GetProcessMemoryInfo.argtypes = [wintypes.HANDLE, ctypes.POINTER(Counters), wintypes.DWORD]
            psapi.GetProcessMemoryInfo.restype = wintypes.BOOL
            counters = Counters()
            counters.cb = ctypes.sizeof(counters)
            if not psapi.GetProcessMemoryInfo(kernel.GetCurrentProcess(), ctypes.byref(counters), counters.cb):
                return None
            return int(counters.PeakWorkingSetSize)
        except (ImportError, OSError, AttributeError):
            return None
    try:
        import resource
        import sys
        peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        return int(peak if sys.platform == 'darwin' else peak * 1024)
    except (ImportError, OSError, AttributeError):
        return None


def _specialist_child(connection, name: str, event: dict, stats: dict, stall: bool) -> None:
    # Import only evidence workers: children never construct a run repository.
    from .specialists import REGISTRY
    from .schemas import DetectorEvent
    try:
        if stall:
            time.sleep(3600)
        result = asyncio.run(REGISTRY[name](DetectorEvent.model_validate(event), stats))
        peak_rss = _peak_rss_bytes()
        result.findings['_resource_usage'] = {
            'scope': 'specialist_process', 'measured': peak_rss is not None,
            # Absolute child CPU includes imports/startup. RSS is a process
            # high-water mark, not a per-finding allocation delta.
            'cpu_ms': round(time.process_time() * 1000, 3) if peak_rss is not None else None,
            'peak_rss_bytes': peak_rss,
            'includes_startup': True,
        }
        encoded = result.model_dump_json()
        if len(encoded.encode()) > 24_000:
            raise ValueError("worker output exceeds 24 KB")
        connection.send((True, encoded))
    except Exception as exc:
        connection.send((False, str(exc)[:300]))
    finally:
        connection.close()


async def process_specialist(name: str, event: dict, stats: dict, stall: bool = False) -> Any:
    """Spawn one disposable process; cancellation and timeout kill its execution."""
    from .schemas import SpecialistResult
    if len(json.dumps({"event": event, "stats": stats}).encode()) > 2_000_000:
        raise ValueError("specialist input exceeds 2 MB")
    context = multiprocessing.get_context("spawn")
    receiver, sender = context.Pipe(duplex=False)
    process = context.Process(target=_specialist_child, args=(sender, name, event, stats, stall), daemon=True)
    # Windows spawn may spend seconds in OS process creation. Keep heartbeats
    # and other run cancellation responsive throughout that startup period.
    starting = asyncio.create_task(asyncio.to_thread(process.start))
    try:
        await asyncio.shield(starting)
        sender.close()
        while not receiver.poll():
            if not process.is_alive():
                raise RuntimeError(f"specialist exited with code {process.exitcode}")
            await asyncio.sleep(0.01)
        success, payload = receiver.recv()
        if not success:
            raise RuntimeError(payload)
        return SpecialistResult.model_validate_json(payload)
    finally:
        # A cancelled startup must finish before cleanup can terminate its
        # child, otherwise the background thread could create an orphan later.
        try:
            await asyncio.shield(starting)
        except Exception:
            pass
        sender.close()
        receiver.close()
        if process.pid is not None:
            if process.is_alive():
                process.terminate()
            await asyncio.to_thread(process.join, 1)
            if process.is_alive():
                process.kill()
                await asyncio.to_thread(process.join, 1)


class RunWorkerService:
    """Claim queued runs atomically and keep ownership alive while executing.

    The repository must expose claim_next, heartbeat, get, interrupt_expired and
    set_status. The execute callback persists terminal events itself. Expired
    leases are interrupted for review, never replayed against an actuator.
    """
    def __init__(self, store: Any, execute: Callable[[dict, asyncio.Event], Awaitable[None]],
                 *, concurrency: int | None = None, poll_s: float = 0.25, lease_s: float = 30) -> None:
        self.store, self.execute = store, execute
        self.concurrency = concurrency or int(os.getenv("RUN_WORKER_CONCURRENCY", "1"))
        if self.concurrency < 1 or poll_s <= 0 or lease_s <= 0:
            raise ValueError("worker concurrency, poll and lease must be positive")
        self.poll_s, self.lease_s = poll_s, lease_s
        self.worker_id = f"worker-{uuid.uuid4().hex}"
        self._stop = asyncio.Event()
        self._tasks: list[asyncio.Task] = []
        self._controls: dict[str, asyncio.Event] = {}

    def start(self) -> None:
        if self._tasks:
            raise RuntimeError("worker service already started")
        self._tasks = [asyncio.create_task(self._loop()) for _ in range(self.concurrency)]

    def cancel(self, run_id: str) -> None:
        if run_id in self._controls:
            self._controls[run_id].set()

    async def stop(self, grace_s: float = 10) -> None:
        self._stop.set()
        for event in self._controls.values():
            event.set()
        if self._tasks:
            done, pending = await asyncio.wait(self._tasks, timeout=grace_s)
            for task in pending:
                task.cancel()
            await asyncio.gather(*self._tasks, return_exceptions=True)
            self._tasks.clear()

    async def _loop(self) -> None:
        while not self._stop.is_set():
            try:
                await asyncio.to_thread(self.store.interrupt_expired)
                record = await asyncio.to_thread(self.store.claim_next, self.worker_id, self.lease_s)
            except Exception:
                # A temporary DB outage must not permanently kill a scheduler.
                await asyncio.sleep(self.poll_s)
                continue
            if record is None:
                try:
                    await asyncio.wait_for(self._stop.wait(), self.poll_s)
                except asyncio.TimeoutError:
                    pass
                continue
            run_id = record["run_id"]
            cancel = asyncio.Event()
            if self._stop.is_set() or record.get("cancel_requested"):
                cancel.set()
            self._controls[run_id] = cancel
            watcher = asyncio.create_task(self._watch(run_id, cancel))
            try:
                await self.execute(record, cancel)
            except asyncio.CancelledError:
                await self._interrupt(run_id, "Worker shutdown interrupted execution; review actuator state")
                raise
            except Exception as exc:
                await self._interrupt(run_id, str(exc)[:500])
            finally:
                watcher.cancel()
                await asyncio.gather(watcher, return_exceptions=True)
                self._controls.pop(run_id, None)

    async def _interrupt(self, run_id: str, error: str) -> None:
        try:
            if hasattr(self.store, "interrupt_run"):
                await asyncio.to_thread(self.store.interrupt_run, run_id, error)
            else:
                await asyncio.to_thread(self.store.set_status, run_id, "interrupted", error=error)
        except Exception:
            # Expiry recovery will retry durable interruption once DB returns.
            logger.exception("Could not persist interruption for run %s", run_id)

    async def _watch(self, run_id: str, cancel: asyncio.Event) -> None:
        next_heartbeat = 0.0
        while True:
            try:
                record = await asyncio.to_thread(self.store.get, run_id)
                if record is None or record.get("cancel_requested"):
                    cancel.set()
                now = time.monotonic()
                if now >= next_heartbeat:
                    if not await asyncio.to_thread(self.store.heartbeat, run_id, self.worker_id, self.lease_s):
                        cancel.set()
                        return
                    next_heartbeat = now + self.lease_s / 3
            except Exception:
                # No durable ownership confirmation means no more actions.
                cancel.set()
                return
            await asyncio.sleep(min(self.poll_s, self.lease_s / 3))
