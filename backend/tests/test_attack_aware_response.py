"""Attack-aware response selection and its interaction with the policy gate.

Covers the three axes the decision actually depends on - attack shape, device
criticality and source cardinality - plus the property that matters most: shape
awareness may only narrow what is permitted, never widen it.

Run from `backend/` with `.venv/Scripts/python -m unittest discover -s tests`.
"""
import asyncio
import unittest

from app import policy
from app.action_catalog import format_action
from app.attack_class import (
    FAMILY_BANDWIDTH,
    FAMILY_CONNECTION,
    FAMILY_SESSION,
    FAMILY_UNKNOWN,
    classify,
    is_shared_transport,
    permitted_actions,
)
from app.policy import POLICY_VERSION
from app.schemas import (
    DetectorEvent,
    Explanation,
    InvestigationResult,
    PolicyVerdict,
    ResponseRecommendation,
    SpecialistResult,
)
from agents.response.agent import FALLBACK_TABLE, SHAPE_TABLE, recommend


class NullLLM:
    """Stands in for an unavailable provider so the deterministic path runs."""

    async def complete_json(self, *_args, **_kwargs):
        return None


def event(**overrides) -> DetectorEvent:
    base = dict(
        incident_id="inc-1",
        attack_family="DoS",
        attack_subtype="TCP_Flood",
        confidence=0.97,
        confidence_kind="calibrated",
        model_version="model-v2",
        device_id="SN-02",
        device_type="medical-sensor",
        device_criticality="Low",
        src_ip="10.20.2.1",
        dst_ip="10.20.1.5",
        packets_per_sec=40000,
    )
    base.update(overrides)
    return DetectorEvent(**base)


def investigation(*, cardinality="single", life_critical=False) -> InvestigationResult:
    """Build an investigation whose constraints match what the agent would see."""
    # Mirrors agents/investigator/agent.py::_constraints. The device class is
    # resolved here, so neither the life-critical nor the failing-safe branch
    # applies when life_critical is False - adding one would make every
    # scenario look life-critical to the Response Agent.
    constraints = []
    if life_critical:
        constraints.append("device_isolate DENIED (life-critical class)")
    if cardinality in (None, "unknown"):
        constraints.append(
            "source cardinality unknown - single-source blocking disallowed, prefer upstream rate limiting"
        )
    elif cardinality != "single":
        constraints.append("single-source blocking ineffective - prefer upstream rate limiting")
    constraints.append("duration <= 300s without human approval")
    return InvestigationResult(
        mode="full",
        confidence_source="rules",
        confirmed_family="DoS/TCP_Flood",
        severity="medium",
        response_constraints=constraints,
        specialist_results=[
            SpecialistResult(
                name="traffic",
                status="ok",
                provenance="capture",
                findings={"source_cardinality": cardinality},
                summary="",
            )
        ],
    )


def explanation() -> Explanation:
    return Explanation(depth="one-line", text="deterministic test explanation", generated_by="template")


def recommendation_for(ev, *, cardinality="single", life_critical=False) -> ResponseRecommendation:
    return asyncio.run(
        recommend(
            NullLLM(),
            ev,
            investigation(cardinality=cardinality, life_critical=life_critical),
            explanation(),
            None,
        )
    )


class AttackShapeClassificationTests(unittest.TestCase):
    """The classifier maps both detector label schemes onto one vocabulary."""

    def test_legacy_binary_tcp_flood_is_volumetric(self):
        self.assertEqual(classify(event()), FAMILY_BANDWIDTH)

    def test_multiclass_levels_map_to_their_shape(self):
        cases = {
            ("MQTT-Flood", "MQTT-Connect", "MQTT-DoS-Connect"): FAMILY_CONNECTION,
            ("MQTT-Flood", "MQTT-Publish", "MQTT-DDoS-Publish"): FAMILY_SESSION,
            ("DDoS", "TCP", "DDoS-TCP"): FAMILY_BANDWIDTH,
            ("DoS", "SYN", "DoS-SYN"): FAMILY_CONNECTION,
            ("DoS", "UDP", "DoS-UDP"): FAMILY_BANDWIDTH,
        }
        for (family, subtype, variant), expected in cases.items():
            with self.subTest(variant=variant):
                self.assertEqual(
                    classify(
                        event(attack_family=family, attack_subtype=subtype, attack_variant=variant)
                    ),
                    expected,
                )

    def test_unrecognised_or_absent_labels_are_unknown(self):
        for family, subtype, variant in (("", "", None), ("Recon", "port_scan", None)):
            with self.subTest(subtype=subtype or "empty"):
                self.assertEqual(
                    classify(
                        event(attack_family=family, attack_subtype=subtype, attack_variant=variant)
                    ),
                    FAMILY_UNKNOWN,
                )

    def test_shape_never_permits_isolation(self):
        for shape in (FAMILY_CONNECTION, FAMILY_SESSION):
            with self.subTest(shape=shape):
                permitted = permitted_actions(shape, life_critical=False, cardinality="single")
                self.assertNotIn("device_isolate", permitted)

    def test_single_source_block_requires_established_single_source(self):
        allowed = permitted_actions(FAMILY_CONNECTION, life_critical=False, cardinality="single")
        self.assertIn("temp_source_block", allowed)
        for cardinality in ("unknown", "few", "distributed"):
            with self.subTest(cardinality=cardinality):
                permitted = permitted_actions(
                    FAMILY_CONNECTION, life_critical=False, cardinality=cardinality
                )
                self.assertNotIn("temp_source_block", permitted)

    def test_volumetric_and_unknown_shapes_permit_nothing_shape_specific(self):
        """Both keep the pre-existing criticality/cardinality rules in charge."""
        for shape in (FAMILY_BANDWIDTH, FAMILY_UNKNOWN):
            with self.subTest(shape=shape):
                self.assertEqual(
                    permitted_actions(shape, life_critical=False, cardinality="single"), ()
                )

    def test_shared_transport_detection(self):
        self.assertTrue(is_shared_transport("mqtt-broker"))
        self.assertFalse(is_shared_transport("medical-sensor"))
        self.assertFalse(is_shared_transport("patient-monitor-gateway"))


