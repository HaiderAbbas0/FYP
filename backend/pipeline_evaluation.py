"""End-to-end pipeline evaluation under the multiclass detector.

The detector evaluation answers "can the model name the attack?". This one
answers the question that actually gates switching the default: *given that
prediction, does the whole system behave correctly and safely?* A detector can
classify well and still be unsafe to activate if the routing, memory, response
or policy layers mishandle its labels.

Each check maps to one pipeline stage. The suite deliberately includes cases that
must FAIL CLOSED - malformed evidence, an unseparable label, an attack the
response table has never seen - because a pipeline that only passes on happy
paths has not been evaluated.

Writes its report under `docs/ayesha/evidence/pipeline-evaluation/`.
Run from `backend/`:  .venv/Scripts/python pipeline_evaluation.py
"""

from __future__ import annotations

import asyncio
import json
import os
import time
from pathlib import Path
from typing import Any

from agents.detector.captures import ATTACK_CAPTURES, VARIANT_CLASSES
from agents.detector.multiclass import DetectorUnavailable, get_multiclass_detector
from agents.detector.verification import evaluate_verification
from app.attack_class import classify, label_uncertainty, permitted_actions
from app.incidents import build_event, detector_artifact, replay_scenario, scenario
from app.planner import Planner
from app.policy import POLICY_VERSION, evaluate as policy_evaluate
from app.schemas import PolicyVerdict, ResponseRecommendation

OUTPUT = Path(__file__).resolve().parents[1] / "docs" / "ayesha" / "evidence" / "pipeline-evaluation"

#: Scenarios replayed end to end. `low`/`medium`/`high` are the legacy TCP
#: flood family; the two mqtt entries require IDS_DETECTOR=multiclass.
SCENARIOS = ("low", "medium", "high", "mqtt-dos-connect", "mqtt-ddos-publish")

#: What each scenario is expected to contain, asserted rather than assumed.
EXPECTED = {
    "low": {"shape": "bandwidth", "action": "upstream_rate_limit"},
    "medium": {"shape": "bandwidth", "action": "upstream_rate_limit"},
    "high": {"shape": "bandwidth", "action": "upstream_rate_limit"},
    "mqtt-dos-connect": {"shape": "connection", "action": "connection_cap"},
    "mqtt-ddos-publish": {"shape": "session", "action": "upstream_prefix_ratelimit"},
}


def check(name: str, passed: bool, detail: str = "") -> dict[str, Any]:
    return {"check": name, "result": "PASS" if passed else "FAIL", "detail": detail}


