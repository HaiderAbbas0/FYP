"""Every capture path the runtime resolves must exist on disk.

Regression guard. On 12 Oct 2026 the dataset was flattened from `data/detector/`
into `data/`, which silently broke `agents/detector/agent.py` - the legacy
fallback raised FileNotFoundError on every replay while the default multiclass
path kept working, so nothing else noticed. The paths are asserted directly so
the next relocation fails loudly instead.

Run from `backend/` with `.venv/Scripts/python -m unittest discover -s tests`.
"""
import unittest

from agents.detector import captures as caps
from agents.detector.agent import ATTACK_CAPTURE, BENIGN_CAPTURE


class CapturePathTests(unittest.TestCase):
    def test_legacy_detector_captures_exist(self):
        self.assertTrue(BENIGN_CAPTURE.exists(), f"missing benign capture: {BENIGN_CAPTURE}")
        self.assertTrue(ATTACK_CAPTURE.exists(), f"missing attack capture: {ATTACK_CAPTURE}")

    def test_every_registered_attack_capture_exists(self):
        for key, path in caps.ATTACK_CAPTURES.items():
            with self.subTest(capture=key):
                self.assertTrue(path.exists(), f"ATTACK_CAPTURES[{key!r}] -> {path}")

    def test_benign_capture_matches_the_registry_entry(self):
        self.assertEqual(caps.BENIGN_CAPTURE, BENIGN_CAPTURE)

    def test_no_path_still_points_at_the_removed_detector_folder(self):
        """`data/detector/` was removed on 12 Oct 2026."""
        stale = [p for p in (ATTACK_CAPTURE, BENIGN_CAPTURE, *caps.ATTACK_CAPTURES.values())
                 if "detector" in p.parts]
        self.assertEqual(stale, [], f"stale data/detector path(s): {stale}")

    def test_multiclass_sample_captures_exist(self):
        from agents.detector.multiclass import SAMPLE_CAPTURES
        for key, path in SAMPLE_CAPTURES.items():
            with self.subTest(capture=key):
                self.assertTrue(path.exists(), f"SAMPLE_CAPTURES[{key!r}] -> {path}")


class LegacyFallbackTests(unittest.TestCase):
    """The fallback is a real fallback: it must actually produce a timeline."""

    def test_legacy_replay_still_works(self):
        import os
        from unittest.mock import patch
        from app.incidents import build_event, replay_scenario
        with patch.dict(os.environ, {"IDS_DETECTOR": "legacy"}):
            for key in ("low", "medium", "high"):
                with self.subTest(scenario=key):
                    windows, trigger = replay_scenario(key)
                    self.assertTrue(windows)
                    self.assertIsNotNone(trigger, f"{key} produced no detection window")
                    event = build_event(key, trigger)
                    self.assertTrue(0.0 <= event.confidence <= 1.0)

    def test_both_detector_modes_produce_a_detection(self):
        import os
        from unittest.mock import patch
        from app.incidents import replay_scenario
        for mode in ("legacy", "multiclass"):
            with self.subTest(mode=mode):
                with patch.dict(os.environ, {"IDS_DETECTOR": mode}):
                    windows, trigger = replay_scenario("low")
                    self.assertIsNotNone(trigger, f"{mode} produced no detection window")


if __name__ == "__main__":
    unittest.main()
