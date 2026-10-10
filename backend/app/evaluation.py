"""Paired architecture experiments from persisted runtime evidence."""
from __future__ import annotations

import csv
import hashlib
import inspect
import json
import math
from collections import Counter
from pathlib import Path
from typing import Any, Callable

PROFILES = ("full_baseline", "context_gated", "similarity_only")


def digest(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def percentile(values: list[float], fraction: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = (len(ordered) - 1) * fraction
    lower = math.floor(index)
    upper = math.ceil(index)
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (index - lower)


def summarize(events: list[dict], source_mode: str) -> dict:
    # Rows may be raw events or persisted journal envelopes.
    stream = [row.get("event", row.get("payload", row)) if "type" not in row else row for row in events]
    stream = [e for e in stream if isinstance(e, dict)]
    starts = [e["ts"] for e in stream if e.get("type") == "run.start"]
    ends = [e for e in stream if e.get("type") == "run.end"]
    latency = 1000 * max(0., ends[-1]["ts"] - starts[0]) if starts and ends else None
    outcome = ends[-1].get("outcome") if ends else None
    outcomes = [e.get("payload", {}) for e in stream if e.get("type") == "artifact" and "outcome" in str(e.get("title", "")).lower()]
    independent = any(isinstance(p, dict) and p.get("measurement_source") == "independent_lab" and p.get("validated") is True for p in outcomes)
    real_success = source_mode == "live_lab" and outcome == "SUCCESS" and independent
    workers = {e.get("node") for e in stream if e.get("type") == "node.enter" and str(e.get("node", "")).startswith("sub.")}
    # Nodes may emit enter twice around fan-in; count actual distinct workers.
    resource_metrics = {e.get("key"): e.get("value") for e in stream if e.get("type") == "metric"}
    stages = {'queue_wait_ms': resource_metrics.get('queueWaitMs')}
    for node in ('detector', 'memory', 'investigator', 'explainer', 'response', 'policy', 'actuator'):
        enters = [e['ts'] for e in stream if e.get('type') == 'node.enter' and e.get('node') == node]
        exits = [e['ts'] for e in stream if e.get('type') == 'node.exit' and e.get('node') == node and e.get('status') != 'skipped']
        stages[f'{node}_elapsed_ms'] = round(1000 * max(0, max(exits) - min(enters)), 3) if enters and exits else None
    return {"latency_ms": latency, **stages, "specialist_count": len(workers), "outcome": outcome, "complete": bool(ends), "unvalidated": outcome == "UNVALIDATED", "real_validated_success": real_success, "event_count": len(stream), "worker_cpu_ms": resource_metrics.get("workerCpuMs"), "worker_peak_rss_bytes": resource_metrics.get("workerPeakRssBytes"), "safety_wrong_reuse": None}


async def run_paired(cases: list[dict], execute: Callable, *, model: dict, config: dict, case_snapshot: list[dict], seed: int = 42, on_manifest: Callable | None = None) -> dict:
    """execute(case, profile, seed) must return the persisted event journal.

    The caller owns runtime integration and frozen memory provisioning. Config
    must contain no credentials; provider identity and public settings suffice.
    """
    manifest = {"version": 1, "seed": seed, "profiles": list(PROFILES), "model_hash": digest(model), "config_hash": digest(config), "memory_hash": digest(case_snapshot), "cases_hash": digest(cases), "cases": cases}
    manifest["manifest_hash"] = digest(manifest)
    if on_manifest:
        saved = on_manifest(manifest)
        if inspect.isawaitable(saved):
            await saved
    rows = []
    for index, case in enumerate(cases):
        mode = case.get("source_mode", "fixture")
        if mode == "live_lab":
            raise ValueError("paired ablations require fixture or capture_replay; similarity_only cannot execute live_lab")
        pair_id = digest({"case": case, "seed": seed + index})[:16]
        for profile in PROFILES:
            events = execute(case, profile, seed + index)
            if inspect.isawaitable(events):
                events = await events
            rows.append({"pair_id": pair_id, "case_index": index, "seed": seed + index, "profile": profile, "source_mode": mode, "journal_hash": digest(events), **summarize(events, mode)})
    summary = {}
    for profile in PROFILES:
        group = [r for r in rows if r["profile"] == profile]
        latencies = [r["latency_ms"] for r in group if r["latency_ms"] is not None]
        summary[profile] = {"runs": len(group), "completed": sum(r["complete"] for r in group), "latency_p50_ms": percentile(latencies, .5), "latency_p95_ms": percentile(latencies, .95), "specialist_count": sum(r["specialist_count"] for r in group), "unvalidated_rate": sum(r["unvalidated"] for r in group) / len(group) if group else None, "outcome_counts": dict(Counter(r["outcome"] or "MISSING" for r in group)), "real_validated_successes": sum(r["real_validated_success"] for r in group)}
    comparisons = []
    for pair in sorted({r["pair_id"] for r in rows}):
        group = {r["profile"]: r for r in rows if r["pair_id"] == pair}
        baseline = group["full_baseline"]
        for profile in PROFILES[1:]:
            current = group[profile]
            comparisons.append({"pair_id": pair, "profile": profile, "latency_delta_ms": current["latency_ms"] - baseline["latency_ms"] if current["latency_ms"] is not None and baseline["latency_ms"] is not None else None, "specialist_delta": current["specialist_count"] - baseline["specialist_count"]})
    return {"manifest": manifest, "runs": rows, "summary": summary, "paired_comparisons": comparisons, "limitations": ["Fixture outcomes are synthetic and cannot establish clinical safety or detector accuracy", "Latency is measured from persisted event offsets; incomplete runs have no completion latency"]}


def export(report: dict, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "report.json").write_text(json.dumps(report, indent=2, allow_nan=False), encoding="utf-8")
    (destination / "manifest.json").write_text(json.dumps(report["manifest"], indent=2), encoding="utf-8")
    if report["runs"]:
        with (destination / "runs.csv").open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(report["runs"][0]))
            writer.writeheader()
            writer.writerows(report["runs"])
