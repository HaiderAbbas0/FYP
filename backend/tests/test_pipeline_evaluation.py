"""The pipeline evaluation must stay capable of failing.

A suite that passes 140/140 is only meaningful if it can detect a broken system.
These tests run the harness in a subprocess and assert both halves of that: it
passes on the real code, and it fails on deliberately broken code, naming the
check.

Everything runs out-of-process. The mutation test edits `agents/response/agent.py`
on disk; doing that in-process would leave later tests importing a half-mutated
package. Each run is therefore fully isolated and the repository is restored in
a finally block.

Run from `backend/` with `.venv/Scripts/python -m unittest discover -s tests`.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
REPO = BACKEND.parent
EVIDENCE = REPO / "docs" / "ayesha" / "evidence" / "pipeline-evaluation"
RUNNER = BACKEND / "_pipeline_eval_runner.py"


RUNNER_SOURCE = """import importlib.util, json, os, sys
from pathlib import Path

os.environ["IDS_DETECTOR"] = "multiclass"
os.environ["IDS_AUTH_DEV_LOCALHOST"] = "true"
os.environ["IDS_SESSION_SECRET"] = "a" * 64

spec = importlib.util.spec_from_file_location("pipeline_evaluation", Path(__file__).resolve())
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
report = module.run()
print("__REPORT__" + json.dumps(report))
"""


def run_harness_offprocess() -> dict:
    """Run the harness in a clean interpreter and return its report."""
    with tempfile.TemporaryDirectory() as tmp:
        runner = Path(tmp) / "runner.py"
        runner.write_text(RUNNER_SOURCE, encoding="utf-8")
        # Point the harness at the real module while running from a temp cwd.
        runner_src = RUNNER_SOURCE.replace(
            'Path(__file__).resolve()',
            repr(str(BACKEND / "pipeline_evaluation.py")),
        )
        runner.write_text(runner_src, encoding="utf-8")
        proc = subprocess.run(
            [sys.executable, str(runner)],
            cwd=str(BACKEND),
            capture_output=True,
            text=True,
            timeout=1800,
            env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
        )
    marker = "__REPORT__"
    for line in proc.stdout.splitlines():
        if line.startswith(marker):
            return json.loads(line[len(marker):])
    raise AssertionError(
        f"harness produced no report (exit {proc.returncode})\n"
        f"stdout: {proc.stdout[-1500:]}\nstderr: {proc.stderr[-1500:]}"
    )


class HarnessRunsTests(unittest.TestCase):
    """Every scenario must actually be evaluated, not skipped quietly."""

    @classmethod
    def setUpClass(cls):
        cls.report = run_harness_offprocess()

    def test_every_scenario_is_evaluated(self):
        statuses = {s["scenario"]: s.get("status") for s in self.report["scenarios"]}
        self.assertEqual(len(statuses), 5)
        for key, status in statuses.items():
            with self.subTest(scenario=key):
                self.assertEqual(status, "evaluated", f"{key} did not evaluate")

    def test_all_checks_pass_on_the_real_system(self):
        s = self.report["summary"]
        self.assertEqual(s["checks_failed"], 0, "the committed pipeline should pass")
        self.assertGreater(s["checks_total"], 100)

    def test_all_three_attack_shapes_are_exercised(self):
        self.assertEqual(
            sorted(self.report["coverage"]["attack_shapes_exercised"]),
            ["bandwidth", "connection", "session"],
        )

    def test_each_scenario_routes_to_its_expected_action(self):
        expected = {
            "low": "upstream_rate_limit",
            "medium": "upstream_rate_limit",
            "high": "upstream_rate_limit",
            "mqtt-dos-connect": "connection_cap",
            "mqtt-ddos-publish": "upstream_prefix_ratelimit",
        }
        for s in self.report["scenarios"]:
            with self.subTest(scenario=s["scenario"]):
                self.assertEqual(s["recommended_action"], expected[s["scenario"]])

    def test_fail_closed_checks_are_present(self):
        names = {c["check"] for c in self.report["failure_modes"]}
        for required in (
            "failure.unknown_label_classifies_unknown",
            "failure.low_confidence_escalates",
            "failure.allowlisted_source_escalates",
            "failure.missing_device_context_escalates",
        ):
            self.assertIn(required, names)

    def test_report_records_its_own_scope_limits(self):
        self.assertGreaterEqual(len(self.report["scope_limits"]), 3)
        joined = " ".join(self.report["scope_limits"])
        self.assertIn("suppression", joined)
        self.assertIn("live_lab", joined)

    def test_report_states_the_untested_classes(self):
        coverage = self.report["coverage"]
        self.assertEqual(coverage["declared_classes"], 13)
        self.assertLess(
            len(coverage["variants_exercised"]), coverage["declared_classes"]
        )


class HarnessDetectsFailureTests(unittest.TestCase):
    """Negative control: the harness must fail on a deliberately broken system."""

    def run_with_mutation(self, mutate):
        target = REPO / "agents" / "response" / "agent.py"
        backup = tempfile.mkdtemp()
        shutil.copy(target, Path(backup) / target.name)
        try:
            original = target.read_text(encoding="utf-8")
            mutated = mutate(original)
            self.assertNotEqual(mutated, original, "mutation did not apply")
            target.write_text(mutated, encoding="utf-8")
            for cache in (REPO / "agents").rglob("__pycache__"):
                shutil.rmtree(cache, ignore_errors=True)
            return run_harness_offprocess()
        finally:
            shutil.copy(Path(backup) / target.name, target)
            for cache in (REPO / "agents").rglob("__pycache__"):
                shutil.rmtree(cache, ignore_errors=True)

    @staticmethod
    def _ignore_shape(src):
        return src.replace(
            "shaped = SHAPE_TABLE.get(shape) if candidates else None",
            "shaped = None",
        )

    def test_ignoring_attack_shape_is_detected(self):
        report = self.run_with_mutation(self._ignore_shape)
        self.assertGreater(report["summary"]["checks_failed"], 0)
        failed = {
            c["check"]
            for s in report["scenarios"]
            for c in s.get("checks", [])
            if c["result"] == "FAIL"
        }
        self.assertIn("response.matches_attack_shape", failed)

    def test_a_broken_response_fails_only_the_affected_scenarios(self):
        """Volumetric floods must still pass when shape-awareness is removed."""
        report = self.run_with_mutation(self._ignore_shape)
        by_scenario = {
            s["scenario"]: {c["result"] for c in s.get("checks", [])}
            for s in report["scenarios"]
        }
        self.assertIn("FAIL", by_scenario["mqtt-dos-connect"])
        self.assertIn("FAIL", by_scenario["mqtt-ddos-publish"])
        self.assertNotIn("FAIL", by_scenario["low"])


class RecordedEvidenceTests(unittest.TestCase):
    """The committed report must match what the harness currently produces."""

    def setUp(self):
        path = EVIDENCE / "report.json"
        self.assertTrue(path.exists(), "pipeline-evaluation/report.json is missing")
        self.report = json.loads(path.read_text(encoding="utf-8"))

    def test_recorded_report_has_no_failures(self):
        self.assertEqual(self.report["summary"]["checks_failed"], 0)

    def test_recorded_report_used_the_multiclass_detector(self):
        self.assertEqual(self.report["detector_mode"], "multiclass")

    def test_recorded_report_has_the_canonical_artifacts(self):
        self.assertTrue((EVIDENCE / "checks.csv").exists())
        self.assertTrue((EVIDENCE / "README.md").exists())

    def test_checks_csv_row_count_matches_the_report(self):
        rows = (EVIDENCE / "checks.csv").read_text(encoding="utf-8").strip().splitlines()
        self.assertEqual(len(rows) - 1, self.report["summary"]["checks_total"])


if __name__ == "__main__":
    unittest.main()
