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

from .action_catalog import ACTION_NAMES, format_action, recommendation_action_is_catalogued
from .attack_class import FAMILY_UNKNOWN, classify, is_shared_transport, permitted_actions
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
POLICY_VERSION = "policy-v2"

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
    required_evidence_complete: bool = True,
    max_action_duration_s: int | None = None,
) -> PolicyDecision:
    checks: list[PolicyCheck] = []
    duration_limit = settings.max_unattended_action_s
    if max_action_duration_s is not None:
        if type(max_action_duration_s) is not int or max_action_duration_s < 1:
            return PolicyDecision(verdict=PolicyVerdict.ESCALATE, checks=[PolicyCheck(
                rule="RULE-03 valid executor duration limit", result="FAIL", detail="executor duration limit is invalid")],
                executed_action=None, rationale="Executor duration bounds unavailable; no action authorized.")
        duration_limit = min(duration_limit, max_action_duration_s)

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

    dur_ok = 1 <= rec.duration_s <= duration_limit
    checks.append(PolicyCheck(
        rule=f"RULE-03 duration within the {duration_limit}s unattended limit",
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

    evidence_complete = required_evidence_complete and device_context_available
    checks.append(PolicyCheck(
        rule="RULE-06 all required decision evidence is available",
        result="PASS" if evidence_complete else "FAIL",
        detail="" if evidence_complete else "device context or another required specialist is unavailable",
    ))

    action_ok = recommendation_action_is_catalogued(rec)
    checks.append(PolicyCheck(
        rule="RULE-07 action matches the bounded action catalog",
        result="PASS" if action_ok else "FAIL",
        detail="" if action_ok else f"action must use one of: {', '.join(sorted(ACTION_NAMES))}",
    ))

    # Attack-aware authorisation. Shape awareness may only *narrow* what the
    # incident's own evidence already permits; it can never widen it. An
    # incident the classifier does not recognise is governed by the pre-existing
    # rules above alone.
    shape = classify(event)
    shape_permitted = permitted_actions(
            shape, life_critical=life_critical, cardinality=rec.params.get("source_cardinality", "unknown"),
    )
    if shape == FAMILY_UNKNOWN or not shape_permitted:
            checks.append(PolicyCheck(
                rule="RULE-08 action is consistent with the classified attack shape",
                result="PASS",
                detail=f"attack shape '{shape}' carries no shape-specific authorisation; baseline rules apply",
            ))
    else:
            shape_ok = rec.params.get("base_action") in shape_permitted
            collateral = is_shared_transport(event.device_type) and rec.params.get("base_action") == "device_isolate"
            if collateral:
                checks.append(PolicyCheck(
                    rule="RULE-08 action is consistent with the classified attack shape",
                    result="FAIL",
                    detail=(f"{event.device_type} carries traffic for other devices; isolation would be "
                            "collateral damage, not containment"),
                ))
            else:
                checks.append(PolicyCheck(
                    rule="RULE-08 action is consistent with the classified attack shape",
                    result="PASS" if shape_ok else "FAIL",
                    detail="" if shape_ok else (
                        f"attack shape '{shape}' permits only: {', '.join(shape_permitted)}; "
                        f"recommended '{rec.params.get('base_action')}'"
                    ),
                ))

    failed = [c for c in checks if c.result == "FAIL"]

    if action_ok and rec.params.get("base_action") == "alert_escalate":
        return PolicyDecision(
            verdict=PolicyVerdict.ESCALATE,
            checks=checks,
            executed_action=None,
            rationale="The selected action requires human follow-up; no actuator action will run.",
        )

    if not failed:
        return PolicyDecision(
            verdict=PolicyVerdict.PASS,
            checks=checks,
            executed_action=rec.action,
            rationale=(
                "All checks pass: source is not allowlisted, the action is permitted for this "
                f"device class, duration is within the {duration_limit}s unattended "
                "limit, and no human approval is required at this criticality."
            ),
        )

    # A blocked source, untrusted detector, or missing required evidence means
    # there is no safe basis for autonomous action or downgrade.
    if not src_ok or not conf_ok or not evidence_complete or not action_ok:
        return PolicyDecision(
            verdict=PolicyVerdict.ESCALATE,
            checks=checks,
            executed_action=None,
            rationale=(
                "Escalating to a human: "
                + ("the source is allowlisted clinical infrastructure. " if not src_ok else "")
                + ("detector confidence is below the floor required to act autonomously. " if not conf_ok else "")
                + ("required decision evidence is missing or unavailable. " if not evidence_complete else "")
                + ("the action is invalid or does not match its bounded parameters. " if not action_ok else "")
                + "No autonomous action is taken."
            ),
        )

    # Otherwise downgrade to the strongest permitted action that still helps.
    substitute = _downgrade(rec, life_critical, duration_limit)
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


def _downgrade(rec: ResponseRecommendation, life_critical: bool, duration_limit: int | None = None) -> str | None:
    duration = min(max(rec.duration_s, 1), duration_limit or settings.max_unattended_action_s)
    for action in DOWNGRADE_LADDER:
        if any(a in action for a in IRREVERSIBLE_ACTIONS):
            continue
        return format_action(action, duration)
    return None
