import asyncio
import unittest
from types import SimpleNamespace

from app.evaluation import digest, percentile, run_paired, summarize
from app.sources import prepare


class EvaluationTests(unittest.TestCase):
    def test_hash_is_canonical_and_sensitive(self):
        self.assertEqual(digest({"a": 1, "b": 2}), digest({"b": 2, "a": 1}))
        self.assertNotEqual(digest({"a": 1}), digest({"a": 2}))

    def test_percentiles_and_missing_measurements(self):
        self.assertEqual(percentile([10, 20], .95), 19.5)
        self.assertIsNone(percentile([], .5))
        self.assertIsNone(summarize([{"type": "run.start", "ts": 0}], "fixture")["latency_ms"])

    def test_duplicate_node_events_do_not_double_worker_count(self):
        events = [{"type": "node.enter", "node": "sub.traffic"}, {"type": "node.enter", "node": "sub.traffic"}, {"type": "node.enter", "node": "sub.device"}]
        summary = summarize(events, "fixture")
        self.assertEqual(summary["specialist_count"], 2)
        self.assertIsNone(summary["worker_cpu_ms"])
        self.assertIsNone(summary["safety_wrong_reuse"])

    def test_fixture_success_cannot_be_real_success(self):
        events = [{"type": "run.start", "ts": 0}, {"type": "artifact", "title": "Outcome", "payload": {"measurement_source": "independent_lab", "validated": True}}, {"type": "run.end", "ts": 1.5, "outcome": "SUCCESS"}]
        self.assertFalse(summarize(events, "fixture")["real_validated_success"])
        self.assertTrue(summarize(events, "live_lab")["real_validated_success"])
        self.assertEqual(summarize(events, "fixture")["latency_ms"], 1500)

    def test_paired_runs_share_inputs_and_seed(self):
        calls = []
        async def execute(case, profile, seed):
            calls.append((case, profile, seed))
            return [{"type": "run.start", "ts": 0}, {"type": "run.end", "ts": 1, "outcome": "UNVALIDATED"}]
        report = asyncio.run(run_paired([{"scenario": "low", "source_mode": "fixture"}], execute, model={}, config={}, case_snapshot=[], seed=7))
        self.assertEqual(len(calls), 3)
        self.assertEqual({c[2] for c in calls}, {7})
        self.assertEqual(len({r["pair_id"] for r in report["runs"]}), 1)
        self.assertEqual(report["summary"]["full_baseline"]["unvalidated_rate"], 1)

    def test_live_ablations_are_rejected_before_execution(self):
        def forbidden(*args):
            self.fail("live ablation executed")
        with self.assertRaises(ValueError):
            asyncio.run(run_paired([{"source_mode": "live_lab"}], forbidden, model={}, config={}, case_snapshot=[]))

    def test_fixture_seed_and_provenance_are_reproducible(self):
        request = SimpleNamespace(source_mode="fixture", scenario="medium", fixture_seed=7)
        first = prepare(request)
        second = prepare(request)
        self.assertEqual(first[2]["fixture_hash"], second[2]["fixture_hash"])
        self.assertEqual(first[1].model_dump(), second[1].model_dump())
        self.assertEqual(first[1].detector_source, "synthetic")
        with self.assertRaises(ValueError):
            prepare(SimpleNamespace(source_mode="live_lab", incident_detector=first[1]))

    def test_live_registry_and_nonfinite_evidence_fail_closed(self):
        fixture = prepare(SimpleNamespace(source_mode="fixture", scenario="medium", fixture_seed=7))[1]
        fixture.detector_source = "model"
        fixture.dst_ip = "203.0.113.2"
        with self.assertRaises(ValueError):
            prepare(SimpleNamespace(source_mode="live_lab", incident_detector=fixture))
        fixture.dst_ip = "10.0.0.5"
        with self.assertRaises(ValueError):
            prepare(SimpleNamespace(source_mode="live_lab", incident_detector=fixture, window_stats={"Rate": {"mean": float("nan"), "max": 2, "baseline_mean": 1, "ratio_vs_baseline": 2}}))
