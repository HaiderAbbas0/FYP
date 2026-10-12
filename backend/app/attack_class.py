"""Attack-shape classification shared by the Response Agent and the policy gate.

The Response Agent used to choose purely from device criticality and source
cardinality. A TCP flood and an MQTT Connect flood therefore produced the same
recommendation even though they exhaust completely different resources: one
saturates bandwidth, the other exhausts the connection table. The detector can
already tell them apart - this module is what lets that distinction reach the
decision.

It is deliberately a small closed vocabulary. Only the shapes that genuinely
change which bounded action helps are represented. Anything unrecognised becomes
`unknown`, and `unknown` reproduces the previous behaviour exactly rather than
guessing.

No model is consulted here. This is classification, not reasoning, and it is
deterministic for the same reason the policy gate is.
"""

from __future__ import annotations

from .action_catalog import ACTION_NAMES
from .schemas import DetectorEvent

#: volumetric packet flood - bandwidth is the contended resource
FAMILY_BANDWIDTH = "bandwidth"
#: connection-table exhaustion - the contended resource is connection state
FAMILY_CONNECTION = "connection"
#: broker/session abuse - the contended resource is application sessions
FAMILY_SESSION = "session"
#: not derivable from the detector labels; behave exactly as before
FAMILY_UNKNOWN = "unknown"

ATTACK_SHAPES = (FAMILY_BANDWIDTH, FAMILY_CONNECTION, FAMILY_SESSION, FAMILY_UNKNOWN)

#: devices that carry traffic for other devices. Isolating one severs its
#: downstream dependents, which is collateral damage rather than containment.
SHARED_TRANSPORT_CLASSES = frozenset({
    "mqtt-broker",
    "network-gateway",
    "transport-hub",
})

#: per-shape action preference, ordered least-disruptive-first within the set
#: that is actually permitted for the incident. Only shapes the legacy binary
#: detector could never emit carry an entry, so existing behaviour is unchanged
#: for every incident the previous runtime was able to produce.
SHAPE_ACTION_ORDER = {
    # Connection-table exhaustion is not addressed by packet rate limiting:
    # the packets are cheap and the table is what fills. Cap connections first.
    FAMILY_CONNECTION: (
        "connection_cap",
        "upstream_rate_limit",
        "upstream_prefix_ratelimit",
        "temp_source_block",
    ),
    # Publish/connect spam is spread across sources more often than not, so a
    # prefix-wide limit addresses it better than a single-source block, and
    # better than a connection cap which would throttle healthy sessions.
    FAMILY_SESSION: (
        "upstream_prefix_ratelimit",
        "upstream_rate_limit",
        "connection_cap",
        "temp_source_block",
    ),
}

#: labels that mark a connection-state attack, across both detector label
#: schemes (legacy `TCP_Flood`-style subtypes and Hamd's `MQTT-Connect`)
_CONNECTION_MARKERS = ("connect", "handshake", "syn", "half-open")
#: labels that mark application-session abuse
_SESSION_MARKERS = ("publish", "subscribe", "session", "keepalive", "flood-topic")


def classify(event: DetectorEvent) -> str:
    """Map detector labels onto the attack shape that decides the response.

    Reads family, subtype and variant together because the two detector paths
    put the distinguishing token in different fields: the legacy forest reports
    `DoS`/`TCP_Flood`, the multiclass bundle reports `MQTT-Flood`/
    `MQTT-Connect`/`MQTT-DoS-Connect`.
    """
    haystack = " ".join(
        part for part in (event.attack_family, event.attack_subtype, event.attack_variant) if part
    ).lower()
    if not haystack.strip():
        return FAMILY_UNKNOWN

    # Checked before the family name so `MQTT-Flood` on the Connect variant is
    # classified by what it does, not by the family bucket it happens to sit in.
    if any(marker in haystack for marker in _CONNECTION_MARKERS):
        return FAMILY_CONNECTION
    if any(marker in haystack for marker in _SESSION_MARKERS):
        return FAMILY_SESSION
    if any(marker in haystack for marker in ("dos", "ddos", "flood", "tcp", "udp", "icmp")):
        return FAMILY_BANDWIDTH
    return FAMILY_UNKNOWN


def permitted_actions(shape: str, *, life_critical: bool, cardinality: str) -> tuple[str, ...]:
    """Ordered actions that are permitted for this incident, narrowest first.

    Filters out anything the incident's own evidence has already ruled out:
    irreversible actions on life-critical classes, and single-source blocking
    when the source count says it cannot work or was never established. An empty
    result means the caller must escalate rather than pick a lesser evil.
    """
    if shape not in SHAPE_ACTION_ORDER:
        return ()
    allowed = []
    for action in SHAPE_ACTION_ORDER[shape]:
        if action not in ACTION_NAMES:
            continue
        # Single-source blocking needs an established single source. Unknown or
        # distributed cardinality is the Traffic specialist admitting it cannot
        # show that blocking would work, not evidence that it would.
        if action == "temp_source_block" and cardinality != "single":
            continue
        allowed.append(action)
    return tuple(allowed)


#: Measured, not assumed. The staged bundle cannot separate same-protocol DoS
#: from DDoS (46.53% swap on TCP_IP-DoS-TCP_test) and collapses MQTT DoS/DDoS
#: pairs asymmetrically. The cause is structural: CICIoMT2024 features are
#: post-extraction and carry no source addresses, so nothing in the feature set
#: encodes attacker count. See docs/ayesha/evidence/multiclass-evaluation/.
_AMBIGUOUS_FAMILY_TOKENS = ("ddos", "dos")


def label_uncertainty(event: DetectorEvent) -> str | None:
    """Report when the variant label sits inside a pair the model cannot separate.

    Returns a note for a human-readable evidence record, or None when the label
    is not in a known-ambiguous pair. This never changes the recommended action -
    it exists so the incident record says plainly which part of the label is
    measured and which part is not.
    """
    haystack = " ".join(
        part for part in (event.attack_family, event.attack_subtype, event.attack_variant) if part
    ).lower()
    if not any(f"-{token}" in haystack or haystack.startswith(token) for token in _AMBIGUOUS_FAMILY_TOKENS):
        return None
    protocol = event.attack_subtype if event.attack_subtype else event.attack_family
    return (
        f"DoS/DDoS at {protocol} is not separable from this feature schema: the captures carry no "
        "source addresses, so the prediction is evidence of an attack of this protocol, not of the "
        "attacker count. Do not read this label as a settled DoS-versus-DDoS finding."
    )


def is_shared_transport(device_type: str) -> bool:
    """True when isolating or capping this device also affects other devices."""
    return device_type in SHARED_TRANSPORT_CLASSES