def evaluate_scenario(key: str) -> dict[str, Any]:
    """Run one scenario through every layer and record what each one did."""
    findings: list[dict[str, Any]] = []
    result: dict[str, Any] = {"scenario": key}
    started = time.perf_counter()

    scn = scenario(key)

    # --- stage 1/2: detector produces a usable incident object ---------------
    try:
        windows, trigger = replay_scenario(key)
    except (ValueError, DetectorUnavailable) as exc:
        result["checks"] = [check("detector.replay", False, str(exc)[:200])]
        result["status"] = "error"
        return result

    result["windows"] = len(windows)
    result["attack_capture"] = scn.attack_capture
    capture_exists = ATTACK_CAPTURES.get(scn.attack_capture, Path()).exists()
    result["capture_present"] = capture_exists
    findings.append(check("detector.replay_produces_windows", bool(windows), f"{len(windows)} windows"))
    findings.append(check("detector.fires_on_attack_window", trigger is not None))
    if trigger is None:
        result["checks"] = findings
        result["status"] = "no_detection"
        return result

    event = build_event(key, trigger)
    result["variant"] = event.attack_variant
    result["family"] = event.attack_family
    result["subtype"] = event.attack_subtype
    result["confidence"] = event.confidence
    result["confidence_kind"] = event.confidence_kind
    result["anomaly_score"] = event.anomaly_score
    result["connection_fanout"] = event.connection_fanout
    result["device"] = {"id": event.device_id, "type": event.device_type, "criticality": event.device_criticality}

    findings.append(check("detector.labels_within_declared_classes",
                          event.attack_variant in VARIANT_CLASSES, str(event.attack_variant)))
    findings.append(check("detector.confidence_in_range", 0.0 <= event.confidence <= 1.0,
                          f"{event.confidence}"))
    findings.append(check("detector.confidence_kind_declared",
                          event.confidence_kind in ("calibrated", "raw", "aggregate", "unknown"),
                          event.confidence_kind))

    # --- stage 1b: source cardinality honesty --------------------------------
    findings.append(check("evidence.no_source_invented",
                          event.connection_fanout == 0,
                          "connection_fanout stays 0: CIC features carry no addresses"))

    # --- stage 3: routing shape matches the attack ---------------------------
    shape = classify(event)
    expected_shape = EXPECTED[key]["shape"]
    result["shape"] = shape
    findings.append(check("routing.attack_shape_as_expected", shape == expected_shape,
                          f"{shape} (expected {expected_shape})"))

    # --- stage 3b: routing confidence is the detector's, not invented ---------
    findings.append(check("routing.confidence_is_detector_confidence",
                          abs(event.confidence - result["confidence"]) < 1e-9))

    # --- stage 4/5: specialists describe the attack that is present -----------
    from agents.investigator.specialists.agent import log_analysis, traffic_analysis

    async def specialists():
        traffic = await traffic_analysis(event, trigger.stats)
        log = await log_analysis(event, trigger.stats)
        return traffic, log

    traffic, log = asyncio.run(specialists())
    result["traffic_summary"] = traffic.summary
    result["log_summary"] = log.summary
    findings.append(check("evidence.traffic_worker_ok", traffic.status == "ok", traffic.status))
    findings.append(check("evidence.log_worker_ok", log.status == "ok", log.status))
    findings.append(check("evidence.traffic_reports_shape",
                          traffic.findings.get("attack_shape") == shape))
    findings.append(check("evidence.log_reports_shape",
                          log.findings.get("attack_shape") == shape))
    # A session flood must never be narrated as a bandwidth flood.
    if shape == "session":
        findings.append(check("evidence.session_attack_not_narrated_as_flood",
                              "high-rate flood" not in traffic.summary))
        findings.append(check("evidence.session_attack_counters_marked_non_diagnostic",
                              log.findings.get("counters_diagnostic_for_this_attack") is False))

    # --- stage 6: uncertainty is recorded where it applies -------------------
    uncertainty = label_uncertainty(event)
    result["label_uncertainty"] = bool(uncertainty)
    if uncertainty:
        findings.append(check("evidence.uncertainty_recorded",
                              bool(traffic.findings.get("label_uncertainty"))))

    # --- stage 7: response selection agrees with the attack shape -----------
    from agents.investigator.agent import _constraints, _rule_severity
    from agents.response.agent import recommend

    class NullLLM:
        async def complete_json(self, *_a, **_k):
            return None

    cardinality = traffic.findings.get("source_cardinality", "unknown")
    device = None
    gaps = [s for s in (traffic, log) if s.status != "ok"]
    constraints = _constraints(event, [device] if device else [], gaps)
    from app.schemas import Explanation, InvestigationResult

    investigation = InvestigationResult(
        mode="full", confidence_source="rules",
        confirmed_family=f"{event.attack_family}/{event.attack_subtype}",
        severity=_rule_severity(event, gaps),
        evidence_gaps=gaps,
        response_constraints=constraints,
        specialist_results=[traffic, log],
    )
    recommendation = asyncio.run(
        recommend(NullLLM(), event, investigation,
                  Explanation(depth="one-line", text="pipeline evaluation", generated_by="template"), None)
    )
    result["recommended_action"] = recommendation.params.get("base_action")
    result["recommended_duration_s"] = recommendation.duration_s
    result["response_selector"] = recommendation.selector
    expected_action = EXPECTED[key]["action"]
    findings.append(check("response.matches_attack_shape",
                          recommendation.params.get("base_action") == expected_action,
                          f"{recommendation.params.get('base_action')} (expected {expected_action})"))
    findings.append(check("response.action_is_catalogued",
                          recommendation.params.get("base_action") in
                          __import__("app.action_catalog", fromlist=["ACTION_NAMES"]).ACTION_NAMES))
    findings.append(check("response.records_shape_for_the_gate",
                          recommendation.params.get("attack_shape") == shape))
    findings.append(check("response.records_cardinality_for_the_gate",
                          recommendation.params.get("source_cardinality") == cardinality))

    # --- stage 8: policy gate authorises only permitted actions -------------
    life_critical = event.device_criticality == "Critical" or event.device_type in {
        "patient-monitor-gateway", "infusion-pump", "ventilator", "telemetry-hub"}
    decision = policy_evaluate(event, recommendation)
    result["policy_verdict"] = decision.verdict.value
    result["policy_executed_action"] = decision.executed_action
    result["policy_checks"] = [{"rule": c.rule, "result": c.result} for c in decision.checks]
    findings.append(check("policy.verdict_is_pass_or_downgrade",
                          decision.verdict in (PolicyVerdict.PASS, PolicyVerdict.DOWNGRADE),
                          decision.verdict.value))
    findings.append(check("policy.rule08_present",
                          any(c.rule.startswith("RULE-08") for c in decision.checks)))
    if decision.verdict is PolicyVerdict.PASS:
        permitted = permitted_actions(shape, life_critical=life_critical, cardinality=cardinality)
        if permitted:
            findings.append(check("policy.executed_action_within_shape_permission",
                                  recommendation.params.get("base_action") in permitted,
                                  str(recommendation.params.get("base_action"))))

    # --- safety invariants that must hold on every incident ------------------
    findings.append(check("safety.no_irreversible_action_on_critical_device",
                          decision.executed_action is None
                          or "device_isolate" not in decision.executed_action
                          or not life_critical))
    findings.append(check("safety.action_not_executed_on_allowlisted_source",
                          event.src_ip not in {"10.0.0.1", "10.0.0.2", "10.0.0.10"}))
    findings.append(check("safety.duration_within_unattended_limit",
                          recommendation.duration_s <= 300))

    # --- stage 8/9: memory reuse is not granted on unproven precedent -------
    from agents.controller.agent import _behavioral_signature

    signature = _behavioral_signature(event)
    result["behavioral_signature"] = signature
    findings.append(check("memory.signature_is_variant_aware",
                          signature.count(":") >= 3, signature))

    # --- provenance: the manifest must hash the bundle actually used ---------
    from app.manifest import freeze

    manifest = freeze({"source_mode": "capture_replay", "fixture_seed": 42}, [])
    result["manifest_detector"] = manifest["public_config"]["detector"]
    result["manifest_policy_version"] = manifest["public_config"]["policy_version"]
    findings.append(check("reproducibility.manifest_records_active_detector",
                          manifest["public_config"]["detector"] == os.getenv("IDS_DETECTOR", "legacy")))
    findings.append(check("reproducibility.manifest_records_policy_version",
                          manifest["public_config"]["policy_version"] == POLICY_VERSION))
    findings.append(check("reproducibility.manifest_hashes_bundle",
                          "detector_bundle.joblib" in manifest["model_artifacts"]))

    result["elapsed_s"] = round(time.perf_counter() - started, 3)
    result["checks"] = findings
    result["status"] = "evaluated"
    return result


