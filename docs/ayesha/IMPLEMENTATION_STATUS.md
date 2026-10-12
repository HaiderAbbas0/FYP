# Implementation status — Ayesha

Updated as work lands. This is not a replacement for `docs/haider/IMPLEMENTATION_STATUS.md`.

## Done

| Item | Location |
|---|---|
| Owner docs + work log | `docs/ayesha/` |
| Multiclass inference adapter | `agents/detector/multiclass.py` |
| Adapter / HTTP / opt-in tests | `backend/tests/test_multiclass_detector.py` |
| Inspect routes | `GET /api/detector/multiclass/info`, `/sample` |
| Opt-in capture-replay | `IDS_DETECTOR=multiclass` in `incidents.py` + `manifest.py` |
| Held-out multiclass evaluation | `agents/detector/evaluate.py`, `backend/evaluate_multiclass.py` |
| Evaluation evidence (6 of 13 classes) | `docs/ayesha/evidence/multiclass-evaluation/` |
| Local backend venv | Python 3.12.3, LightGBM 4.6.0 |
| Attack-aware response selection | `backend/app/attack_class.py`, `agents/response/agent.py` |
| Policy gate RULE-08 (shape may narrow, never widen) | `backend/app/policy.py` |
| Attack-aware decision tests (25) | `backend/tests/test_attack_aware_response.py` |
| Shape-aware specialist evidence | `agents/investigator/specialists/{traffic_analysis,log_analysis}.py` |
| DoS/DDoS label-uncertainty record | `backend/app/attack_class.py` (`label_uncertainty`) |
| Severity accounts for label ambiguity | `agents/investigator/agent.py` (`_rule_severity`) |
| Specialist evidence tests (24) | `backend/tests/test_specialist_evidence.py` |
| Variant-aware case identity | `agents/controller/agent.py`, `agents/memory/agent.py` |
| Variant identity tests (16) | `backend/tests/test_variant_identity.py` |
| Declared vs verified class reporting | `agents/detector/verification.py`, `backend/app/main.py` |
| Verification API tests (21) | `backend/tests/test_detector_verification_api.py` |
| Pipeline evaluation harness (140 checks) | `backend/pipeline_evaluation.py` |
| Pipeline evaluation tests (13) | `backend/tests/test_pipeline_evaluation.py` |
| Specialists split into per-agent modules | `agents/investigator/specialists/` |

## Measured on the local test captures

`docs/ayesha/evidence/multiclass-evaluation/`, 181,671 rows over 6 of 13
classes (7 classes have no local test capture and are untested, not failing):

- Macro-F1 0.7655 over the classes present; accuracy 0.7485.
- Benign false-alarm rate 0.0000 (1 of 37,607 benign rows called an attack).
- `DoS-TCP` vs `DDoS-TCP` swap rate 0.4653 — the 13-class variant level is not
  separable for the DoS/DDoS pairs from post-extraction features that carry no
  source addresses.
- `MQTT-DDoS-Publish` recall 0.1185 against `MQTT-DoS-Publish`; the reverse
  direction holds (0.9998). Precision stays high in both directions.
- Top-label ECE 0.15.
- Local CPU latency: 21.3 ms p50 single row, 541 ms for a 512-row batch.

Consequence: activating multiclass is defensible for **binary attack vs
benign** and **family/subtype routing**, not as a 13-class variant labeller.
The default remains `legacy`; see `IMPLEMENTATION_STATUS.md` "Not done".

## Explicitly unchanged

- `agents/detector/agent.py` legacy RandomForest replay
- `docs/haider/` and `docs/hamd/`
- Default capture-replay and `GET /api/detector/info` (binary RF / TCP_Flood)
- Fixture source mode (synthetic windows, no hierarchy)
- Policy, workers, gateway, case memory

## Not done

- Making multiclass the default detector. **The activation evidence is now in
  place**: `docs/ayesha/evidence/pipeline-evaluation/` records 140/140 checks
  passing across all 5 scenarios and all 3 attack shapes, with a negative control
  proving the harness detects a broken system. The evidence supports activating
  multiclass for binary and family/subtype routing. It does not support the
  13-class variant level, which is recorded as `not_separable` for 3 classes by
  `agents/detector/verification.py`. Switching the default is a team decision
  that should cite both evidence directories.
- Full held-out evaluation across all 13 classes — 7 have no local test capture.
- Frontend changes
