"""Policy/executor duration parity and fresh measured reuse boundaries."""
import unittest
from types import SimpleNamespace

from app import policy
from app.planner import Planner, OUTCOME_VERSION
from app.schemas import DetectorEvent, Outcome, PolicyVerdict, ResponseRecommendation


EVENT = DetectorEvent(incident_id="test", attack_family="DoS", attack_subtype="TCP_Flood",
                      confidence=.99, confidence_kind="calibrated", model_version="model-v2",
                      device_id="device", device_type="medical-sensor", device_criticality="Low",
                      src_ip="10.20.2.1", dst_ip="10.20.1.5", packets_per_sec=10000)


class PolicyBoundaryTests(unittest.TestCase):
    def recommendation(self, duration):
        return ResponseRecommendation(action=f"connection_cap({duration}s)", duration_s=duration,
                                      params={"base_action": "connection_cap"}, reversible=True,
                                      selector="deterministic_table")

    def test_policy_downgrade_matches_live_executor_bound(self):
        decision = policy.evaluate(EVENT, self.recommendation(180), max_action_duration_s=60)
        self.assertEqual(decision.verdict, PolicyVerdict.DOWNGRADE)
        self.assertEqual(decision.executed_action, "upstream_rate_limit(60s)")

    def test_policy_pass_at_executor_bound_and_invalid_bound_escalates(self):
        decision = policy.evaluate(EVENT, self.recommendation(60), max_action_duration_s=60)
        self.assertEqual(decision.verdict, PolicyVerdict.PASS)
        for bound in (0, -1, True, 1.5):
            self.assertEqual(policy.evaluate(EVENT, self.recommendation(60), max_action_duration_s=bound).verdict,
                             PolicyVerdict.ESCALATE)

    def test_baseline_age_is_checked_at_actuation_boundary(self):
        samples = [SimpleNamespace(timestamp=now) for now in (90, 93, 96)]
        self.assertTrue(Planner._live_baseline_ready(samples, 99))
        self.assertFalse(Planner._live_baseline_ready(samples, 100))
        self.assertFalse(Planner._live_baseline_ready(samples, 95))

    def test_version_or_unmeasured_cases_cannot_authorize_fast_reuse(self):
        case = SimpleNamespace(source_mode="live_lab", outcome=Outcome.SUCCESS, evidence_count=3,
                               device_type=EVENT.device_type, device_criticality=EVENT.device_criticality,
                               attack_family=EVENT.attack_family, attack_subtype=EVENT.attack_subtype,
                               model_version="model-v2", policy_version=policy.POLICY_VERSION,
                               outcome_version=OUTCOME_VERSION)
        self.assertTrue(Planner._operational_reuse_eligible(EVENT, case))
        for attribute, value in (("policy_version", "old"), ("outcome_version", "old"),
                                 ("source_mode", "fixture"), ("outcome", Outcome.PARTIAL),
                                 ("model_version", "unknown"), ("evidence_count", 1),
                                 ("device_type", "mqtt-broker"), ("device_criticality", "Critical"),
                                 ("attack_subtype", "UDP_Flood")):
            old = getattr(case, attribute)
            setattr(case, attribute, value)
            self.assertFalse(Planner._operational_reuse_eligible(EVENT, case))
            setattr(case, attribute, old)
