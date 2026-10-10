"""Run paired seeded fixtures against the authenticated runtime API."""
import argparse
import asyncio
import os
import json
import time
from pathlib import Path

import httpx

from app.evaluation import export, run_paired


async def main(args):
    key = os.getenv("IDS_API_KEY", os.getenv("IOMT_API_KEY", ""))
    headers = {"Authorization": f"Bearer {key}"} if key else {}
    async with httpx.AsyncClient(base_url=args.url, headers=headers, timeout=30) as client:
        health = (await client.get("/api/health"))
        health.raise_for_status()
        health = health.json()
        memory = await client.get("/api/memory/cases")
        memory.raise_for_status()
        snapshot = memory.json().get("cases", [])
        async def execute(case, profile, seed):
            response = await client.post("/api/runs", json={**case, "fixture_seed": seed, "evaluation_profile": profile, "evaluation_memory_snapshot": snapshot, "speed": args.speed, "faults": {**case.get("faults", {}), "llmDown": True}})
            response.raise_for_status()
            run_id = response.json()["run_id"]
            deadline = time.monotonic() + args.timeout
            while time.monotonic() < deadline:
                run = await client.get(f"/api/runs/{run_id}")
                run.raise_for_status()
                body = run.json()
                status = body.get("run", body).get("status")
                if status in {"completed", "failed", "cancelled", "safe_hold", "escalated", "interrupted"}:
                    rows = body.get("events")
                    if rows is None:
                        journal = await client.get(f"/api/runs/{run_id}/journal")
                        journal.raise_for_status()
                        rows = journal.json().get("events", [])
                    return rows
                await asyncio.sleep(.1)
            raise TimeoutError(f"run {run_id} did not terminate within {args.timeout}s")
        cases = [{"scenario": scenario, "source_mode": "fixture", "faults": faults} for scenario in ("low", "medium", "high") for faults in ({}, {"memoryDown": True}, {"subAgentTimeout": True}, {"policyConflict": True}, {"plannerCrash": True})]
        # Only public reproducibility fields are frozen; never key/provider secrets.
        def persist_manifest(manifest):
            destination = Path(args.output)
            destination.mkdir(parents=True, exist_ok=True)
            (destination / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
        report = await run_paired(cases, execute, model={"source": "synthetic-fixture-v1"}, config={"code_hash": health.get('code_hash'), "thresholds": health.get("thresholds"), "verified_reuse": health.get("verified_case_reuse_enabled"), "speed": args.speed, "llm": "forced-unavailable"}, case_snapshot=snapshot, seed=args.seed, on_manifest=persist_manifest)
        export(report, Path(args.output))
        print(f"Exported {len(report['runs'])} persisted runs to {args.output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8099")
    parser.add_argument("--output", default="evaluation-results")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--speed", type=float, default=20)
    parser.add_argument("--timeout", type=float, default=180)
    asyncio.run(main(parser.parse_args()))
