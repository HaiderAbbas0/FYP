"""Evidence must describe the attack that is present, not a generic flood.

The Traffic and Log specialists previously narrated every incident as a TCP
flood. That was true of a volumetric flood and false of an MQTT publish flood,
which rides established connections: the real capture replay shows it at 0.57x
the benign baseline flow rate, so a rate-limit narrative would have described
the attack as "slow down" when the pressure is entirely on broker sessions.

These tests pin the shape-aware narratives, the label-uncertainty record, and
the severity rule that no longer treats an unseparable DoS/DDoS label as
settled. Run from `backend/` with `.venv/Scripts/python -m unittest discover -s tests`.
"""
import asyncio
import unittest

from app.attack_class import (
    FAMILY_BANDWIDTH,
    FAMILY_CONNECTION,
    FAMILY_SESSION,
    FAMILY_UNKNOWN,
    label_uncertainty,
)
from app.schemas import DetectorEvent
from agents.investigator.agent import _rule_severity
from agents.investigator.specialists.agent import (
    _connection_state_summary,
    _traffic_summary,
    log_analysis,
    traffic_analysis,
)


def event(**overrides) -> DetectorEvent:
    base = dict(
        incident_id="inc-1",
        attack_family="DoS",
        attack_subtype="TCP_Flood",
        confidence=0.97,
        confidence_kind="calibrated",
        model_version="model-v2",
        device_id="BR-01",
        device_type="mqtt-broker",
        device_criticality="High",
        src_ip="10.20.2.1",
        dst_ip="10.20.1.5",
        packets_per_sec=40000,
    )
    base.update(overrides)
    return DetectorEvent(**base)


def stats(**overrides) -> dict:
    base = {
        "Rate": {"mean": 41000.0, "max": 90000.0, "ratio_vs_baseline": 10.72},
        "Tot size": {"mean": 88.0, "max": 1400.0, "ratio_vs_baseline": 0.48},
        "Header_Length": {"mean": 40.0, "ratio_vs_baseline": 1.0},
        "rst_count": {"mean": 0.0, "ratio_vs_baseline": 0.0},
        "syn_count": {"mean": 0.0, "ratio_vs_baseline": 0.0},
        "ack_count": {"mean": 0.0, "ratio_vs_baseline": 0.0},
        "fin_count": {"mean": 0.0, "ratio_vs_baseline": 0.0},
        "ack_flag_number": {"mean": 0.1, "ratio_vs_baseline": 0.2},
        "TCP": {"mean": 0.98},
        "UDP": {"mean": 0.01},
        "ICMP": {"mean": 0.0},
        "ARP": {"mean": 0.0},
    }
    base.update(overrides)
    return base


SESSION_STATS = stats(
    Rate={"mean": 2200.0, "max": 3100.0, "ratio_vs_baseline": 0.57},
    Tot_size={"mean": 654.0, "max": 1500.0, "ratio_vs_baseline": 3.57},
    rst_count={"mean": 1.0, "ratio_vs_baseline": 0.12},
    syn_count={"mean": 0.0, "ratio_vs_baseline": 0.0},
    ack_count={"mean": 2.0, "ratio_vs_baseline": 0.1},
    fin_count={"mean": 0.0, "ratio_vs_baseline": 0.0},
)

CONNECT_EVENT = event(
    attack_family="MQTT-Flood", attack_subtype="MQTT-Connect", attack_variant="MQTT-DoS-Connect"
)
SESSION_EVENT = event(
    attack_family="MQTT-Flood", attack_subtype="MQTT-Publish", attack_variant="MQTT-DoS-Publish"
)
VOLUMETRIC_EVENT = event(attack_family="DoS", attack_subtype="TCP", attack_variant="DoS-TCP")


class TrafficNarrativeTests(unittest.TestCase):
    def test_volumetric_flood_keeps_the_original_wording(self):
        summary = _traffic_summary(FAMILY_BANDWIDTH, 10.72, 0.48)
        self.assertIn("high-rate flood of undersized packets", summary)
        self.assertIn("Source cardinality is unknown", summary)

    def test_connection_flood_names_the_connection_table(self):
        summary = _traffic_summary(FAMILY_CONNECTION, 15.34, 0.62)
        self.assertIn("connection-state attack", summary)
        self.assertIn("connection table", summary)
        self.assertNotIn("high-rate flood", summary)

    def test_session_flood_is_never_described_as_a_rate_flood(self):
        summary = _traffic_summary(FAMILY_SESSION, 0.57, 3.57)
        self.assertIn("application-session attack", summary)
        self.assertIn("established connections", summary)
        self.assertIn("rate-based containment", summary)
        self.assertNotIn("high-rate flood", summary)

    def test_missing_ratios_degrade_honestly(self):
        for shape in (FAMILY_BANDWIDTH, FAMILY_CONNECTION, FAMILY_SESSION, FAMILY_UNKNOWN):
            with self.subTest(shape=shape):
                summary = _traffic_summary(shape, None, None)
                self.assertIn("source cardinality unavailable", summary)
                self.assertNotIn("flood", summary)

    def test_traffic_worker_reports_shape_and_diagnostic_flag(self):
        result = asyncio.run(traffic_analysis(CONNECT_EVENT, stats()))
        self.assertEqual(result.status, "ok")
        self.assertEqual(result.findings["attack_shape"], FAMILY_CONNECTION)
        self.assertFalse(result.findings["rate_profile_is_diagnostic"])

    def test_traffic_worker_flags_rate_profile_for_volumetric(self):
        result = asyncio.run(traffic_analysis(VOLUMETRIC_EVENT, stats()))
        self.assertTrue(result.findings["rate_profile_is_diagnostic"])


