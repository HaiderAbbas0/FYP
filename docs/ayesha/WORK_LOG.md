# Work log — Ayesha Ikram

Dated record of backend work. Teammate folders were not edited.

## 11 Oct 2026 — Phase 0: environment

- Created `docs/ayesha/` (README, plan, status, runtime notes).
- Recreated `backend/.venv` with Windows Python 3.12.3 (MSYS `python` had produced a Unix-style venv without `Scripts\python.exe`).
- Installed `requirements.txt`, editable repo package, and `requirements-detector.txt` (LightGBM 4.6.0).
- Full unittest: 87 tests, 4 Postgres skipped, 0 failures (before opt-in tests).

## 11 Oct 2026 — Phase 1: staged multiclass adapter

- Added `agents/detector/multiclass.py` without changing `agents/detector/agent.py`.
- Adapter loads Hamd’s bundle, rejects empty feature sets, keeps variant confidence separate from window-mean P(Attack).
- Added inspect routes `GET /api/detector/multiclass/info` and `GET /api/detector/multiclass/sample`.
- Legacy `GET /api/detector/info` still reports RandomForest / 45 features / TCP_Flood.
- Live API check on port 8099: benign sample mean P(Attack) 0.0671; DoS-TCP prefix majority `DDoS-TCP`, P(Attack) 1.0, variant confidence 0.8441.

## 11 Oct 2026 — Phase 2: opt-in capture-replay

- Flag `IDS_DETECTOR=legacy|multiclass`. Default remains legacy.
- `replay_scenario` / `build_event` / `detector_artifact` use LightGBM only when the flag is `multiclass`.
- `DetectorEvent.attack_variant` added as optional. Routing confidence is calibrated variant confidence; `anomaly_score` is window-mean P(Attack). `connection_fanout` stays 0.
- Manifest hashes the multiclass bundle when the flag is on; `public_config.detector` records the mode.
- `GET /api/health` reports `detector`.
- Commented the flag in `backend/.env.example`.
- Fixture runs are unchanged (no hierarchy on synthetic windows).
- Adapter tests: 13 passed. Evaluation + fixture pipeline regression: 9 passed.
- Saved `docs/ayesha/evidence/opt_in_capture_replay_low.json` (low scenario: variant `DoS-TCP`, routing confidence 0.9, window-mean P(Attack) 1.0, source cardinality unknown).

## 11 Oct 2026 — Phase 3 groundwork: held-out multiclass evaluation

- Ran the existing `backend/evaluate_multiclass.py`, which had been written but never executed.
- 181,671 rows across the 6 official `*_test` captures present locally; 7 of 13 classes have no local test capture.
- Macro-F1 0.7655 over present classes; accuracy 0.7485; benign false-alarm rate 0.0000.
- `DoS-TCP`/`DDoS-TCP` swap rate 0.4653; `MQTT-DDoS-Publish` recall 0.1185 against `MQTT-DoS-Publish`. Top-label ECE 0.15.
- Wrote `docs/ayesha/evidence/multiclass-evaluation/` (summary.json, per_class_metrics.csv, confusion_matrix.csv, per_file.csv, README.md) and linked it from the evidence index.
- Decision left open and documented: the evidence supports activating multiclass for binary and family/subtype routing, but not as a 13-class variant labeller. Default stays `legacy`.
- Verified the wider backend is still green: `unittest discover -s tests` = 92 passed, 4 skipped.

## 11 Oct 2026 - Phase 4: attack-aware response decisions

- The Response Agent chose only from device criticality and source cardinality, so a TCP flood and an
  MQTT Connect flood produced the same action despite exhausting different resources.
