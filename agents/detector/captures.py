"""Compatibility shim: capture registry and variant classes backed by PCAP files.

The joblib detector scores raw PCAP captures (not CSVs). The scenario map lives
in `backend/app/incidents.py`; this shim re-exports names the tests and
evaluation scripts expect, pointing them at `data/pcap_test`.
"""

from __future__ import annotations

from pathlib import Path

_HERE = Path(__file__).resolve()
_PROJECT_ROOT = _HERE.parents[3]  # agents/detector/captures.py -> FYP root
PCAP_DIR = _PROJECT_ROOT / "data" / "pcap_test"

# Every PCAP capture under data/pcap_test, keyed by scenario-friendly names.
ATTACK_CAPTURES = {
    "tcp-dos": PCAP_DIR / "TCP_IP-DoS-SYN_test.pcap",
    "tcp-ddos-syn": PCAP_DIR / "TCP_IP-DDoS-SYN_test.pcap",
    "tcp-ddos-tcp": PCAP_DIR / "TCP_IP-DDoS-TCP_test.pcap",
    "tcp-ddos-udp": PCAP_DIR / "TCP_IP-DDoS-UDP1_test.pcap",
    "tcp-ddos-icmp": PCAP_DIR / "TCP_IP-DDoS-ICMP1_test.pcap",
    "tcp-dos-syn": PCAP_DIR / "TCP_IP-DoS-SYN_test.pcap",
    "tcp-dos-tcp": PCAP_DIR / "TCP_IP-DoS-TCP_test.pcap",
    "tcp-dos-udp": PCAP_DIR / "TCP_IP-DoS-UDP_test.pcap",
    "tcp-dos-icmp": PCAP_DIR / "TCP_IP-DoS-ICMP_test.pcap",
    "mqtt-dos-connect": PCAP_DIR / "MQTT-DoS-Connect_Flood_test.pcap",
    "mqtt-dos-publish": PCAP_DIR / "MQTT-DoS-Publish_Flood_test.pcap",
    "mqtt-ddos-connect": PCAP_DIR / "MQTT-DDoS-Connect_Flood_test.pcap",
    "mqtt-ddos-publish": PCAP_DIR / "MQTT-DDoS-Publish_Flood_test.pcap",
}

BENIGN_CAPTURE = PCAP_DIR / "Benign_test.pcap"

# The 13 variant classes the trained joblib bundle emits.
VARIANT_CLASSES = [
    "Benign",
    "DoS-SYN",
    "DoS-TCP",
    "DoS-UDP",
    "DoS-ICMP",
    "DDoS-SYN",
    "DDoS-TCP",
    "DDoS-UDP",
    "DDoS-ICMP",
    "MQTT-DoS-Connect",
    "MQTT-DoS-Publish",
    "MQTT-DDoS-Connect",
    "MQTT-DDoS-Publish",
]

SAMPLE_CAPTURES = dict(ATTACK_CAPTURES)


def capture_for(key: str) -> Path:
    """Resolve a capture key to a path under data/pcap_test."""
    return ATTACK_CAPTURES[key]


__all__ = ["ATTACK_CAPTURES", "BENIGN_CAPTURE", "VARIANT_CLASSES", "SAMPLE_CAPTURES", "capture_for", "PCAP_DIR"]
