"""Investigator sub-agents (specialist evidence workers).

Each specialist is an independent, individually-timeoutable worker. They run
concurrently because they have no dependency on each other (pipeline doc §22),
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
fail safe (see `agents._constraints`), which is the correct behaviour - a
fabricated finding would instead have silently unlocked single-IP blocking.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Awaitable, Callable

from .config import settings
from .memory import LIFE_CRITICAL_CLASSES
from .schemas import DetectorEvent, SpecialistResult


def _stat(stats: dict[str, Any], col: str, key: str = "mean") -> float:
    entry = stats.get(col) or {}
    v = entry.get(key)
    return float(v) if v is not None else 0.0


def _ratio(stats: dict[str, Any], col: str) -> float | None:
    entry = stats.get(col) or {}
    r = entry.get("ratio_vs_baseline")
    return float(r) if r is not None else None


async def _timed(name: str, fn: Callable[[], Awaitable[SpecialistResult]], timeout_s: float) -> SpecialistResult:
    started = time.perf_counter()
    try:
        result = await asyncio.wait_for(fn(), timeout=timeout_s)
    except asyncio.TimeoutError:
        return SpecialistResult(
            name=name,
            status="unavailable",
            summary=f"{name} exceeded its {timeout_s:.1f}s budget; no finding returned",
            latency_ms=int(timeout_s * 1000),
        )
    except Exception as exc:  # noqa: BLE001
        return SpecialistResult(name=name, status="unavailable", summary=f"{name} failed: {exc}")
    result.latency_ms = int((time.perf_counter() - started) * 1000)
    return result


# --------------------------------------------------------------------------- #
# individual workers
# --------------------------------------------------------------------------- #
async def log_analysis(event: DetectorEvent, stats: dict[str, Any]) -> SpecialistResult:
    """Connection-state evidence, read from the capture's own TCP counters.

    The feature schema carries no service or authentication logs, so this worker
    reports what the capture genuinely contains: TCP flag counts and connection
    reset behaviour, each against the benign baseline.
    """
    await asyncio.sleep(0.05)
    rst, syn, ack, fin = (_stat(stats, c) for c in ("rst_count", "syn_count", "ack_count", "fin_count"))
    rst_ratio = _ratio(stats, "rst_count")

    # Report the direction the data actually shows. During this flood resets
    # fall well below baseline, which is the opposite of the "connection
    # failures spike" story one might expect - the flood is not completing
    # handshakes at all rather than having them torn down.
    if rst_ratio is not None and rst_ratio < 0.5:
        finding = (
            f"Connection resets are at {rst_ratio:.2f}x the benign baseline - below normal, not above. "
            "Combined with zero SYN/ACK/FIN counts, the flood is not completing or tearing down "
            "handshakes; it is one-directional traffic that never reaches connection state."
        )
    elif rst_ratio is not None and rst_ratio > 1.5:
        finding = f"Connection resets are at {rst_ratio:.2f}x the benign baseline, consistent with mass connection teardown."
    else:
        finding = "Connection-state counters are within normal range for this device."

    return SpecialistResult(
        name="log",
        status="ok",
        findings={
            "provenance": "capture",
            "rst_count_mean": round(rst, 3),
            "rst_count_ratio_vs_baseline": rst_ratio,
            "syn_count_mean": round(syn, 3),
            "ack_count_mean": round(ack, 3),
            "fin_count_mean": round(fin, 3),
            "ack_flag_ratio": _ratio(stats, "ack_flag_number"),
            "not_available": [
                "authentication events", "service/broker logs", "process and CPU telemetry",
            ],
            "reason_unavailable": "CICIoMT2024 features are post-extraction network flows; no host or service logs are in scope",
        },
        summary=finding,
    )


async def threat_intel(event: DetectorEvent, stats: dict[str, Any]) -> SpecialistResult:
    """Advisory only - and, in this PoC, genuinely unavailable.

    Indicator lookup needs source addresses and a reputation feed. The capture
    feature schema contains neither, and no feed is wired up, so this worker
    returns no finding. It is advisory by design, so losing it never blocks
    containment.
    """
    await asyncio.sleep(0.03)
    return SpecialistResult(
        name="threat",
        status="unavailable",
        findings={
            "provenance": "unavailable",
            "reason": (
                "No threat-intelligence feed is configured, and the CICIoMT2024 feature schema carries "
                "no source addresses or host identifiers to look up."
            ),
        },
        summary="No indicator lookup possible: no feed configured and no addresses in the feature schema. Advisory worker, so the run continues.",
    )


async def device_context(event: DetectorEvent, stats: dict[str, Any]) -> SpecialistResult:
    """Clinical role and the hard operational limits for this device class.

    Sourced from the testbed device registry, not from the capture - the feature
    schema has no device identity. Labelled as such.
    """
    await asyncio.sleep(0.04)
    life_critical = event.device_type in LIFE_CRITICAL_CLASSES or event.device_criticality == "Critical"
    return SpecialistResult(
        name="device",
        status="ok",
        findings={
            "provenance": "registry",
            "device_type": event.device_type,
            "criticality": event.device_criticality,
            "life_critical": life_critical,
            "allowed_actions": ["upstream_rate_limit", "temp_source_block", "connection_cap", "alert_escalate"],
            "denied_actions": ["device_isolate", "vlan_quarantine", "port_shutdown"] if life_critical else [],
            "note": "Device identity is testbed metadata; the capture features carry no addresses.",
        },
        summary=(
            f"{event.device_id} is life-critical; isolation is not a permitted action for this class."
            if life_critical
            else f"{event.device_id} is non-critical; the full bounded action set is available."
        ),
    )


async def traffic_analysis(event: DetectorEvent, stats: dict[str, Any]) -> SpecialistResult:
    """Flow-rate and packet-shape profile, computed from the scored window.

    Source cardinality is the one thing it cannot answer: the feature schema has
    no addresses. It says so, and the Policy Gate then refuses single-source
    blocking rather than assuming it would work.
    """
    await asyncio.sleep(0.06)
    rate, rate_r = _stat(stats, "Rate"), _ratio(stats, "Rate")
    size, size_r = _stat(stats, "Tot size"), _ratio(stats, "Tot size")
    hdr_r = _ratio(stats, "Header_Length")

    return SpecialistResult(
        name="traffic",
        status="ok",
        findings={
            "provenance": "capture",
            "flow_rate_mean": round(rate, 2),
            "flow_rate_max": round(_stat(stats, "Rate", "max"), 2),
            "flow_rate_ratio_vs_baseline": rate_r,
            "mean_packet_size": round(size, 2),
            "packet_size_ratio_vs_baseline": size_r,
            "header_length_ratio_vs_baseline": hdr_r,
            "protocol_mix": {
                "TCP": round(_stat(stats, "TCP"), 3),
                "UDP": round(_stat(stats, "UDP"), 3),
                "ICMP": round(_stat(stats, "ICMP"), 3),
                "ARP": round(_stat(stats, "ARP"), 3),
            },
            "source_cardinality": "unknown",
            "source_cardinality_reason": "no source addresses in the CICIoMT2024 feature schema",
        },
        summary=(
            f"Flow rate is {rate_r:.2f}x the benign baseline with mean packet size at {size_r:.2f}x - "
            f"a high-rate flood of undersized packets. Source cardinality is unknown (no addresses in "
            f"the feature schema), so per-source blocking cannot be shown to be effective."
            if rate_r and size_r else
            "Rate profile computed from the scored window; source cardinality unavailable."
        ),
    )


async def history_analysis(event: DetectorEvent, stats: dict[str, Any]) -> SpecialistResult:
    """Recurrence, counted from the real case store.

    Distinct from the Memory Agent: memory asks "have we solved something like
    this before"; this asks "how often has this device seen this family recently".
    Recurrence changes the containment duration, not the action.
    """
    await asyncio.sleep(0.04)
    from .memory import MemoryAgent

    cases = MemoryAgent().cases
    same_device = [c for c in cases if c.device_type == event.device_type]
    same_family = [c for c in same_device if c.attack_subtype == event.attack_subtype]
    harmful = [c for c in same_device if c.outcome.value == "HARMFUL"]

    return SpecialistResult(
        name="history",
        status="ok",
        findings={
            "provenance": "case-store",
            "prior_cases_this_device_class": len(same_device),
            "prior_cases_same_attack_subtype": len(same_family),
            "prior_harmful_outcomes_this_device_class": len(harmful),
            "harmful_case_ids": [c.case_id for c in harmful],
            "suggested_duration_multiplier": 2 if len(same_family) >= 3 else 1,
            "not_available": ["per-source recurrence"],
            "reason_unavailable": "no source addresses in the feature schema, so repeat-offender tracking is out of scope",
        },
        summary=(
            f"{len(same_family)} prior case(s) of {event.attack_subtype} against a {event.device_type}, "
            f"{len(harmful)} of which ended HARMFUL"
            + (f" ({', '.join(c.case_id for c in harmful)})." if harmful else ".")
        ),
    )


# --------------------------------------------------------------------------- #
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
) -> list[SpecialistResult]:
    """Fan out to the selected specialists concurrently, then join.

    The join is the synchronisation barrier: parallelism reduces latency but
    never lets a decision be made on incomplete evidence without that gap being
    recorded.
    """
    stall = stall or set()
    window_stats = stats or {}
    tasks = []
    for name in names:
        fn = REGISTRY[name]

        async def call(f=fn, stalled=(name in stall)):
            if stalled:
                # provoke the timeout path for any specialist, not just one
                await asyncio.sleep(settings.specialist_timeout_s + 1.0)
            return await f(event, window_stats)

        tasks.append(_timed(name, call, settings.specialist_timeout_s))
    return list(await asyncio.gather(*tasks))