class ResponseSelectionTests(unittest.TestCase):
    """Attack type now changes which bounded action is recommended."""

    def test_connection_flood_gets_connection_cap_not_rate_limit(self):
        ev = event(
            attack_family="MQTT-Flood",
            attack_subtype="MQTT-Connect",
            attack_variant="MQTT-DoS-Connect",
        )
        rec = recommendation_for(ev, cardinality="single")
        self.assertEqual(rec.params["base_action"], "connection_cap")
        self.assertEqual(rec.params["attack_shape"], FAMILY_CONNECTION)
        self.assertEqual(rec.selector, "deterministic_table")

    def test_session_flood_gets_prefix_rate_limit(self):
        ev = event(
            attack_family="MQTT-Flood",
            attack_subtype="MQTT-Publish",
            attack_variant="MQTT-DDoS-Publish",
        )
        rec = recommendation_for(ev, cardinality="distributed")
        self.assertEqual(rec.params["base_action"], "upstream_prefix_ratelimit")
        self.assertEqual(rec.params["attack_shape"], FAMILY_SESSION)

    def test_different_attacks_on_identical_devices_differ_in_action(self):
        flood = recommendation_for(event(), cardinality="single", life_critical=False)
        connect = recommendation_for(
            event(
                attack_family="MQTT-Flood",
                attack_subtype="MQTT-Connect",
                attack_variant="MQTT-DoS-Connect",
            ),
            cardinality="single",
            life_critical=False,
        )
        self.assertNotEqual(flood.params["base_action"], connect.params["base_action"])

    def test_legacy_binary_attacks_reproduce_the_previous_table_exactly(self):
        """Every attack the legacy detector can emit is `unknown` to the classifier."""
        for life_critical in (True, False):
            for cardinality in ("single", "few", "distributed", "unknown"):
                with self.subTest(life_critical=life_critical, cardinality=cardinality):
                    rec = recommendation_for(
                        event(), cardinality=cardinality, life_critical=life_critical
                    )
                    expected_action, expected_duration = FALLBACK_TABLE[(life_critical, cardinality)]
                    self.assertEqual(rec.params["base_action"], expected_action)
                    self.assertEqual(rec.duration_s, expected_duration)
                    self.assertEqual(rec.action, format_action(expected_action, expected_duration))

    def test_recommendation_is_always_canonical_and_bounded(self):
        ev = event(
            attack_family="MQTT-Flood",
            attack_subtype="MQTT-Connect",
            attack_variant="MQTT-DoS-Connect",
        )
        for cardinality in ("single", "few", "distributed", "unknown"):
            for life_critical in (True, False):
                with self.subTest(cardinality=cardinality, life_critical=life_critical):
                    rec = recommendation_for(
                        ev, cardinality=cardinality, life_critical=life_critical
                    )
                    self.assertIn(rec.params["base_action"], policy.ACTION_NAMES)
                    self.assertTrue(policy.recommendation_action_is_catalogued(rec))
                    self.assertLessEqual(
                        rec.duration_s, policy.settings.max_unattended_action_s
                    )

    def test_shape_table_actions_are_present_in_the_catalog(self):
        for shape, (action, _duration) in SHAPE_TABLE.items():
            with self.subTest(shape=shape):
                self.assertIn(action, policy.ACTION_NAMES)


