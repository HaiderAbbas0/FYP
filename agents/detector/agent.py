"""Compatibility shim: legacy capture paths re-pointed at data/pcap_test.

The old `agents/detector/agent.py` pointed at removed CSV captures. This shim
re-exports `ATTACK_CAPTURE` and `BENIGN_CAPTURE` pointing at PCAP files so the
tests that reference them keep working against the new detector layout.
"""

from __future__ import annotations

from pathlib import Path

_HERE = Path(__file__).resolve()
_PROJECT_ROOT = _HERE.parents[3]  # agents/detector/agent.py -> FYP root
PCAP_DIR = _PROJECT_ROOT / "data" / "pcap_test"

ATTACK_CAPTURE = PCAP_DIR / "TCP_IP-DoS-SYN_test.pcap"
BENIGN_CAPTURE = PCAP_DIR / "Benign_test.pcap"
DETECTOR_DIR = PCAP_DIR

__all__ = ["ATTACK_CAPTURE", "BENIGN_CAPTURE", "DETECTOR_DIR"]
