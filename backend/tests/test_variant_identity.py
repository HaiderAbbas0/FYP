"""Attack variant must be part of incident identity, not collapsed away.

Two incidents differing only in variant used to produce byte-identical
behavioural signatures, so memory could treat a measured MQTT Connect flood as
precedent for an MQTT Publish flood. These tests pin that the variant is
distinguishable, and - just as important - that an *absent* variant never reads
as a mismatch.

Run from `backend/` with `.venv/Scripts/python -m unittest discover -s tests`.
"""
import unittest

from agents.controller.agent import NO_VARIANT, _behavioral_signature, _variant_token
from agents.memory.agent import WEIGHTS, _normalise_variant
from app.config import settings
from app.memory import MemoryAgent
from app.schemas import CaseRecord, DetectorEvent, Outcome


def event(**overrides) -> DetectorEvent:
    base = dict(
        incident_id="inc-1",
        attack_family="MQTT-Flood",
        attack_subtype="MQTT-Connect",
        attack_variant="MQTT-DoS-Connect",
        confidence=0.95,
        confidence_kind="calibrated",
        model_version="bundle-v1",
        device_id="BR-01",
        device_type="mqtt-broker",
        device_criticality="High",
        src_ip="10.20.2.1",
        dst_ip="10.20.1.5",
        packets_per_sec=40000,
        top_features=["syn_count"],
    )
    base.update(overrides)
    return DetectorEvent(**base)


NOW = "2026-10-12T00:00:00+00:00"


def case(**overrides) -> CaseRecord:
    base = dict(
        case_id="CASE-1",
        attack_family="MQTT-Flood",
        attack_subtype="MQTT-Connect",
        attack_variant="MQTT-DoS-Connect",
        device_type="mqtt-broker",
        device_criticality="High",
        behavioral_signature="mqtt-flood:mqtt-connect:mqtt-dos-connect:syn_count",
        source_cardinality="single",
        peak_rate="10k-100k",
        investigation_summary="MQTT Connect flood against the broker.",
        specialists_used=["traffic", "log"],
        recommended_response="connection_cap(180s)",
        executed_response="connection_cap(180s)",
        outcome=Outcome.SUCCESS,
        containment_latency_s=0.5,
        reuse_count=0,
        reliability=0.9,
        confidence=0.95,
        created=NOW,
        last_validated=NOW,
        model_version="bundle-v1",
    )
    base.update(overrides)
    return CaseRecord(**base)


class VariantTokenTests(unittest.TestCase):
    def test_absent_variant_becomes_the_explicit_sentinel(self):
        self.assertEqual(_variant_token(None), NO_VARIANT)
        self.assertEqual(_variant_token(""), NO_VARIANT)
        self.assertEqual(_variant_token("   "), NO_VARIANT)

    def test_labels_are_normalised_for_comparison(self):
        self.assertEqual(_variant_token(" MQTT Ddos Tcp "), "mqtt-ddos-tcp")
        self.assertEqual(_variant_token("DoS-TCP"), "dos-tcp")

    def test_normalise_variant_reports_absence_as_none(self):
        self.assertIsNone(_normalise_variant(None))
        self.assertIsNone(_normalise_variant("  "))
        self.assertEqual(_normalise_variant(" MQTT-DDoS-Connect "), "mqtt-ddos-connect")


