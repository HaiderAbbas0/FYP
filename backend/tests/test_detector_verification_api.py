"""The detector API must not imply accuracy it has not established.

The bundle declares 13 classes. The held-out evidence covers 6 of them, and
actively contradicts separability for two of those six. These tests pin that the
API reports that distinction rather than returning a bare label list.

Run from `backend/` with `.venv/Scripts/python -m unittest discover -s tests`.
"""
import json
import tempfile
import unittest
from pathlib import Path

from agents.detector.captures import VARIANT_CLASSES
from agents.detector import verification as V


class VerificationStandardTests(unittest.TestCase):
    """The standard is stated, falsifiable and explicit."""

    def test_standard_declares_its_thresholds(self):
        s = V.VERIFICATION_STANDARD
        for key in ("min_support", "min_recall", "min_precision", "source", "note"):
            self.assertIn(key, s)

    def test_thresholds_are_numeric_and_sane(self):
        s = V.VERIFICATION_STANDARD
        self.assertIsInstance(s["min_support"], int)
        self.assertGreater(s["min_support"], 0)
        self.assertTrue(0.0 < s["min_recall"] <= 1.0)
        self.assertTrue(0.0 < s["min_precision"] <= 1.0)


class EvidenceAbsenceTests(unittest.TestCase):
    """With no recorded evaluation, nothing may be reported as verified."""

    def test_missing_evidence_verifies_nothing(self):
        original = V.EVIDENCE_DIR
        with tempfile.TemporaryDirectory() as tmp:
            V.EVIDENCE_DIR = Path(tmp)
            try:
                result = V.evaluate_verification()
            finally:
                V.EVIDENCE_DIR = original
        self.assertFalse(result["evidence_present"])
        self.assertEqual(result["summary"]["verified"], 0)
        self.assertEqual(result["summary"]["declared"], len(VARIANT_CLASSES))
        for label in VARIANT_CLASSES:
            self.assertEqual(result["classes"][label]["status"], V.STATUS_UNEVALUATED)

    def test_unreadable_evidence_is_treated_as_absent(self):
        original = V.EVIDENCE_DIR
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "summary.json").write_text("{not json", encoding="utf-8")
            V.EVIDENCE_DIR = Path(tmp)
            try:
                result = V.evaluate_verification()
            finally:
                V.EVIDENCE_DIR = original
        self.assertFalse(result["evidence_present"])
        self.assertEqual(result["summary"]["verified"], 0)


class StatusAssignmentTests(unittest.TestCase):
    """Status must follow from the evidence, not from optimism."""

    def report(self, per_class, **extra):
        original = V.EVIDENCE_DIR
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "summary.json").write_text(
                json.dumps({"rows_scored": 1000, "metrics": {"per_class": per_class}}, **extra),
                encoding="utf-8",
            )
            V.EVIDENCE_DIR = Path(tmp)
            try:
                return V.evaluate_verification()
            finally:
                V.EVIDENCE_DIR = original

    def test_clear_scores_are_verified(self):
        result = self.report([
            {"label": "MQTT-DDoS-Connect", "recall": 0.9996, "precision": 0.9987, "support": 41916, "f1": 0.99},
        ])
        self.assertEqual(result["classes"]["MQTT-DDoS-Connect"]["status"], V.STATUS_VERIFIED)

    def test_low_recall_is_not_verified(self):
        result = self.report([
            {"label": "MQTT-DDoS-Connect", "recall": 0.50, "precision": 0.99, "support": 5000, "f1": 0.66},
        ])
        self.assertNotEqual(result["classes"]["MQTT-DDoS-Connect"]["status"], V.STATUS_VERIFIED)

    def test_low_precision_is_not_verified(self):
        result = self.report([
            {"label": "MQTT-DDoS-Connect", "recall": 0.99, "precision": 0.60, "support": 5000, "f1": 0.73},
        ])
        self.assertNotEqual(result["classes"]["MQTT-DDoS-Connect"]["status"], V.STATUS_VERIFIED)

    def test_thin_support_is_unevaluated_not_failed(self):
        result = self.report([
            {"label": "MQTT-DDoS-Connect", "recall": 1.0, "precision": 1.0, "support": 3, "f1": 1.0},
        ])
        entry = result["classes"]["MQTT-DDoS-Connect"]
        self.assertEqual(entry["status"], V.STATUS_UNEVALUATED)
        self.assertIn("support", entry["detail"])

    def test_absent_class_is_unevaluated_with_zero_support(self):
        result = self.report([])
        entry = result["classes"]["DoS-SYN"]
        self.assertEqual(entry["status"], V.STATUS_UNEVALUATED)
        self.assertEqual(entry["support"], 0)

    def test_separability_overrides_a_passing_score_bar(self):
        """A class that fails only because its pair is ambiguous says so."""
        result = self.report([
            {"label": "DoS-TCP", "recall": 0.5347, "precision": 0.9999, "support": 82096, "f1": 0.69},
        ])
        entry = result["classes"]["DoS-TCP"]
        self.assertEqual(entry["status"], V.STATUS_NOT_SEPARABLE)
        self.assertIn("swap at", entry["detail"])

    def test_every_declared_class_appears_in_the_report(self):
        result = self.report([])
        for label in VARIANT_CLASSES:
            self.assertIn(label, result["classes"])

    def test_counts_match_the_per_class_entries(self):
        result = self.report([
            {"label": "MQTT-DDoS-Connect", "recall": 0.99, "precision": 0.99, "support": 5000, "f1": 0.99},
            {"label": "DoS-TCP", "recall": 0.53, "precision": 0.99, "support": 80000, "f1": 0.69},
        ])
        statuses = [c["status"] for c in result["classes"].values()]
        self.assertEqual(result["summary"]["verified"], statuses.count(V.STATUS_VERIFIED))
        self.assertEqual(result["summary"]["unevaluated"], statuses.count(V.STATUS_UNEVALUATED))
        self.assertEqual(result["summary"]["not_separable"], statuses.count(V.STATUS_NOT_SEPARABLE))


