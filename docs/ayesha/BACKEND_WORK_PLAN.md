# Backend work plan (Ayesha)

Default rule: do not rewrite Haider’s pipeline or Hamd’s training notebook. Extend with new files and tests. Keep the legacy binary detector as the active `get_detector()` path until tests say a switch is safe.

## Phase 0 — Bring up the existing backend

1. Create `backend/.venv`, install `requirements.txt`, then `pip install --no-deps -e ..`.
2. Follow `docs/haider/RUNTIME_RUNBOOK.md` for localhost auth.
3. Run `python -m unittest discover -s tests -v` from `backend`.
4. Confirm `GET /api/health` and the unchanged `GET /api/detector/info` (legacy RF card).

## Phase 1 — Multiclass adapter (done)

Hamd’s LightGBM bundle is staged at `agents/detector/artifacts/multiclass/detector_bundle.joblib`. It is not activated in capture-replay or `/api/simulate`.

Delivered in this phase:

- `agents/detector/multiclass.py` — load bundle, validate features, emit Hamd’s incident object.
- Keep variant confidence separate from window-mean attack probability.
- Reject frames that contain none of the model features (no silent all-missing imputation).
- `GET /api/detector/multiclass/info` and `GET /api/detector/multiclass/sample` — inspect the adapter without changing legacy routes.
- Tests in `backend/tests/test_multiclass_detector.py`.
- Optional LightGBM install via `backend/requirements-detector.txt`.

Not in this phase: changing default `capture_replay` to the new model.

## Phase 2 — Safe activation (done, still opt-in)

1. Flag `IDS_DETECTOR=multiclass` (default `legacy`).
2. Hierarchy-aware `DetectorEvent` (`attack_family` / subtype / variant). `connection_fanout` stays 0.
3. Manifest hashes the LightGBM bundle when the flag is on.
4. Evidence under `docs/ayesha/evidence/` for prefix checks, not a full 13-class evaluation.

## Phase 3 — Attack-aware decisions (done)

The Response Agent chose only from device criticality and source cardinality, so
every attack produced the same action regardless of what it actually exhausted.

- `backend/app/attack_class.py` — maps detector family/subtype/variant onto three
  shapes (`bandwidth`, `connection`, `session`, `unknown`) and states which
  actions each permits. Handles both detector label schemes.
- `agents/response/agent.py` — shape table consulted before the legacy table.
  `FALLBACK_TABLE` retained verbatim and still decides every `bandwidth` and
  `unknown` incident, so the legacy path is provably unchanged.
- `backend/app/policy.py` — RULE-08 may only *narrow* authority, never widen it.
  `POLICY_VERSION` bumped `policy-v1` → `policy-v2`.
- `agents/investigator/specialists/` — evidence narrates the attack that is
  present instead of asserting a TCP flood for every incident.
- Tests: `test_attack_aware_response.py` (25), `test_specialist_evidence.py` (24).

## Phase 4 — Identity and honest reporting (done)

- Variant is part of case identity: `CaseRecord.attack_variant`, a variant
  segment in the behavioural signature, and a similarity term scored only when
  both sides report one. Absence uses an explicit sentinel, never a mismatch.
- `agents/detector/verification.py` separates **declared** classes (13, what the
  model emits) from **verified** ones (3, cleared `VERIFICATION_STANDARD`) and
  from `not_separable` (3, measured DoS/DDoS confusion). Wired into
  `GET /api/detector/multiclass/info`.
- Tests: `test_variant_identity.py` (16), `test_detector_verification_api.py` (21).

## Phase 5 — Pipeline evaluation (done)

`backend/pipeline_evaluation.py` — 140 checks across detector, routing, evidence,
response, policy, safety, memory and reproducibility over all 5 scenarios, plus
5 fail-closed checks. Result **140/140**, exit 0.

Evidence in `docs/ayesha/evidence/pipeline-evaluation/`. The harness was
negative-controlled against a deliberately broken response agent: it reported
138/140, named both failing checks and exited 1, so a green run means something.

## Phase 6 — Structure (done)

The five specialists moved out of one 400+ line module into one module each,
with shared helpers in `common.py` and the registry in `agent.py`. Behaviour
unchanged; all pre-existing import paths still resolve.

## Closed — activation decision

**Decision taken 12 Oct 2026: `multiclass` is the default capture-replay detector.**

Basis, both under `docs/ayesha/evidence/`:

- `multiclass-evaluation/` — 1,583,015 rows over **all 13 classes**, macro-F1 0.7448,
  benign false-alarm rate **0.0000**, ECE 0.0563.
- `pipeline-evaluation/` — 140/140 checks, all 5 scenarios, all 3 attack shapes, with
  a negative control proving the harness detects a broken system.

`IDS_DETECTOR=legacy` remains available as an explicit fallback for hosts without
the LightGBM dependency. `GET /api/detector/info` still serves the unchanged
binary RandomForest card.

The variant level is explicitly **not** activated: nine DoS/DDoS classes remain
`not_separable`, and `label_uncertainty()` carries that caveat into every incident
record so the pipeline and UI cannot present the label as settled.

## Phase 7 — Frontend (not started)

Blocked only by the missing `node_modules`; the API fields it needs are now
stable. Design-preview screens stay mock.
