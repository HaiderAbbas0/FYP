"""Independent cumulative counters, measured windows and conservative labels."""
from __future__ import annotations

import math
import asyncio
from typing import Callable, Awaitable
from typing import Literal

from pydantic import BaseModel, Field

from .schemas import Outcome, OutcomeReport


class CounterSample(BaseModel):
    target_id: str
    sensor_id: str
    provenance: Literal["live_lab", "fixture", "stub"]
    timestamp: float = Field(gt=0, allow_inf_nan=False)
    malicious_packets: int = Field(ge=0, le=2**63-1)
    legitimate_attempts: int = Field(ge=0, le=2**63-1)
    legitimate_successes: int = Field(ge=0, le=2**63-1)
    latency_ms: float = Field(ge=0, allow_inf_nan=False)


class IndependentTelemetry:
    """Collect sensor counters across action boundary without inventing samples."""

    def __init__(self, fetch: Callable[[str], Awaitable[CounterSample]], target_id: str,
                 interval_s: float = 1, max_samples: int = 600) -> None:
        self.fetch, self.target_id = fetch, target_id
        self.interval_s = max(.1, interval_s)
        self.max_samples = max_samples
        self.samples: list[CounterSample] = []
        self.errors: list[str] = []
        self._task: asyncio.Task | None = None
        self._stop = asyncio.Event()

    def start(self) -> None:
        if self._task is not None:
            raise RuntimeError("Telemetry sampler already started")
        self._task = asyncio.create_task(self._loop())

    async def _loop(self) -> None:
        while not self._stop.is_set() and len(self.samples) < self.max_samples:
            try:
                sample = await self.fetch(self.target_id)
                if sample.target_id != self.target_id:
                    raise ValueError("Telemetry target mismatch")
                self.samples.append(sample)
            except Exception as exc:
                self.errors.append(f"{type(exc).__name__}: telemetry unavailable")
                self.errors = self.errors[-100:]
            try:
                await asyncio.wait_for(self._stop.wait(), self.interval_s)
            except asyncio.TimeoutError:
                pass

    async def stop(self) -> None:
        self._stop.set()
        if self._task:
            await self._task

    def windows(self, action_applied_at: float) -> tuple[list[CounterSample], list[CounterSample]]:
        return ([s for s in self.samples if s.timestamp < action_applied_at],
                [s for s in self.samples if s.timestamp >= action_applied_at])


def validate_outcome(
    baseline: list[CounterSample], post: list[CounterSample], *,
    action_applied_at: float, target_id: str, independent_sensor_id: str,
    containment_latency_s: float = 0, min_samples: int = 3, hold_s: float = 5,
    suppression_threshold: float = 90, availability_threshold: float = 99,
    partial_suppression_threshold: float = 50, availability_floor: float = 90,
    max_availability_loss: float = 5, max_latency_ms: float = 1000,
    threshold_version: str = "outcomes-v1",
) -> OutcomeReport:
    def unknown(reason: str) -> OutcomeReport:
        return OutcomeReport(outcome=Outcome.UNVALIDATED, malicious_traffic_drop_pct=-1,
                             legitimate_availability_pct=-1, latency_recovered_s=-1,
                             collateral_disruption=False, rollback_required=False,
                             containment_latency_s=containment_latency_s, basis=reason)

    if min_samples < 2 or hold_s <= 0:
        raise ValueError("validation requires at least two samples and a positive hold window")
    if (not 0 <= partial_suppression_threshold <= suppression_threshold <= 100 or
            not 0 <= availability_floor <= availability_threshold <= 100 or
            max_latency_ms <= 0 or max_availability_loss < 0):
        raise ValueError("Invalid outcome thresholds")
    if len(baseline) < min_samples or len(post) < min_samples:
        return unknown("missing baseline or post-action minimum sample count")
    all_samples = baseline + post
    if any(s.legitimate_successes > s.legitimate_attempts for s in all_samples):
        return unknown("inconsistent cumulative legitimate delivery counters")
    if any(s.provenance != "live_lab" or s.target_id != target_id or
           s.sensor_id != independent_sensor_id for s in all_samples):
        return unknown("telemetry is not bound to the independent live lab sensor and target")
    if any(not math.isfinite(s.timestamp) or not math.isfinite(s.latency_ms) for s in all_samples):
        return unknown("non-finite telemetry")
    if baseline[-1].timestamp > action_applied_at or post[0].timestamp < action_applied_at:
        return unknown("telemetry windows cross the action boundary")
    for window in (baseline, post):
        if window[-1].timestamp - window[0].timestamp < hold_s:
            return unknown("insufficient sustained observation window")
        for before, after in zip(window, window[1:]):
            if after.timestamp <= before.timestamp or any(getattr(after, key) < getattr(before, key)
               for key in ("malicious_packets", "legitimate_attempts", "legitimate_successes")):
                return unknown("counter reset or non-monotonic telemetry")
    if any(getattr(post[0], key) < getattr(baseline[-1], key) for key in
           ("malicious_packets", "legitimate_attempts", "legitimate_successes")):
        return unknown("counter reset across the action boundary")
    def rates(window: list[CounterSample]) -> tuple[float, float]:
        first, last = window[0], window[-1]
        attempts = last.legitimate_attempts - first.legitimate_attempts
        successes = last.legitimate_successes - first.legitimate_successes
        if attempts <= 0 or successes > attempts:
            raise ValueError("missing legitimate attempts or inconsistent success counter")
        return ((last.malicious_packets - first.malicious_packets) / (last.timestamp - first.timestamp),
                successes * 100 / attempts)
    try:
        before_rate, before_availability = rates(baseline)
        after_rate, availability = rates(post)
    except ValueError as exc:
        return unknown(str(exc))
    if before_rate <= 0:
        return unknown("baseline has no measured malicious traffic")
    drop = 100 * (1 - after_rate / before_rate)
    harmful = (availability < availability_floor or availability < before_availability - max_availability_loss
               or any(s.latency_ms > max_latency_ms for s in post))
    label = Outcome.HARMFUL if harmful else Outcome.SUCCESS if drop >= suppression_threshold and availability >= availability_threshold else Outcome.PARTIAL if drop >= partial_suppression_threshold else Outcome.FAILURE
    recovered_at = next((s.timestamp for s in post if s.latency_ms <= max_latency_ms), None)
    return OutcomeReport(outcome=label, malicious_traffic_drop_pct=round(drop, 2),
                         legitimate_availability_pct=round(availability, 2),
                         latency_recovered_s=round(recovered_at - action_applied_at, 2) if recovered_at is not None else -1,
                         collateral_disruption=harmful, rollback_required=harmful,
                         containment_latency_s=containment_latency_s,
                         basis=f"Independent live lab cumulative counters; baseline and sustained post-action windows; thresholds={threshold_version}")