- Added `backend/app/attack_class.py`: maps detector family/subtype/variant onto three shapes -
  `bandwidth`, `connection`, `session`, plus `unknown`. Handles both label schemes (legacy
  `DoS`/`TCP_Flood` and Hamd's `MQTT-Flood`/`MQTT-Connect`).
- `agents/response/agent.py` consults a shape table before the legacy criticality/cardinality table.
  `FALLBACK_TABLE` is retained verbatim and still decides every `bandwidth` and `unknown` incident.
- `backend/app/policy.py` gained RULE-08, which may only narrow what the incident's own evidence
  already permits. It never widens authority: allowlisted sources, low confidence, missing evidence,
  life-critical isolation and the unattended duration limit all still escalate as before.
- Rule also refuses to isolate shared transport (`mqtt-broker`), which carries traffic for 40+
  downstream devices - that is collateral damage, not containment.
- `POLICY_VERSION` bumped `policy-v1` -> `policy-v2`; the bump is deliberate so previously recorded
  cases cannot silently authorise reuse under the new authorisation rules.
- Recommendation `params` now carry `attack_shape` and `source_cardinality` so the gate evaluates the
  same evidence the agent selected on.
- Added `backend/tests/test_attack_aware_response.py` - 25 checks over the three decision axes plus
  the "shape can narrow but never widen" property.
- Full suite: 117 passed, 4 skipped (Postgres), 0 failures.
- Verified on real capture replay with `IDS_DETECTOR=multiclass`: `DoS-TCP` -> bandwidth,
  `MQTT-DoS-Connect` -> connection, `MQTT-DoS-Publish` -> session.

## 11 Oct 2026 - Phase 5: evidence that matches the attack

- The Traffic and Log specialists narrated every incident as a TCP flood. Real capture replay showed why
  that was wrong: an MQTT publish flood runs at 0.57x the benign baseline flow rate with 3.57x packet
  size, so a "high-rate flood" narrative described the attack backwards.
- `agents/investigator/specialists/`: added `_traffic_summary` and `_connection_state_summary` to `common.py`,
  which describe the shape actually present. Each evidence record now carries `attack_shape`, plus
  `rate_profile_is_diagnostic` / `counters_diagnostic_for_this_attack`, plus `label_uncertainty`.
- `backend/app/attack_class.py`: added `label_uncertainty`, which flags DoS/DDoS pairs as unseparable
  from this feature schema, citing the measured 46.53% swap rate rather than assuming it.
- `agents/investigator/agent.py`: `_rule_severity` now refuses to report a clean `low` for an
  ambiguous DoS/DDoS label. Clinical context stays primary - a Critical device is still `high`.
- Added `backend/tests/test_specialist_evidence.py` - 24 checks.
- Full suite: 141 passed, 4 skipped (Postgres), 0 failures.
- Verified live against a fresh server on port 8099 with `IDS_DETECTOR=multiclass`; all three
  scenarios reach `completed`:
  - `low` -> DoS-TCP -> `upstream_rate_limit(300s)`
  - `mqtt-dos-connect` -> MQTT-DoS-Connect -> `connection_cap(180s)`
  - `mqtt-ddos-publish` -> MQTT-DoS-Publish -> `upstream_prefix_ratelimit(180s)`
- Investigation evidence for the MQTT Connect run records severity `medium`, family
  `MQTT-Flood/MQTT-Connect`, shape `connection`, and the DoS/DDoS uncertainty note on both workers.

### Process note

An earlier end-to-end attempt reported the MQTT scenarios as `interrupted` with
`Input should be 'low', 'medium' or 'high'`. That was not a code fault: a uvicorn server started at
14:42 still held port 8099 and was serving the pre-Phase-2 schema. After stopping it and starting a
fresh server, every scenario completes. Re-check for a stale listener on 8099 before trusting a
failed run.

## 12 Oct 2026 - Phase 6: variant identity, honest detector API, pipeline evaluation, specialist split

### Task C - variant in case identity

- `CaseRecord.attack_variant` added (optional, so cases written before it existed still validate).
- `agents/controller/agent.py`: `_behavioral_signature` and `_variant_token`. The signature now carries a
  variant segment, so MQTT Connect and MQTT Publish no longer collapse to the same key. Absence uses the
  explicit `NO_VARIANT = "-"` sentinel rather than an empty segment.
- `agents/memory/agent.py`: `attack_variant` added to the similarity weights (0.10) and scored only when
  BOTH sides report a variant, so a pre-variant case is neither rewarded nor penalised.
  `compared_fields` reports whether the term was actually scored.
- 16 tests in `backend/tests/test_variant_identity.py`.

### Task D - declared vs verified classes

- New `agents/detector/verification.py`. `VERIFICATION_STANDARD` states what "verified" means: at least
  100 scored test rows, recall >= 0.80, precision >= 0.90, and not inside a measured-ambiguous pair.
- Statuses are `verified` / `unevaluated` / `not_separable`. Separability deliberately overrides the score
  bar, so `DoS-TCP` is reported as not separable rather than hidden behind a neutral-sounding word.
- `GET /api/detector/multiclass/info` now returns `declared_classes`, `verified_class_count` and a full
  `verification` block. Current honest position: 13 declared, 3 verified, 7 unevaluated, 3 not separable.
- 21 tests in `backend/tests/test_detector_verification_api.py`.

### Task B - pipeline evaluation

- New `backend/pipeline_evaluation.py`: 140 checks across detector, routing, evidence, response, policy,
  safety, memory and reproducibility, over all 5 scenarios, plus 5 fail-closed checks.
- Result: **140/140 passed**, exit 0. Evidence in `docs/ayesha/evidence/pipeline-evaluation/`.
- Each scenario routes to its own action: DoS-TCP -> upstream_rate_limit, MQTT-DoS-Connect ->
  connection_cap, MQTT-DoS-Publish -> upstream_prefix_ratelimit. All three attack shapes exercised.
- **Negative control**: with the response agent mutated to ignore attack shape, the harness reported
  138/140 and named the two failing checks, exiting 1. The harness is therefore capable of failing;
  the originals were restored and the clean report re-generated.
- 13 tests in `backend/tests/test_pipeline_evaluation.py`, including two negative controls that run the
  harness out-of-process so the mutation cannot leak into other tests.

### Task E - specialist split

- The five specialists moved out of one 400+ line module: `agent.py` (135 lines, registry + supervisor),
  `common.py` (153, shared helpers), and one module per worker (31-60 lines each).
- Behaviour is unchanged: every pre-existing import path still resolves, and the shape-aware evidence
  edits were re-applied to the split files.
- Restored `run_specialists` verbatim from the original rather than paraphrasing it, after an early
  rewrite dropped its `stall` / `cancel_event` parameters and the `_WORKER_LIMITS` semaphore.

### Test suite

92 at project start -> **191** now, 4 skipped (Postgres), 0 failures.