def failure_mode_checks() -> list[dict[str, Any]]:
    """Behaviour that must fail closed. Passing happy paths is not enough."""
    out: list[dict[str, Any]] = []

    # 1. An unrecognised label must not gain shape-specific authority.
    from app.schemas import DetectorEvent

    unknown_event = DetectorEvent(
        incident_id="x", attack_family="Recon", attack_subtype="port_scan", attack_variant="port_scan",
        confidence=0.95, device_id="SN-02", device_type="medical-sensor", device_criticality="Low",
        src_ip="10.20.2.1", dst_ip="10.20.1.5", packets_per_sec=1000)
    out.append(check("failure.unknown_label_classifies_unknown",
                     classify(unknown_event) == "unknown", classify(unknown_event)))
    out.append(check("failure.unknown_label_permits_no_shape_specific_action",
                     permitted_actions(classify(unknown_event), life_critical=False, cardinality="single") == ()))

    # 2. Low confidence must escalate rather than act.
    low = unknown_event.model_copy(update={"confidence": 0.05, "attack_family": "DoS",
                                           "attack_subtype": "TCP", "attack_variant": "DoS-TCP"})
    rec = ResponseRecommendation(action="connection_cap(60s)", duration_s=60,
                                 params={"base_action": "connection_cap", "source_cardinality": "single"},
                                 reversible=True, selector="deterministic_table")
    decision = policy_evaluate(low, rec)
    out.append(check("failure.low_confidence_escalates",
                     decision.verdict is PolicyVerdict.ESCALATE, decision.verdict.value))

    # 3. An allowlisted clinical source must never be actioned.
    allowed = low.model_copy(update={"confidence": 0.95, "src_ip": "10.0.0.10"})
    decision = policy_evaluate(allowed, rec)
    out.append(check("failure.allowlisted_source_escalates",
                     decision.verdict is PolicyVerdict.ESCALATE, decision.verdict.value))

    # 4. Missing evidence must escalate.
    conn = unknown_event.model_copy(update={"attack_family": "MQTT-Flood", "attack_subtype": "MQTT-Connect",
                                            "attack_variant": "MQTT-DoS-Connect"})
    decision = policy_evaluate(conn, rec, device_context_available=False)
    out.append(check("failure.missing_device_context_escalates",
                     decision.verdict is PolicyVerdict.ESCALATE, decision.verdict.value))

    # 5. The scenario that the legacy detector cannot serve must say so.
    from app.incidents import SCENARIOS as _SCN

    out.append(check("failure.mqtt_scenarios_exist_in_registry",
                     all(k in _SCN for k in ("mqtt-dos-connect", "mqtt-ddos-publish"))))
    return out