class ConnectionStateNarrativeTests(unittest.TestCase):
    def test_connection_attack_reads_low_resets_as_expected_signature(self):
        summary = _connection_state_summary(FAMILY_CONNECTION, 0.0)
        self.assertIn("expected signature", summary)
        self.assertIn("one-directional", summary)

    def test_session_attack_says_counters_are_not_diagnostic(self):
        summary = _connection_state_summary(FAMILY_SESSION, 0.12)
        self.assertIn("not diagnostic", summary)
        self.assertIn("did not need to open new connections", summary)
        self.assertNotIn("within normal range", summary)

    def test_high_reset_spike_still_reported_for_any_shape(self):
        summary = _connection_state_summary(FAMILY_BANDWIDTH, 2.1)
        self.assertIn("mass connection teardown", summary)

    def test_flat_counters_keep_original_wording_for_volumetric(self):
        summary = _connection_state_summary(FAMILY_BANDWIDTH, 0.0)
        self.assertIn("one-directional traffic", summary)

    def test_log_worker_records_whether_counters_are_diagnostic(self):
        result = asyncio.run(log_analysis(SESSION_EVENT, SESSION_STATS))
        self.assertEqual(result.status, "ok")
        self.assertEqual(result.findings["attack_shape"], FAMILY_SESSION)
        self.assertFalse(result.findings["counters_diagnostic_for_this_attack"])

    def test_log_worker_marks_connection_counters_diagnostic(self):
        result = asyncio.run(log_analysis(CONNECT_EVENT, stats()))
        self.assertTrue(result.findings["counters_diagnostic_for_this_attack"])


class LabelUncertaintyTests(unittest.TestCase):
    """The measured DoS/DDoS confusion must reach the evidence record."""

    def test_dos_ddos_pairs_are_flagged(self):
        cases = (("DoS", "TCP", "DoS-TCP"), ("DDoS", "TCP", "DDoS-TCP"), ("MQTT-Flood", "MQTT-Connect", "MQTT-DoS-Connect"))
        for family, subtype, variant in cases:
            with self.subTest(variant=variant):
                note = label_uncertainty(event(attack_family=family, attack_subtype=subtype, attack_variant=variant))
                self.assertIsNotNone(note)
                self.assertIn("no source addresses", note)

    def test_non_dos_labels_are_not_flagged(self):
        for family, subtype, variant in (("", "", None), ("Recon", "port_scan", "port_scan")):
            with self.subTest(subtype=subtype or "empty"):
                note = label_uncertainty(event(attack_family=family, attack_subtype=subtype, attack_variant=variant))
                self.assertIsNone(note)

    def test_plain_mqtt_publish_label_is_not_flagged(self):
        """MQTT-Publish carries no DoS/DDoS token, so it is not ambiguous."""
        ev = event(attack_family="MQTT-Flood", attack_subtype="MQTT-Publish", attack_variant="MQTT-Publish")
        self.assertIsNone(label_uncertainty(ev))

    def test_the_ddos_publish_side_of_the_pair_is_flagged(self):
        ev = event(attack_family="MQTT-Flood", attack_subtype="MQTT-Publish", attack_variant="MQTT-DDoS-Publish")
        self.assertIsNotNone(label_uncertainty(ev))

    def test_uncertainty_is_recorded_on_both_evidence_workers(self):
        uncertain = event(attack_family="DDoS", attack_subtype="TCP", attack_variant="DDoS-TCP")
        for worker in (traffic_analysis, log_analysis):
            with self.subTest(worker=worker.__name__):
                result = asyncio.run(worker(uncertain, stats()))
                self.assertIsNotNone(result.findings.get("label_uncertainty"))

    def test_certain_label_leaves_no_uncertainty_note(self):
        """A label outside the unseparable pairs records no uncertainty note."""
        certain = event(attack_family="Recon", attack_subtype="port_scan", attack_variant="port_scan")
        result = asyncio.run(traffic_analysis(certain, stats()))
        self.assertIsNone(result.findings.get("label_uncertainty"))

    def test_every_dos_ddos_variant_is_flagged(self):
        """All DoS/DDoS labels are ambiguous here, by measurement not assumption."""
        for variant in ("DoS-TCP", "DDoS-TCP", "MQTT-DoS-Connect", "MQTT-DDoS-Publish"):
            with self.subTest(variant=variant):
                ev = event(attack_family="DoS", attack_subtype="TCP", attack_variant=variant)
                self.assertIsNotNone(label_uncertainty(ev))


class SeverityTests(unittest.TestCase):
    """Severity keeps clinical context primary, and never presents ambiguity as settled."""

    def test_critical_device_stays_high_even_when_label_is_ambiguous(self):
        ev = event(attack_family="DDoS", attack_subtype="TCP", attack_variant="DDoS-TCP",
                   device_criticality="Critical")
        self.assertEqual(_rule_severity(ev, []), "high")

    def test_ambiguous_label_prevents_a_clean_low_severity(self):
        ev = event(attack_family="DDoS", attack_subtype="TCP", attack_variant="DDoS-TCP",
                   device_criticality="Low")
        self.assertEqual(_rule_severity(ev, []), "medium")

    def test_certain_label_still_reports_clean_low_severity(self):
        ev = event(attack_family="Recon", attack_subtype="port_scan", attack_variant="port_scan",
                   device_criticality="Low")
        self.assertEqual(_rule_severity(ev, []), "low")

    def test_evidence_gap_still_raises_severity(self):
        self.assertEqual(_rule_severity(VOLUMETRIC_EVENT, ["threat: unavailable"]), "medium")

    def test_high_criticality_unchanged(self):
        self.assertEqual(_rule_severity(VOLUMETRIC_EVENT, []), "medium")


if __name__ == "__main__":
    unittest.main()
