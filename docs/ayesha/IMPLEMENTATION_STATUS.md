# Implementation status — Ayesha

Updated as work lands. This is not a replacement for `docs/haider/IMPLEMENTATION_STATUS.md`.

## Done

| Item | Location |
|---|---|
| Owner docs + work log | `docs/ayesha/` |
| Multiclass inference adapter | `agents/detector/multiclass.py` |
| Adapter / HTTP / opt-in tests | `backend/tests/test_multiclass_detector.py` |
| Inspect routes | `GET /api/detector/multiclass/info`, `/sample` |
| Capture-replay detector selection | `IDS_DETECTOR=multiclass` (default) or `legacy` in `incidents.py` + `manifest.py` |
| Held-out multiclass evaluation | `agents/detector/evaluate.py`, `backend/evaluate_multiclass.py` |
| Evaluation evidence (all 13 classes) | `docs/ayesha/evidence/multiclass-evaluation/` |
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

## Open item for the detector owner

[`DETECTOR_LIMITATION_HANDOFF.md`](DETECTOR_LIMITATION_HANDOFF.md) records the
DoS/DDoS separability ceiling with the measurements behind it, three options, and
the specific decision needed from Hamd. Nothing in the runtime depends on that
decision; the system already reports the limit rather than hiding it.

## Measured on the official test captures

`docs/ayesha/evidence/multiclass-evaluation/`, **1,583,015 rows across all 13
declared classes** (full CICIoMT2024 `*_test` split held out from training):

- Macro-F1 0.7448, accuracy 0.7800.
- Benign false-alarm rate **0.0000** (1 of 37,607 benign rows called an attack).
- Top-label ECE 0.0563.
- Local CPU latency 20.8 ms p50 single row, 453 ms per 512-row batch.

| Verification status | Classes |
|---|---|
| Verified | 4 - `Benign`, `DDoS-SYN`, `MQTT-DoS-Connect`, `MQTT-DDoS-Connect` |
| Not separable (DoS/DDoS pair) | 9 - every remaining class |
| Unevaluated | 0 - all 13 now have captures |

Per-pair DoS/DDoS swap rates: MQTT-Connect 0.15%, SYN 8.35%, TCP 18.20%,
ICMP 22.80%, UDP 33.59%, MQTT-Publish 43.86%. Only the MQTT Connect pair
separates cleanly. UDP is the weakest family overall (`DoS-UDP` F1 0.444,
`DoS-ICMP` F1 0.374).

Consequence: activating multiclass is defensible for **binary attack vs benign**
and **family/subtype routing** - zero false alarms and every family detected. It
is **not** defensible as a 13-class variant labeller. The default remains
`legacy`; see "Not done".

## Explicitly unchanged

- `agents/detector/agent.py` legacy RandomForest replay
- `docs/haider/` and `docs/hamd/`
- `GET /api/detector/info` (still the binary RF / TCP_Flood card) and the legacy replay path
- Fixture source mode (synthetic windows, no hierarchy)
- Policy, workers, gateway, case memory

## Not done

- The 13-class variant level is still not a trustworthy label. Activation was
  justified for binary and family/subtype routing; the nine DoS/DDoS classes stay
  `not_separable` in `agents/detector/verification.py` and carry a runtime caveat
  via `label_uncertainty()`. Switching the *variant* behaviour on is a separate,
  evidence-gated decision that has not been made.
- UDP is the weakest family (`DoS-UDP` F1 0.444, `DoS-ICMP` F1 0.374). Retraining
  is Hamd's scope; nothing in the runtime papers over it.
- Frontend changes