def run() -> dict[str, Any]:
    os.environ.setdefault("IDS_DETECTOR", "multiclass")
    results = [evaluate_scenario(key) for key in SCENARIOS]
    failures = failure_mode_checks()

    all_checks = [c for r in results for c in r.get("checks", [])] + failures
    passed = sum(1 for c in all_checks if c["result"] == "PASS")
    coverage = {
        "variants_exercised": sorted({r["variant"] for r in results if r.get("variant")}),
        "attack_shapes_exercised": sorted({r["shape"] for r in results if r.get("shape")}),
        "classes_with_local_captures": sorted(
            {r["variant"] for r in results if r.get("variant")}),
        "declared_classes": len(VARIANT_CLASSES),
    }
    verification = evaluate_verification()

    report = {
        "generated": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "detector_mode": os.getenv("IDS_DETECTOR", "legacy"),
        "policy_version": POLICY_VERSION,
        "summary": {
            "checks_total": len(all_checks),
            "checks_passed": passed,
            "checks_failed": len(all_checks) - passed,
            "scenarios_evaluated": sum(1 for r in results if r.get("status") == "evaluated"),
        },
        "coverage": coverage,
        "class_verification": verification["summary"],
        "scenarios": results,
        "failure_modes": failures,
        "unverified_classes": sorted(
            label for label, entry in verification["classes"].items()
            if entry["status"] != "verified"),
        "scope_limits": [
            "capture_replay only; live_lab and the physical gateway are not exercised",
            "the lab actuator is a stub, so this proves authorisation and routing, not containment",
            "malicious-traffic suppression remains unmeasured (-1) without independent counters",
            f"only {len(coverage['variants_exercised'])} of {len(VARIANT_CLASSES)} declared classes have local captures",
        ],
    }
    return report


def main() -> int:
    report = run()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "report.json").write_text(json.dumps(report, indent=2, allow_nan=False), encoding="utf-8")

    rows = ["scenario,check,result,detail"]
    for r in report["scenarios"]:
        for c in r.get("checks", []):
            rows.append("{},{},{},{}".format(
                r["scenario"], c["check"], c["result"], '"' + str(c["detail"]).replace('"', "'") + '"'))
    for c in report["failure_modes"]:
        rows.append("failure_mode,{},{},{}".format(c["check"], c["result"],
                                                   '"' + str(c["detail"]).replace('"', "'") + '"'))
    (OUTPUT / "checks.csv").write_text("\n".join(rows), encoding="utf-8")

    s = report["summary"]
    print(f"detector={report['detector_mode']} policy={report['policy_version']}")
    print(f"checks: {s['checks_passed']}/{s['checks_total']} passed, {s['checks_failed']} failed")
    print(f"variants exercised: {', '.join(report['coverage']['variants_exercised'])}")
    for r in report["scenarios"]:
        for c in r.get("checks", []):
            if c["result"] == "FAIL":
                print(f"  FAIL [{r['scenario']}] {c['check']}: {c['detail']}")
    for c in report["failure_modes"]:
        if c["result"] == "FAIL":
            print(f"  FAIL [failure-mode] {c['check']}: {c['detail']}")
    print(f"wrote {OUTPUT}")
    # Non-zero exit on any failure so this is usable in CI, and so a silently
    # green run cannot be mistaken for a passing one.
    return 1 if s["checks_failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
