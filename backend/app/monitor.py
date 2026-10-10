"""Service availability monitor - active probing of the edge gateway.

This answers the outcome question the pipeline document asks in §18: *did
legitimate IoMT communication continue or recover?* Detection tells us the
attack is happening; only an independent probe tells us whether the service the
clinicians actually depend on is still answering.

The probe sends **2 HTTP requests per second** to the gateway's health endpoint:

    200          -> service is answering, traffic is healthy
    anything else -> error (5xx, 4xx, timeout, connection refused)

The default standalone monitor performs HTTP requests. The fixture planner
uses an in-memory HTTP MockTransport against its process-local gateway stub.
Those timings measure simulated service behavior and never establish live
legitimate-traffic delivery or attack suppression.

What it probes is configurable via `GATEWAY_HEALTH_URL`. With no testbed wired
up it defaults to the built-in gateway stub (`/gateway/health` in this same
service), which is a stand-in that genuinely goes unhealthy under attack and
recovers after containment. Live outcomes instead use independently collected
cumulative traffic counters through the lab adapter.
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Any

import httpx

log = logging.getLogger(__name__)

#: 2 requests per second
PROBE_INTERVAL_S = 0.5
PROBE_TIMEOUT_S = 1.5

GATEWAY_HEALTH_URL = os.getenv("GATEWAY_HEALTH_URL", "http://127.0.0.1:8099/gateway/health")


@dataclass
class ProbeSample:
    seq: int
    t_offset_s: float
    ok: bool
    status_code: int | None
    latency_ms: int
    error: str | None = None

    def to_json(self) -> dict[str, Any]:
        return {
            "seq": self.seq,
            "t_offset_s": round(self.t_offset_s, 2),
            "ok": self.ok,
            "status_code": self.status_code,
            "latency_ms": self.latency_ms,
            "error": self.error,
        }


# --------------------------------------------------------------------------- #
# The stub being probed
# --------------------------------------------------------------------------- #
class GatewayStub:
    """Stand-in for the edge gateway's health endpoint.

    Deliberately dumb: it holds a state that the incident run drives, and
    answers HTTP accordingly. It exists so the monitor has something real to
    talk to before the testbed gateway exists. It is NOT a traffic simulator -
    it models exactly one thing, whether the service answers.
    """

    #: how long after containment before the service actually comes back. The
    #: monitor measures this rather than being told it, so time-to-recovery is
    #: an observed lag and not a constant we print.
    RECOVERY_LAG_S = 1.6

    def __init__(self) -> None:
        self.saturated_at: float | None = None
        self.contained_at: float | None = None

    def reset(self) -> None:
        self.saturated_at = None
        self.contained_at = None

    def mark_saturated(self) -> None:
        self.saturated_at = time.time()
        self.contained_at = None

    def mark_contained(self) -> None:
        self.contained_at = time.time()

    def mark_containment_rolled_back(self) -> None:
        """Restore the simulated pre-containment outage while attack is active."""
        self.saturated_at = time.time()
        self.contained_at = None

    @property
    def healthy(self) -> bool:
        if self.saturated_at is None:
            return True
        if self.contained_at is None:
            return False
        return (time.time() - self.contained_at) >= self.RECOVERY_LAG_S

    def status(self) -> tuple[int, dict[str, Any]]:
        if self.healthy:
            return 200, {"status": "ok", "detail": "gateway answering, legitimate traffic flowing"}
        return 503, {"status": "unavailable", "detail": "gateway saturated, legitimate traffic not being served"}


GATEWAY = GatewayStub()


# --------------------------------------------------------------------------- #
# The monitor
# --------------------------------------------------------------------------- #
@dataclass
class AvailabilityMonitor:
    """Polls the gateway health endpoint at 2 Hz for the life of an incident."""

    url: str = GATEWAY_HEALTH_URL
    interval_s: float = PROBE_INTERVAL_S
    transport: httpx.AsyncBaseTransport | None = None
    samples: list[ProbeSample] = field(default_factory=list)
    _task: asyncio.Task | None = None
    _t0: float = 0.0
    _stop: asyncio.Event | None = None
    _drained_count: int = 0

    def start(self) -> None:
        self._t0 = time.time()
        self._stop = asyncio.Event()
        self._task = asyncio.create_task(self._loop())

    async def _loop(self) -> None:
        seq = 0
        async with httpx.AsyncClient(timeout=PROBE_TIMEOUT_S, transport=self.transport) as client:
            while self._stop is not None and not self._stop.is_set():
                started = time.perf_counter()
                try:
                    r = await client.get(self.url)
                    sample = ProbeSample(
                        seq=seq,
                        t_offset_s=time.time() - self._t0,
                        ok=r.status_code == 200,
                        status_code=r.status_code,
                        latency_ms=int((time.perf_counter() - started) * 1000),
                    )
                except Exception as exc:  # noqa: BLE001 - unreachable is a result, not a crash
                    sample = ProbeSample(
                        seq=seq,
                        t_offset_s=time.time() - self._t0,
                        ok=False,
                        status_code=None,
                        latency_ms=int((time.perf_counter() - started) * 1000),
                        error=f"{type(exc).__name__}: {exc}" if str(exc) else type(exc).__name__,
                    )
                self.samples.append(sample)
                seq += 1
                try:
                    await asyncio.wait_for(self._stop.wait(), timeout=self.interval_s)
                except asyncio.TimeoutError:
                    pass

    async def stop(self) -> None:
        if self._stop is not None:
            self._stop.set()
        if self._task is not None:
            try:
                await asyncio.wait_for(self._task, timeout=2.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                self._task.cancel()
                await asyncio.gather(self._task, return_exceptions=True)

    @classmethod
    def for_stub(cls):
        def handler(request):
            status, body = GATEWAY.status()
            return httpx.Response(status, json=body)
        return cls(url='http://gateway.stub/health', transport=httpx.MockTransport(handler))

    def drain(self) -> list[ProbeSample]:
        """Samples collected since the last drain, for incremental streaming."""
        out = self.samples[self._drained_count:]
        self._drained_count = len(self.samples)
        return out

    # ------------------------------------------------------------------ #
    def _pct(self, samples: list[ProbeSample]) -> float | None:
        if not samples:
            return None
        return round(100 * sum(1 for s in samples if s.ok) / len(samples), 1)

    def report(
        self,
        action_applied_at: float | None,
        attack_started_at: float | None = None,
    ) -> dict[str, Any]:
        """Measured availability, computed from the probe samples alone.

        Reported per phase as well as overall. A single whole-run number is
        misleading here: it averages a deliberate outage with the healthy
        periods either side, so it says more about how long we watched than
        about how well the response worked.
        """
        total = len(self.samples)
        if total == 0:
            return {
                "measured": False,
                "reason": "no probe samples collected",
                "probe_url": self.url,
            }

        ok = sum(1 for s in self.samples if s.ok)
        failures = [s for s in self.samples if not s.ok]

        first_failure = failures[0].t_offset_s if failures else None
        # First success strictly after the action was applied - the moment the
        # service actually started answering again.
        recovery_at = None
        if action_applied_at is not None:
            rel = action_applied_at - self._t0
            recovery_at = next(
                (s.t_offset_s for s in self.samples if s.ok and s.t_offset_s > rel), None
            )

        latencies = [s.latency_ms for s in self.samples if s.ok]

        # phase boundaries, relative to probe start
        atk_rel = (attack_started_at - self._t0) if attack_started_at else None
        act_rel = (action_applied_at - self._t0) if action_applied_at else None
        baseline = [s for s in self.samples if atk_rel is not None and s.t_offset_s < atk_rel]
        during = [
            s for s in self.samples
            if atk_rel is not None and act_rel is not None and atk_rel <= s.t_offset_s < act_rel
        ]
        after = [s for s in self.samples if act_rel is not None and s.t_offset_s >= act_rel]
        # Availability once the service is actually back, excluding the recovery
        # lag itself - otherwise this number just measures how fast we stopped
        # watching after the first 200.
        rec_rel = recovery_at
        post_recovery = [s for s in self.samples if rec_rel is not None and s.t_offset_s >= rec_rel]

        return {
            "measured": True,
            "baseline_availability_pct": self._pct(baseline),
            "during_attack_availability_pct": self._pct(during),
            "post_action_availability_pct": self._pct(after),
            "post_recovery_availability_pct": self._pct(post_recovery),
            "phase_sample_counts": {
                "baseline": len(baseline), "during_attack": len(during),
                "post_action": len(after), "post_recovery": len(post_recovery),
            },
            "probe_url": self.url,
            "probe_rate_hz": round(1 / self.interval_s, 1),
            "requests_sent": total,
            "responses_200": ok,
            "responses_error": total - ok,
            "availability_pct_whole_run": round(100 * ok / total, 1),
            "attack_started_at_s": round(atk_rel, 2) if atk_rel is not None else None,
            "first_failure_at_s": round(first_failure, 2) if first_failure is not None else None,
            "action_applied_at_s": round(action_applied_at - self._t0, 2) if action_applied_at else None,
            "recovered_at_s": round(recovery_at, 2) if recovery_at is not None else None,
            "time_to_recovery_s": (
                round(recovery_at - (action_applied_at - self._t0), 2)
                if recovery_at is not None and action_applied_at is not None
                else None
            ),
            "outage_duration_s_note": "attack onset to service recovery; includes the full agent reasoning time",
            "outage_duration_s": (
                round(recovery_at - first_failure, 2)
                if recovery_at is not None and first_failure is not None
                else None
            ),
            "mean_ok_latency_ms": int(sum(latencies) / len(latencies)) if latencies else None,
            "status_codes_seen": sorted({s.status_code for s in self.samples if s.status_code}),
        }