class RecordedEvidenceTests(unittest.TestCase):
    """Against the evaluation actually committed in this repository."""

    def setUp(self):
        self.result = V.evaluate_verification()

    def test_recorded_evidence_is_found(self):
        self.assertTrue(self.result["evidence_present"])
        self.assertGreater(self.result["rows_scored"], 100000)

    def test_declared_exceeds_verified(self):
        s = self.result["summary"]
        self.assertEqual(s["declared"], 13)
        self.assertLess(s["verified"], s["declared"])

    def test_benign_is_verified(self):
        self.assertEqual(self.result["classes"]["Benign"]["status"], V.STATUS_VERIFIED)

    def test_measured_dos_ddos_confusion_is_reported(self):
        for label in ("DoS-TCP", "MQTT-DoS-Publish", "MQTT-DDoS-Publish"):
            with self.subTest(label=label):
                self.assertEqual(self.result["classes"][label]["status"], V.STATUS_NOT_SEPARABLE)

    def test_classes_without_captures_are_unevaluated(self):
        for label in ("DoS-SYN", "DoS-UDP", "DoS-ICMP", "DDoS-SYN", "DDoS-UDP", "DDoS-ICMP"):
            with self.subTest(label=label):
                self.assertEqual(self.result["classes"][label]["status"], V.STATUS_UNEVALUATED)


class ApiShapeTests(unittest.TestCase):
    """The endpoint itself must separate declared from verified."""

    def card(self):
        try:
            from app.main import multiclass_detector_info
        except Exception as exc:  # noqa: BLE001
            self.skipTest(f"app.main unavailable: {exc}")
        import asyncio

        return asyncio.run(multiclass_detector_info())

    def test_endpoint_exposes_declared_and_verified_separately(self):
        card = self.card()
        if isinstance(card, dict) and card.get("loaded") is False:
            self.skipTest("multiclass bundle unavailable in this environment")
        self.assertIn("declared_classes", card)
        self.assertIn("verification", card)
        self.assertIn("verified_class_count", card)
        self.assertNotIn("classes", card)

    def test_declared_list_is_the_full_label_set(self):
        card = self.card()
        if isinstance(card, dict) and card.get("loaded") is False:
            self.skipTest("multiclass bundle unavailable in this environment")
        self.assertEqual(sorted(card["declared_classes"]), sorted(VARIANT_CLASSES))

    def test_verified_count_never_exceeds_declared(self):
        card = self.card()
        if isinstance(card, dict) and card.get("loaded") is False:
            self.skipTest("multiclass bundle unavailable in this environment")
        self.assertLessEqual(card["verified_class_count"], len(card["declared_classes"]))

    def test_note_explains_the_distinction(self):
        card = self.card()
        if isinstance(card, dict) and card.get("loaded") is False:
            self.skipTest("multiclass bundle unavailable in this environment")
        self.assertIn("Verified", card["note"])


if __name__ == "__main__":
    unittest.main()
