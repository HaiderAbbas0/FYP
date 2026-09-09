"""Deterministic safety policy - the only component with execution authority.

Nothing here calls a model. The Response Agent *recommends*; this module
decides. That separation is the core safety property of the design: a confident
detector, a high similarity score and a persuasive LLM recommendation are, in
combination, still not sufficient to justify an unsafe action.

Verdicts:
  PASS       - execute as recommended
  DOWNGRADE  - execute the nearest permitted action that still addresses the attack
  ESCALATE   - execute nothing; hand to a human with all evidence attached

The gate fails closed. If a rule cannot be evaluated, the answer is ESCALATE.
"""

from __future__ import annotations

from .config import settings
from .memory import IRREVERSIBLE_ACTIONS, LIFE_CRITICAL_CLASSES
from .schemas import (
    DetectorEvent,
    PolicyCheck,
    PolicyDecision,
    PolicyVerdict,
    ResponseRecommendation,
)

#: sources that must never be blocked or rate limited (clinical infrastructure)
ALLOWLIST = {"10.0.0.1", "10.0.0.2", "10.0.0.10"}

#: safe substitutes, in preference order, when a recommendation is denied
DOWNGRADE_LADDER = [
    "upstream_rate_limit",
    "connection_cap",
    "temp_source_block",
    "alert_escalate",
]


def evaluate(
    event: DetectorEvent,
    rec: ResponseRecommendation,
    *,
    device_context_available: bool = True,
) -> PolicyDecision:
    checks: list[PolicyCheck] = []

    # If we could not resolve the device class, assume the most restrictive one.
    # Failing safe means over-restricting, never under-restricting.
    life_critical = (
        event.device_type in LIFE_CRITICAL_CLASSES
        or event.device_criticality == "Critical"
        or not device_context_available
    )

    src_ok = event.src_ip not in ALLOWLIST
    checks.append(PolicyCheck(
        rule="RULE-01 source is not allowlisted",
        result="PASS" if src_ok else "FAIL",
        detail=f"src={event.src_ip}",
    ))

    conf_ok = event.confidence >= settings.thresholds.min_action_confidence
    checks.append(PolicyCheck(
        rule=f"RULE-02 detector confidence >= {settings.thresholds.min_action_confidence}",
        result="PASS" if conf_ok else "FAIL",
        detail=f"confidence={event.confidence:.3f}",
    ))

    dur_ok = rec.duration_s <= settings.max_unattended_action_s
    checks.append(PolicyCheck(
        rule=f"RULE-03 duration within the {settings.max_unattended_action_s}s unattended limit",
        result="PASS" if dur_ok else "FAIL",
        detail=f"requested={rec.duration_s}s",
    ))

    irreversible = any(a in rec.action for a in IRREVERSIBLE_ACTIONS)
    class_ok = not (irreversible and life_critical)
    checks.append(PolicyCheck(
        rule=f"RULE-04 action permitted for device class {event.device_type}",
        result="PASS" if class_ok else "FAIL",
        detail="isolation-class actions are denied on life-critical devices" if not class_ok else "",
    ))

    rev_ok = rec.reversible or not life_critical
    checks.append(PolicyCheck(
        rule="RULE-05 action is reversible on a life-critical device",
        result="PASS" if rev_ok else "FAIL",
        detail="",
    ))

    failed = [c for c in checks if c.result == "FAIL"]

    if not failed:
        return PolicyDecision(
            verdict=PolicyVerdict.PASS,
            checks=checks,
            executed_action=rec.action,
            rationale=(
                "All checks pass: source is not allowlisted, the action is permitted for this "
                f"device class, duration is within the {settings.max_unattended_action_s}s unattended "
                "limit, and no human approval is required at this criticality."
            ),
        )

    # A blocked source or an untrusted detector means we have no business acting
    # at all - there is nothing safe to downgrade to.
    if not src_ok or not conf_ok:
        return PolicyDecision(
            verdict=PolicyVerdict.ESCALATE,
            checks=checks,
            executed_action=None,
            rationale=(
                "Escalating to a human: "
                + ("the source is allowlisted clinical infrastructure. " if not src_ok else "")
                + ("detector confidence is below the floor required to act autonomously. " if not conf_ok else "")
                + "No autonomous action is taken."
            ),
        )

    # Otherwise downgrade to the strongest permitted action that still helps.
    substitute = _downgrade(rec, life_critical)
    if substitute is None:
        return PolicyDecision(
            verdict=PolicyVerdict.ESCALATE,
            checks=checks,
            executed_action=None,
            rationale="No permitted action addresses this attack on this device class; escalating rather than executing.",
        )

    return PolicyDecision(
        verdict=PolicyVerdict.DOWNGRADE,
        checks=checks,
        executed_action=substitute,
        rationale=(
            f"{failed[0].rule} failed. The recommendation is not silently rejected - it is downgraded to "
            f"{substitute}, the nearest permitted action that still addresses the attack, and the rejection "
            "is written to the incident log so the Response Agent's error rate stays measurable."
        ),
    )


def _downgrade(rec: ResponseRecommendation, life_critical: bool) -> str | None:
    duration = min(rec.duration_s or settings.max_unattended_action_s, settings.max_unattended_action_s)
    for action in DOWNGRADE_LADDER:
        if any(a in action for a in IRREVERSIBLE_ACTIONS):
            continue
        if action == "alert_escalate":
            return "alert_escalate()"
        return f"{action}({duration}s)"
    return None
