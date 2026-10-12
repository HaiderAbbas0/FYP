"""Shared specialist helpers: statistics, supervision and evidence narrative.

Kept separate from the individual workers so each worker module contains one
agent and nothing else. Nothing here is worker-specific policy.
"""

from __future__ import annotations

import asyncio
import math
import time
import weakref
from typing import Any, Awaitable, Callable

from agents.detector.confidence import event_confidence_fields
from app.attack_class import FAMILY_CONNECTION, FAMILY_SESSION, classify, label_uncertainty
from app.config import settings
from app.memory import LIFE_CRITICAL_CLASSES
from app.schemas import DetectorEvent, SpecialistResult

_WORKER_LIMITS: weakref.WeakKeyDictionary = weakref.WeakKeyDictionary()


def _stat(stats: dict[str, Any], col: str, key: str = "mean") -> float:
    entry = stats.get(col) or {}
    v = entry.get(key)
    return float(v) if v is not None else 0.0


def _ratio(stats: dict[str, Any], col: str) -> float | None:
    entry = stats.get(col) or {}
    r = entry.get("ratio_vs_baseline")
    return float(r) if r is not None else None


def _missing_stats(stats: dict[str, Any], required: tuple[str, ...]) -> list[str]:
    missing = []
    for column in required:
        try:
            value = stats[column]["mean"]
            if value is None or not math.isfinite(float(value)):
                missing.append(column)
        except (KeyError, TypeError, ValueError):
            missing.append(column)
    return missing


async def _timed(
    name: str,
    fn: Callable[[], Awaitable[SpecialistResult]],
    timeout_s: float,
    *,
    run_id: str,
    run_started_at: float,
    synthetic: bool = False,
) -> SpecialistResult:
    started = time.perf_counter()
    common = {
        "name": name,
        "run_id": run_id,
        "worker_id": f"{run_id}:{name}",
        "started_offset_ms": max(0, int((started - run_started_at) * 1000)),
    }
    try:
        result = await asyncio.wait_for(fn(), timeout=timeout_s)
    except asyncio.TimeoutError:
        return SpecialistResult(
            status="unavailable",
            provenance="unavailable",
            summary=f"{name} exceeded its {timeout_s:.1f}s budget; no finding returned",
            latency_ms=int(timeout_s * 1000),
            **common,
        )
    except Exception as exc:  # noqa: BLE001
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        return SpecialistResult(
            status="unavailable", provenance="unavailable",
            summary=f"{name} failed: {str(exc)[:300]}", latency_ms=elapsed_ms, **common,
        )

    # Treat malformed worker output as an evidence gap. In particular, never
    # let one malformed result fail the join or masquerade as another worker.
    try:
        result = SpecialistResult.model_validate(result)
        if result.name != name:
            raise ValueError(f"worker returned name {result.name!r}, expected {name!r}")
        if len(result.model_dump_json().encode("utf-8")) > 24_000:
            raise ValueError("worker output exceeded the 24 KB finding limit")
    except Exception as exc:  # noqa: BLE001
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        return SpecialistResult(
            status="unavailable", provenance="unavailable",
            summary=f"{name} returned malformed evidence: {str(exc)[:300]}",
            latency_ms=elapsed_ms, **common,
        )

    provenance = result.findings.get("provenance", "unavailable")
    if result.status != "ok" or provenance not in ("capture", "fixture", "registry", "case-store", "unavailable"):
        provenance = "unavailable"
    if synthetic and name in ("log", "traffic") and result.status == "ok":
        provenance = "fixture"
        result.findings["provenance"] = "fixture"
    result.latency_ms = int((time.perf_counter() - started) * 1000)
    result.run_id = run_id
    result.worker_id = f"{run_id}:{name}"
    result.provenance = provenance
    result.started_offset_ms = common["started_offset_ms"]
    return result

# --------------------------------------------------------------------------- #
# evidence narrative helpers
# --------------------------------------------------------------------------- #
def _traffic_summary(shape: str, rate_r: float | None, size_r: float | None) -> str:
    """Describe the traffic that is actually present, not a generic flood.

    The previous wording asserted "a high-rate flood of undersized packets" for
    every incident. That is true of a volumetric flood and false of an MQTT
    publish flood, which rides an established connection and exhausts broker
    sessions rather than bandwidth. Reporting the TCP story for a session attack
    misleads the Investigator even when the underlying numbers are correct.
    """
    if rate_r is None or size_r is None:
        return "Rate profile computed from the scored window; source cardinality unavailable."
    profile = (
        f"Flow rate is {rate_r:.2f}x the benign baseline with mean packet size at {size_r:.2f}x"
    )
    if shape == FAMILY_CONNECTION:
        return (
            f"{profile}. This is a connection-state attack: the contended resource is the connection "
            "table rather than bandwidth, so the rate profile understates the damage and the attack "
            "may look mild until connections exhaust."
        )
    if shape == FAMILY_SESSION:
        return (
            f"{profile}. This is an application-session attack carried over established connections: "
            "bandwidth and packet size stay close to normal, so rate-based containment alone will not "
            "show an effect. The pressure is on broker sessions and topic fan-out."
        )
    return (
        f"{profile} - a high-rate flood of undersized packets. Source cardinality is unknown (no "
        "addresses in the feature schema), so per-source blocking cannot be shown to be effective."
    )


def _connection_state_summary(shape: str, rst_ratio: float | None) -> str:
    """Report what the TCP counters can and cannot say about this attack.

    Connection flags are meaningful for connection-state attacks. For a session
    or volumetric attack they are corroboration at best, and saying they show
    "no connection activity" would read as a clean bill of health when in fact
    it only means the attack never needed them.
    """
    if shape == FAMILY_CONNECTION and rst_ratio is not None and rst_ratio < 0.5:
        return (
            f"Connection resets are at {rst_ratio:.2f}x the benign baseline - below normal, not above. "
            "For a connection-state attack this is the expected signature: the flood is not completing "
            "or tearing down handshakes, it is one-directional traffic that never reaches connection state."
        )
    if shape == FAMILY_SESSION:
        return (
            "TCP connection-state counters are not diagnostic for this attack: an application-session "
            "flood rides established connections, so low SYN/ACK/RST activity means the attack did not "
            "need to open new connections, not that connections are healthy."
        )
    if rst_ratio is not None and rst_ratio < 0.5:
        return (
            f"Connection resets are at {rst_ratio:.2f}x the benign baseline - below normal, not above. "
            "The flood is not completing or tearing down handshakes; it is one-directional traffic that "
            "never reaches connection state."
        )
    if rst_ratio is not None and rst_ratio > 1.5:
        return f"Connection resets are at {rst_ratio:.2f}x the benign baseline, consistent with mass connection teardown."
    return "Connection-state counters are within normal range for this device."

