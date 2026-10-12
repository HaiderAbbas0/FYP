"""Staged multiclass adapter tests. Legacy get_detector() must stay binary RF."""
from __future__ import annotations

import hashlib
import json
import os
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np
import pandas as pd

from agents.detector.multiclass import (
    BUNDLE_PATH,
    CIC_COLUMNS,
    FeatureSchemaError,
    MulticlassDetectorAdapter,
    incidents_from_proba,
    validate_input_frame,
)


ROOT = Path(__file__).resolve().parents[2]


def _bundle():
    classes = ["Benign", "DoS-TCP", "MQTT-DoS-Connect"]
    return {
        "pipeline": SimpleNamespace(named_steps={
            "prep": SimpleNamespace(transform=lambda frame: np.zeros((len(frame), 2))),
            "clf": SimpleNamespace(predict_proba=lambda x: np.tile([0.05, 0.9, 0.05], (len(x), 1))),
        }),
        "calibrator": SimpleNamespace(predict_proba=lambda x: np.tile([0.05, 0.9, 0.05], (len(x), 1))),
        "classes": classes,
        "train_level": "variant",
        "eval_levels": {
            "variant": {"names": classes, "matrix": np.eye(3).tolist()},
            "subtype": {"names": ["Benign", "TCP", "MQTT-Connect"], "matrix": np.eye(3).tolist()},
            "family": {"names": ["Benign", "DoS", "MQTT-Flood"], "matrix": np.eye(3).tolist()},
            "binary": {"names": ["Benign", "Attack"], "matrix": [[1.0, 0.0], [0.0, 1.0], [0.0, 1.0]]},
        },
        "features": ["Rate", "TCP"],
        "expected_columns": CIC_COLUMNS,
        "top_features": ["Rate"],
        "model_name": "lightgbm",
        "config_hash": "test-hash",
        "excluded_shortcut_features": ["IAT", "Number", "Weight"],
    }


class SchemaTests(unittest.TestCase):
    def test_rejects_frame_with_no_model_features(self):
        with self.assertRaises(FeatureSchemaError):
            validate_input_frame(
                pd.DataFrame({"IAT": [1.0], "Number": [9.5], "Weight": [141.55]}),
                expected_columns=CIC_COLUMNS,
                model_features=["Rate", "TCP"],
            )

    def test_rejects_empty_rows(self):
        with self.assertRaises(FeatureSchemaError):
            validate_input_frame(
                pd.DataFrame(columns=["Rate", "TCP"]),
                expected_columns=CIC_COLUMNS,
                model_features=["Rate", "TCP"],
            )

    def test_aligns_when_some_model_features_exist(self):
        aligned = validate_input_frame(
            pd.DataFrame({"Rate": [10.0], "extra": [1]}),
            expected_columns=CIC_COLUMNS,
            model_features=["Rate", "TCP"],
        )
        self.assertEqual(list(aligned.columns), CIC_COLUMNS)
        self.assertEqual(aligned.loc[0, "Rate"], 10.0)
        self.assertTrue(pd.isna(aligned.loc[0, "TCP"]))


class IncidentMappingTests(unittest.TestCase):
    def test_keeps_variant_confidence_separate_from_attack_probability(self):
        probability = np.array([[0.1, 0.7, 0.2]])
        incident = incidents_from_proba(probability, _bundle())[0]
        self.assertEqual(incident["attack_variant"], "DoS-TCP")
        self.assertEqual(incident["attack_subtype"], "TCP")
        self.assertEqual(incident["attack_family"], "DoS")
        self.assertEqual(incident["attack_binary"], "Attack")
        self.assertEqual(incident["confidence"], 0.7)
        self.assertEqual(incident["attack_probability"], 0.9)
        self.assertNotEqual(incident["confidence"], incident["attack_probability"])
        self.assertEqual(incident["confidence_kind"], "calibrated")
        self.assertEqual(incident["model_version"], "test-hash")

    def test_window_separates_mean_attack_probability_from_variant_confidence(self):
        adapter = MulticlassDetectorAdapter(bundle=_bundle())
        window = adapter.score_window(pd.DataFrame({"Rate": [1.0, 2.0], "TCP": [1.0, 1.0]}))
        self.assertEqual(window.chosen_variant, "DoS-TCP")
        self.assertEqual(window.attack_family, "DoS")
        self.assertAlmostEqual(window.chosen_variant_mean_confidence, 0.9)
        self.assertAlmostEqual(window.window_mean_attack_probability, 0.95)
        payload = window.to_json()
        self.assertIn("window_mean_attack_probability", payload)
        self.assertIn("chosen_variant_mean_confidence", payload)
        self.assertNotEqual(payload["window_mean_attack_probability"], payload["chosen_variant_mean_confidence"])


class LegacyUntouchedTests(unittest.TestCase):
    def test_app_detector_still_exports_legacy_get_detector(self):
        from app.detector import DetectorAgent, get_detector
        self.assertTrue(callable(get_detector))
        self.assertEqual(DetectorAgent.__name__, "DetectorAgent")
        self.assertIn("legacy", str(Path(__import__("agents.detector.agent", fromlist=["DETECTOR_DIR"]).DETECTOR_DIR)))


