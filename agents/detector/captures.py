"""Capture files used by replay. Paths only; no inference."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DATA = REPO / "data"
BENIGN_CAPTURE = DATA / "Benign_test.pcap.csv"
ATTACK_CAPTURES = {
    "tcp-dos": DATA / "TCP_IP-DoS-TCP_test.pcap.csv",
    "mqtt-dos-connect": DATA / "MQTT-DoS-Connect_Flood_test.pcap.csv",
    "mqtt-dos-publish": DATA / "MQTT-DoS-Publish_Flood_test.pcap.csv",
    "mqtt-ddos-connect": DATA / "MQTT-DDoS-Connect_Flood_test.pcap.csv",
    "mqtt-ddos-publish": DATA / "MQTT-DDoS-Publish_Flood_test.pcap.csv",
}

VARIANT_CLASSES = [
    "Benign",
    "DoS-SYN", "DoS-TCP", "DoS-UDP", "DoS-ICMP",
    "DDoS-SYN", "DDoS-TCP", "DDoS-UDP", "DDoS-ICMP",
    "MQTT-DoS-Connect", "MQTT-DoS-Publish",
    "MQTT-DDoS-Connect", "MQTT-DDoS-Publish",
]


def label_from_filename(name: str) -> str | None:
    stem = name.replace(".pcap.csv", "")
    rules = (
        ("MQTT-DDoS-Connect", "MQTT-DDoS-Connect"),
        ("MQTT-DDoS-Publish", "MQTT-DDoS-Publish"),
        ("MQTT-DoS-Connect", "MQTT-DoS-Connect"),
        ("MQTT-DoS-Publish", "MQTT-DoS-Publish"),
        ("TCP_IP-DDoS-ICMP", "DDoS-ICMP"),
        ("TCP_IP-DDoS-SYN", "DDoS-SYN"),
        ("TCP_IP-DDoS-TCP", "DDoS-TCP"),
        ("TCP_IP-DDoS-UDP", "DDoS-UDP"),
        ("TCP_IP-DoS-ICMP", "DoS-ICMP"),
        ("TCP_IP-DoS-SYN", "DoS-SYN"),
        ("TCP_IP-DoS-TCP", "DoS-TCP"),
        ("TCP_IP-DoS-UDP", "DoS-UDP"),
        ("Benign", "Benign"),
    )
    for token, label in rules:
        if token in stem:
            return label
    return None