class SignatureTests(unittest.TestCase):
    def test_variants_produce_different_signatures(self):
        connect = _behavioral_signature(event(attack_variant="MQTT-DoS-Connect"))
        ddos_connect = _behavioral_signature(event(attack_variant="MQTT-DDoS-Connect"))
        publish = _behavioral_signature(
            event(attack_subtype="MQTT-Publish", attack_variant="MQTT-DoS-Publish")
        )
        self.assertNotEqual(connect, ddos_connect)
        self.assertNotEqual(connect, publish)
        self.assertEqual(len({connect, ddos_connect, publish}), 3)

    def test_signature_has_a_stable_segment_count(self):
        """A missing variant occupies its slot rather than shifting segments."""
        with_variant = _behavioral_signature(event(attack_variant="MQTT-DoS-Connect"))
        without = _behavioral_signature(event(attack_variant=None))
        self.assertEqual(with_variant.count(":"), without.count(":"))
        self.assertIn(f":{NO_VARIANT}:", without)

    def test_family_and_subtype_still_separate_attacks(self):
        a = _behavioral_signature(event(attack_family="DoS", attack_subtype="TCP_Flood", attack_variant=None))
        b = _behavioral_signature(event(attack_family="MQTT-Flood", attack_subtype="MQTT-Connect"))
        self.assertNotEqual(a, b)

    def test_legacy_detector_events_are_still_distinguishable(self):
        a = _behavioral_signature(event(attack_family="DoS", attack_subtype="TCP_Flood", attack_variant=None))
        b = _behavioral_signature(event(attack_family="DoS", attack_subtype="UDP_Flood", attack_variant=None))
        self.assertNotEqual(a, b)

    def test_features_remain_part_of_the_signature(self):
        a = _behavioral_signature(event(top_features=["syn_count"]))
        b = _behavioral_signature(event(top_features=["ack_count"]))
        self.assertNotEqual(a, b)

    def test_signature_is_stable_across_calls(self):
        self.assertEqual(_behavioral_signature(event()), _behavioral_signature(event()))


class SimilarityTests(unittest.TestCase):
    """The variant must influence reuse scoring, not just the stored string."""

    def agent(self) -> MemoryAgent:
        return MemoryAgent(cases_path=settings.cases_seed_path)

    def test_identical_variant_scores_full_credit(self):
        memory = self.agent()
        score = memory.similarity(event(), case(), "single")
        self.assertGreater(score, 0.99)
        self.assertIn("attack_variant", memory.compared_fields("single"))

    def test_different_variant_scores_lower(self):
        memory = self.agent()
        same = memory.similarity(event(), case(), "single")
        different = memory.similarity(event(), case(attack_variant="MQTT-DDoS-Connect"), "single")
        self.assertLess(different, same)
        self.assertLess(different, 0.99)

    def test_absent_variant_is_not_scored_rather_than_mismatched(self):
        """A case recorded before the variant level existed is not penalised."""
        memory = self.agent()
        legacy_case = case(attack_variant=None)
        score = memory.similarity(event(), legacy_case, "single")
        self.assertNotIn("attack_variant", memory.compared_fields("single"))
        self.assertGreater(score, 0.9)

    def test_missing_variant_on_the_event_is_also_unscored(self):
        memory = self.agent()
        score = memory.similarity(event(attack_variant=None), case(attack_variant=None), "single")
        self.assertNotIn("attack_variant", memory.compared_fields("single"))
        self.assertGreater(score, 0.9)

    def test_variant_weight_is_present_in_the_weight_table(self):
        self.assertIn("attack_variant", WEIGHTS)
        self.assertGreater(WEIGHTS["attack_variant"], 0.0)


class CaseRecordCompatibilityTests(unittest.TestCase):
    """Stored cases written before this field existed must still validate."""

    def test_case_without_variant_validates(self):
        record = CaseRecord(
            case_id="CASE-LEGACY",
            attack_family="DoS",
            attack_subtype="TCP_Flood",
            device_type="medical-sensor",
            device_criticality="Low",
            behavioral_signature="dos:tcp_flood:-:",
            source_cardinality="unknown",
            peak_rate="10k-100k",
            investigation_summary="Legacy binary detector incident.",
            specialists_used=["traffic"],
            recommended_response="upstream_rate_limit(120s)",
            executed_response="upstream_rate_limit(120s)",
            outcome=Outcome.SUCCESS,
            containment_latency_s=0.4,
            reuse_count=0,
            reliability=0.8,
            confidence=0.9,
            created=NOW,
            last_validated=NOW,
        )
        self.assertIsNone(record.attack_variant)

    def test_legacy_seed_store_still_loads(self):
        memory = MemoryAgent(cases_path=settings.cases_seed_path)
        self.assertTrue(memory.cases)
        for record in memory.cases:
            self.assertIsNotNone(record.case_id)


if __name__ == "__main__":
    unittest.main()
