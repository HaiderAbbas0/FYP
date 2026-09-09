"""Export real detector output for the frontend's Local mode.

Local mode must not invent detection numbers. This script runs the actual
RandomForest over the actual CICIoMT2024 capture windows and writes the scored
timelines to `src/data/replays.json`, so the offline replay shows recorded model
output rather than plausible-looking constants.

Re-run whenever the model, the captures or a ReplayProfile changes:

    .venv/Scripts/python export_replays.py
"""

from __future__ import annotations

import asyncio
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# The availability monitor reads its target at import time, so point it at the
# throwaway stub server below before any app module loads.
STUB_PORT = 8123
os.environ.setdefault("GATEWAY_HEALTH_URL", f"http://127.0.0.1:{STUB_PORT}/gateway/health")

from app.detector import get_detector
from app.incidents import (
    DEVICES, SCENARIOS, build_event, detector_artifact, replay_scenario, source_cardinality,
)
from app.llm import LLMClient
from app.memory import MemoryAgent
from app.monitor import GATEWAY
from app.planner import Faults, Planner
from app.specialists import REGISTRY, run_specialists


class _StubHandler(BaseHTTPRequestHandler):
    """Serves the same gateway stub over real HTTP so the recorded probe
    timeline is genuine measurement, not a synthesised curve."""

    def do_GET(self):  # noqa: N802
        code, body = GATEWAY.status()
        payload = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):  # silence per-request logging
        return


def _start_stub() -> ThreadingHTTPServer:
    srv = ThreadingHTTPServer(("127.0.0.1", STUB_PORT), _StubHandler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


async def _record_probe_series(key: str, windows, event, payload) -> list[dict]:
    """Run the real planner once and keep the probe samples it observed."""
    planner = Planner(MemoryAgent(), LLMClient(force_unavailable=True), Faults())
    out: list[dict] = []
    async for e in planner.run(event, key, windows, payload):
        if e.type == "probe" and e.probe:
            out.append(e.probe)
    return out

OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "replays.json"


def main() -> None:
    # Export against the pristine seed store: runs append cases, and exporting
    # from a drifted store would bake one session's history into Local mode.
    from app.config import settings

    settings.cases_path.write_text(
        settings.cases_seed_path.read_text(encoding="utf-8"), encoding="utf-8"
    )
    stub = _start_stub()
    det = get_detector()
    payload = {
        "generated_note": (
            "Real RandomForestClassifier output over CICIoMT2024 capture windows. "
            "Regenerate with backend/export_replays.py."
        ),
        "model": det.info(),
        "scenarios": {},
    }

    for key, scn in SCENARIOS.items():
        windows, trigger = replay_scenario(key)
        if trigger is None:
            raise SystemExit(f"scenario {key} produced no detection")
        event = build_event(key, trigger)
        dev = DEVICES[scn.device_id]

        # Run the real Memory Agent so the offline replay shows the same reuse
        # gate the live runtime applies, not a re-implementation of it.
        mem = MemoryAgent()
        cardinality = source_cardinality(event)
        retrieved = mem.retrieve(event, cardinality)
        band, best = mem.classify(retrieved)

        # Run the real specialist workers over the real window statistics, so
        # the offline replay shows computed findings rather than prose.
        results = asyncio.run(run_specialists(event, list(REGISTRY), trigger.stats))

        # Real 2 Hz HTTP probe timeline, recorded against the stub server above.
        # The LLM is disabled for this recording so the timeline reflects agent
        # work rather than one day's provider latency.
        probe_series = asyncio.run(
            _record_probe_series(key, windows, event, detector_artifact(trigger, event))
        )
        payload["scenarios"][key] = {
            "key": key,
            "name": scn.name,
            "blurb": scn.blurb,
            "device": {
                "id": dev.device_id, "name": dev.name, "type": dev.device_type,
                "criticality": dev.criticality, "ip": dev.ip, "clinical_role": dev.clinical_role,
            },
            "src_ip": scn.src_ip,
            "replay": {
                "windows": scn.profile.windows,
                "rows_per_window": scn.profile.rows_per_window,
                "attack_start": scn.profile.attack_start,
                "attack_ratio": scn.profile.attack_ratio,
                "window_seconds": scn.profile.window_seconds,
            },
            "window_series": [w.to_json() for w in windows],
            "trigger_index": trigger.index,
            "confidence": event.confidence,
            "detector_artifact": detector_artifact(trigger, event),
            "incident": event.model_dump(mode="json"),
            "source_cardinality": cardinality,
            "compared_fields": mem.compared_fields(cardinality),
            "probe_series": probe_series,
            "specialists": {r.name: r.model_dump(mode="json") for r in results},
            "memory": {
                "band": band.value,
                "best_case_id": best.case.case_id if best else None,
                "candidates": [
                    {
                        "case_id": r.case.case_id,
                        "similarity": r.similarity,
                        "prior_outcome": r.case.outcome.value,
                        "reliability": r.case.reliability,
                        "reuse_count": r.case.reuse_count,
                        "device_type": r.case.device_type,
                        "device_criticality": r.case.device_criticality,
                        "executed_response": r.case.executed_response,
                        "gate": "ALLOW" if r.context_compatible else "BLOCK",
                        "reason": r.incompatibility_reason or "context compatible",
                    }
                    for r in retrieved
                ],
            },
        }

    stub.shutdown()
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")
    for k, v in payload["scenarios"].items():
        print(f"  {k}: trigger w{v['trigger_index']} conf {v['confidence']} "
              f"({v['detector_artifact']['flows_classified_attack']}/"
              f"{v['detector_artifact']['flows_scored']} flows) "
              f"| memory {v['memory']['band']} best={v['memory']['best_case_id']} "
              f"| probes {len(v['probe_series'])}")


if __name__ == "__main__":
    main()