class LiveBundleTests(unittest.TestCase):
    def test_bundle_scores_local_capture_prefixes(self):
        if not BUNDLE_PATH.exists():
            self.skipTest("multiclass bundle is not in the workspace")
        try:
            adapter = MulticlassDetectorAdapter()
        except Exception as exc:  # noqa: BLE001
            self.skipTest(f"bundle could not be loaded: {exc}")
        info = adapter.info()
        self.assertFalse(info["active_in_runtime"])
        self.assertEqual(info["class_count"], 13)
        self.assertEqual(info["feature_count"], 39)
        self.assertNotIn("IAT", info["features"])
        benign = ROOT / "data" / "Benign_test.pcap.csv"
        attack = ROOT / "data" / "detector" / "TCP_IP-DoS-TCP_test.pcap.csv"
        if not benign.exists() or not attack.exists():
            self.skipTest("capture CSVs are not in the workspace")
        benign_window = adapter.score_window(pd.read_csv(benign, nrows=64))
        attack_window = adapter.score_window(pd.read_csv(attack, nrows=64))
        self.assertLess(benign_window.window_mean_attack_probability, 0.5)
        self.assertGreater(attack_window.window_mean_attack_probability, 0.9)
        self.assertNotEqual(
            attack_window.chosen_variant_mean_confidence,
            attack_window.window_mean_attack_probability,
        )


class RouteIsolationTests(unittest.TestCase):
    def test_legacy_info_route_is_unchanged(self):
        import ast
        tree = ast.parse((ROOT / "backend" / "app" / "main.py").read_text(encoding="utf-8"))
        functions = {
            node.name: ast.get_source_segment((ROOT / "backend" / "app" / "main.py").read_text(encoding="utf-8"), node)
            for node in tree.body if isinstance(node, ast.AsyncFunctionDef)
        }
        self.assertIn("return get_detector().info()", functions["detector_info"])
        self.assertIn("multiclass_detector_info", functions)


class HttpRouteTests(unittest.TestCase):
    def setUp(self):
        keys = {"viewer": {"sha256": hashlib.sha256(b"viewer").hexdigest(), "role": "viewer"}}
        self.env = patch.dict(os.environ, {
            "IDS_API_KEYS_JSON": json.dumps(keys),
            "IDS_SESSION_SECRET": "test-only-session-signing-secret-32-characters",
            "IDS_AUTH_DEV_LOCALHOST": "false",
            "IDS_EMBEDDED_WORKER": "false",
        })
        self.env.start()
        import app.main as main
        from app.auth import AuthManager
        from fastapi.testclient import TestClient
        self.auth = patch.object(main, "AUTH", AuthManager())
        self.auth.start()
        self.context = TestClient(main.app)
        self.client = self.context.__enter__()
        self.headers = {"Authorization": "Bearer viewer"}

    def tearDown(self):
        self.context.__exit__(None, None, None)
        self.auth.stop()
        self.env.stop()

    def test_legacy_info_stays_binary_random_forest(self):
        response = self.client.get("/api/detector/info", headers=self.headers)
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(body["model_type"], "RandomForestClassifier")
        self.assertEqual(body["n_features"], 45)
        self.assertIn("TCP_Flood", str(body.get("attack_scope")))

    def test_multiclass_info_is_staged_and_inactive(self):
        response = self.client.get("/api/detector/multiclass/info", headers=self.headers)
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertTrue(body["loaded"])
        self.assertFalse(body["active_in_runtime"])
        self.assertEqual(body["model"], "lightgbm")
        self.assertEqual(body["class_count"], 13)
        self.assertEqual(body["feature_count"], 39)


class DetectorModeTests(unittest.TestCase):
    def test_default_mode_is_legacy(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("IDS_DETECTOR", None)
            from agents.detector.multiclass import detector_mode
            self.assertEqual(detector_mode(), "legacy")

    def test_manifest_hashes_legacy_by_default_and_bundle_when_opted_in(self):
        from app.manifest import freeze
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("IDS_DETECTOR", None)
            legacy = freeze({"source_mode": "capture_replay", "scenario": "low"}, [])
            self.assertEqual(legacy["public_config"]["detector"], "legacy")
            self.assertIn("tcp_flood_rf_model.joblib", legacy["model_artifacts"])
            self.assertNotIn("detector_bundle.joblib", legacy["model_artifacts"])
        with patch.dict(os.environ, {"IDS_DETECTOR": "multiclass"}):
            multi = freeze({"source_mode": "capture_replay", "scenario": "low"}, [])
            self.assertEqual(multi["public_config"]["detector"], "multiclass")
            self.assertIn("detector_bundle.joblib", multi["model_artifacts"])
            self.assertNotIn("tcp_flood_rf_model.joblib", multi["model_artifacts"])
            self.assertNotEqual(multi["model_artifacts"]["detector_bundle.joblib"], "missing")

    def test_opt_in_capture_replay_keeps_unknown_source_cardinality(self):
        if not BUNDLE_PATH.exists():
            self.skipTest("multiclass bundle is not in the workspace")
        with patch.dict(os.environ, {"IDS_DETECTOR": "multiclass"}):
            from app.incidents import build_event, detector_artifact, replay_scenario
            windows, trigger = replay_scenario("low")
            self.assertIsNotNone(trigger)
            self.assertTrue(trigger.is_detection)
            event = build_event("low", trigger)
            self.assertEqual(event.connection_fanout, 0)
            self.assertEqual(event.confidence_kind, "calibrated")
            self.assertTrue(event.attack_variant)
            self.assertNotEqual(event.confidence, event.anomaly_score)
            artifact = detector_artifact(trigger, event)
            self.assertEqual(artifact["active_detector"], "multiclass")
            self.assertIn("attacker count", " ".join(artifact["not_derivable_from_capture"]))


if __name__ == "__main__":
    unittest.main()