class PolicyGateTests(unittest.TestCase):
    """Shape awareness narrows authority; it never grants it."""

    def shape_event(self) -> DetectorEvent:
        return event(
            attack_family="MQTT-Flood",
            attack_subtype="MQTT-Connect",
            attack_variant="MQTT-DoS-Connect",
        )

    def rec(self, action, duration=180, **params) -> ResponseRecommendation:
        return ResponseRecommendation(
            action=format_action(action, duration),
            duration_s=duration,
            params={"base_action": action, **params},
            reversible=True,
            selector="deterministic_table",
        )

    def rule8(self, decision) -> str:
        return next(c.result for c in decision.checks if c.rule.startswith("RULE-08"))

    def test_policy_version_was_bumped(self):
        self.assertEqual(POLICY_VERSION, "policy-v2")

    def test_shape_appropriate_action_passes(self):
        decision = policy.evaluate(
            self.shape_event(), self.rec("connection_cap", source_cardinality="single")
        )
        self.assertEqual(self.rule8(decision), "PASS")
        self.assertEqual(decision.verdict, PolicyVerdict.PASS)

    def test_every_action_the_shape_permits_is_accepted(self):
        for cardinality in ("single", "few", "distributed", "unknown"):
            allowed = permitted_actions(
                FAMILY_CONNECTION, life_critical=False, cardinality=cardinality
            )
            for action in allowed:
                with self.subTest(action=action, cardinality=cardinality):
                    decision = policy.evaluate(
                        self.shape_event(), self.rec(action, source_cardinality=cardinality)
                    )
                    self.assertEqual(self.rule8(decision), "PASS")
                    self.assertEqual(decision.verdict, PolicyVerdict.PASS)

    def test_isolation_is_never_shape_appropriate_and_must_not_execute(self):
        decision = policy.evaluate(
            self.shape_event(), self.rec("device_isolate", source_cardinality="single")
        )
        self.assertEqual(self.rule8(decision), "FAIL")
        self.assertEqual(decision.verdict, PolicyVerdict.DOWNGRADE)
        self.assertNotEqual(decision.executed_action, "device_isolate(180s)")

    def test_unknown_shape_leaves_the_pre_existing_rules_in_charge(self):
        decision = policy.evaluate(
            event(), self.rec("connection_cap", source_cardinality="single")
        )
        self.assertEqual(self.rule8(decision), "PASS")
        self.assertEqual(decision.verdict, PolicyVerdict.PASS)

    def test_isolating_shared_transport_is_refused_as_collateral(self):
        """A broker carrying 40+ devices must not be isolated to stop one flood."""
        ev = self.shape_event().model_copy(
            update={"device_type": "mqtt-broker", "device_criticality": "High"}
        )
        decision = policy.evaluate(
            ev, self.rec("device_isolate", source_cardinality="single")
        )
        self.assertEqual(self.rule8(decision), "FAIL")
        self.assertEqual(decision.verdict, PolicyVerdict.DOWNGRADE)
        self.assertNotEqual(decision.executed_action, "device_isolate(180s)")

    def test_shape_rule_cannot_rescue_an_allowlisted_clinical_source(self):
        ev = self.shape_event().model_copy(update={"src_ip": "10.0.0.10"})
        decision = policy.evaluate(
            ev, self.rec("connection_cap", source_cardinality="single")
        )
        self.assertEqual(decision.verdict, PolicyVerdict.ESCALATE)
        self.assertIsNone(decision.executed_action)

    def test_shape_rule_cannot_rescue_low_confidence(self):
        ev = self.shape_event().model_copy(update={"confidence": 0.10})
        decision = policy.evaluate(
            ev, self.rec("connection_cap", source_cardinality="single")
        )
        self.assertEqual(decision.verdict, PolicyVerdict.ESCALATE)

    def test_shape_rule_cannot_rescue_missing_evidence(self):
        decision = policy.evaluate(
            self.shape_event(),
            self.rec("connection_cap", source_cardinality="single"),
            device_context_available=False,
        )
        self.assertEqual(decision.verdict, PolicyVerdict.ESCALATE)

    def test_shape_rule_cannot_bypass_the_unattended_duration_limit(self):
        decision = policy.evaluate(
            self.shape_event(), self.rec("connection_cap", 600, source_cardinality="single")
        )
        self.assertNotEqual(decision.verdict, PolicyVerdict.PASS)

    def test_shape_rule_cannot_rescue_an_uncatalogued_action(self):
        rec = self.rec("port_shutdown", source_cardinality="single")
        decision = policy.evaluate(self.shape_event(), rec)
        self.assertEqual(decision.verdict, PolicyVerdict.ESCALATE)

    def test_every_decision_still_reports_rule08(self):
        for action in sorted(policy.ACTION_NAMES):
            with self.subTest(action=action):
                decision = policy.evaluate(
                    self.shape_event(), self.rec(action, source_cardinality="single")
                )
                self.assertTrue(any(c.rule.startswith("RULE-08") for c in decision.checks))


if __name__ == "__main__":
    unittest.main()
