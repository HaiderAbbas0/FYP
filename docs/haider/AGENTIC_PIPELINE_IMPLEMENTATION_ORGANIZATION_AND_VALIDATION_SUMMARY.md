# MediSOC Agentic Pipeline: Architecture, Implementation, Agent Organization and Live API Validation

**Prepared for:** Haider Abbas  
**Summary date:** 11 October 2026, Asia/Karachi  
**Project:** MultiAgent-IoMT-IDS-POC  
**Scope:** Work completed and findings recorded throughout this conversation.

## 1. Executive summary

The conversation began with reviewing the proposal, supporting documents and proof of concept, then planning and implementing the architecture while detector training and dataset preparation were assigned separately. The implementation established a coordinated pipeline with typed agent contracts, durable execution, bounded specialist workers, evidence-based reuse, deterministic policy enforcement, gateway interfaces, operational UI and evaluation tooling.

Later, newly supplied detector files were reviewed, agent implementations were reorganized into individual packages, and the reorganized pipeline was tested using configured real LLM API credentials. The trained multiclass LightGBM bundle was also loaded and tested independently.

**Current position:** The implemented agent pipeline runs and its coordination has been tested. The new multiclass detector is organized and locally loadable, but the runtime still uses the legacy binary detector. Full multiclass runtime integration, broader detector evaluation and independently instrumented physical lab acceptance remain unfinished.

This document separates implemented software, observed test results and remaining work. Training metrics, fixture completion and stub execution do not establish live containment effectiveness.

## 2. Architecture decisions and implementation plan

The proposal's overall flow was retained:

```text
Observe -> Detect -> Route -> Retrieve -> Gate reuse -> Investigate
        -> Explain -> Recommend -> Enforce policy -> Execute
        -> Measure outcome -> Write back eligible evidence
```

The architecture was implemented as a modular backend with a FastAPI service, a standalone worker option, shared persistence and isolated specialist processes. One controller owns workflow progression. Agents supply typed results rather than calling each other freely or independently advancing incident state.

The detailed implementation plan was written in [AGENTIC_PIPELINE_IMPLEMENTATION_PLAN.md](AGENTIC_PIPELINE_IMPLEMENTATION_PLAN.md). It covers communication, synchronization, latency, fallbacks, reuse, safety, persistence, testing and evaluation. Supporting implementation and operational documents were also produced:

- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
- [RUNTIME_RUNBOOK.md](RUNTIME_RUNBOOK.md)
- [EVALUATION_GUIDE.md](EVALUATION_GUIDE.md)
- [AGENT_PACKAGE_ORGANIZATION.md](AGENT_PACKAGE_ORGANIZATION.md)

### Main decisions

- Keep coordination under one explicit controller state machine.
- Use structured schemas across agent boundaries.
- Use REST for commands and queries, and replayable SSE for browser events.
- Use PostgreSQL for deployed shared persistence and SQLite for local development.
- Run independent specialists concurrently under bounded process supervision.
- Keep recommendation separate from deterministic authorization and execution.
- Allow fixture execution before final detector and dataset integration.
- Keep verified reuse disabled until calibrated detection and independently measured outcomes support it.

## 3. Agent responsibilities and implemented behavior

| Agent | Responsibility | Implemented behavior |
| --- | --- | --- |
| Detector | Score traffic feature windows | Legacy RF inference, reproducible capture replay, window probabilities, flow statistics and feature evidence |
| Controller / Planner | Coordinate the incident lifecycle | State transitions, risk assessment, routing, evidence joins, deadlines, cancellation and finalization |
| Memory | Retrieve prior cases and assess reuse eligibility | Structured similarity, context compatibility, version/reliability checks, bounded cache and outcome-aware evidence |
| Investigator | Fuse current evidence | Combines detector, retrieved cases and specialist findings; records gaps and constraints; validated LLM output or rules |
| Explainer | Produce an audit explanation | Depth selected by controller; validated LLM output or deterministic template |
| Response | Recommend a bounded action | Shared action catalog, validated LLM recommendation or deterministic response table |
| Specialist workers | Gather domain-specific evidence | Log, traffic, device, history and threat analysis with provenance, status and timing |

The policy gate, executor, telemetry consumer, authentication layer and database repository are shared infrastructure. They are not independent reasoning agents.

### Evidence and fallbacks

Unavailable specialist findings become explicit evidence gaps. Workers do not invent facts to fill missing inputs. Required evidence failures can force escalation; missing advisory evidence can permit continuation with a recorded limitation.

Investigator, explainer and response agents attempt LLM reasoning, validate the result, and use deterministic alternatives when the provider is unavailable or the output is unusable. LLM access includes key rotation, provider failover, a circuit breaker and a bounded whole-chain reasoning budget.

## 4. Communication, synchronization and durable execution

### API and event communication

- `POST /api/runs` creates a durable run independently of a browser connection.
- `GET /api/runs/{run_id}` returns persisted status and run details.
- `GET /api/runs/{run_id}/events` streams ordered events and supports `Last-Event-ID` replay.
- The browser can reconnect without resubmitting the incident.
- Cross-process event observation reads shared persisted events.

### Queue and worker lifecycle

The runtime implements a bounded database queue, atomic worker claims, renewable leases, ordered journals and idempotent submission. Queued jobs survive restart. Expired executing jobs become interrupted; pending external effects can remain unknown and are not automatically replayed.

Database migrations support runs, events, cases, action intents and receipts, rollback receipts, outcome observations, experiments, audits and a durable case outbox.

### Specialist supervision

Specialists run in disposable spawned processes with bounded concurrency and input/output sizes. Their deadlines include queueing and process startup. A stalled worker is terminated and joined after timeout or cancellation. Malformed output becomes an unavailable result without cancelling otherwise valid sibling workers.

Worker results include stable identities, run IDs, evidence provenance, start offsets and measured latency. Frozen history snapshots keep evidence consistent during a run. Explicit in-process mode remains available for deterministic development checks.

### Action synchronization

Cross-worker target locks prevent concurrent live actions on the same registered target. Active or unknown prior effects continue to exclude the target. Execution uses durable intents before effects and receipts after acknowledgements. Missing acknowledgements remain unknown for reconciliation.

The controller uses explicit state transitions, but it is not a crash-resumable workflow engine: interrupted executions are not silently reconstructed and replayed after restart.

## 5. Policy, execution and outcome validation

### Policy and authority

Response recommendations must come from the canonical action catalog. The deterministic policy gate checks device restrictions, duration, confidence, reversibility and required evidence. The executor independently rechecks permitted action, target and duration. Neither an LLM recommendation nor a retrieved case directly authorizes an effect.

### Execution interfaces

Implemented components include:

- Explicit stub executor for local and non-live runs.
- Authenticated HTTP lab gateway adapter.
- Linux nftables gateway service with registered scope and bounded actions.
- Durable action and rollback receipts.
- Expiring rules, rollback support and owned-table restart cleanup.
- Read-only receipt reconciliation for unknown acknowledgements.

The gateway implementation was tested with mocked nft execution. Real firewall enforcement was not performed on the Windows development machine.

### Independent outcomes

Outcome validation consumes independent cumulative counters and sustained baseline/post-action windows. It checks malicious traffic suppression alongside legitimate delivery and latency. Missing, stale, reset or inconsistent evidence produces `UNVALIDATED`.

HTTP availability recovery alone cannot establish successful attack suppression. Harmful measured outcomes can trigger rollback. An unconfirmed rollback requires safe hold and review.

## 6. Memory and safe reuse

Case retrieval remains advisory until the reuse gate is satisfied. Similarity alone cannot skip investigation or authorize an action.

The implemented reuse checks include compatible device context, action/outcome evidence, reliability, detector and policy versions, calibrated confidence and recurrence. Three compatible independent measured live successes can establish reusable evidence. Distinct run IDs are counted once. An adverse matching outcome vetoes the precedent.

Cases and outbox state use shared persistence. Cache entries are filtered and refreshed. Fixture and capture-replay outcomes cannot become learned successful live precedent.

`ENABLE_VERIFIED_REUSE=false` remains the default. Merely loading a calibrated model does not satisfy the independent outcome requirements.

## 7. Authentication, operational UI and evaluation

### Authentication

The API implements viewer, operator and administrator roles using SHA256 key digests. Browser access uses signed HttpOnly sessions, trusted origins and shared database logout revocation. Administrator operations have audit records. Credentials remain in local configuration and are not included in saved reports.

### UI

The operational interface supports authenticated run submission, persisted status, cancellation, case inspection, evaluation views, service health, device views and gateway receipt inspection. Run submission and SSE observation are separate operations. Design/illustration modes are explicitly identified.

### Evaluation tooling

Implemented evaluation profiles compare full investigation, context-gated routing and similarity-only routing. The harness freezes memory, records manifests before execution and exports JSON/CSV results. Manifests contain public configuration, code/model/memory/suite hashes and seeds. Journal hashes support reproducibility.

Latency comes from persisted execution evidence. Specialist resource reports include measured CPU and peak resident memory. Missing or unsupported measurements remain null rather than being fabricated. Peak RSS is the largest reporting child, not summed concurrent application memory.

## 8. Agent package reorganization

Initially, most agent code lived in `backend/app`, while `agents/detector` held model and capture assets. Investigator, explainer and response shared one implementation file. Following the requested organization, agent implementations were moved into the repository-level `agents` package:

```text
agents/
├── __init__.py
├── README.md
├── common.py
├── detector/
│   ├── agent.py
│   ├── README.md
│   ├── artifacts/
│   │   ├── legacy/
│   │   └── multiclass/
│   └── training/multiclass_detector.ipynb
├── memory/
│   ├── agent.py
│   └── README.md
├── investigator/
│   ├── agent.py
│   ├── prompts.py
│   ├── README.md
│   └── specialists/
│       ├── agent.py
│       └── README.md
├── explainer/
│   ├── agent.py
│   ├── prompts.py
│   └── README.md
├── response/
│   ├── agent.py
│   ├── prompts.py
│   └── README.md
└── controller/
    ├── agent.py
    └── README.md
```

Each agent README describes ownership, inputs, outputs, runtime dependencies and failure handling. Specialist registry and worker behavior remain together in `investigator/specialists/agent.py`; each specialist has not yet been split into a separate implementation file. Memory internals and controller routing also remain inside their respective `agent.py` files.

### Compatibility and packaging changes

- Previous `app.detector`, `app.memory`, `app.planner` and `app.specialists` modules now alias their new implementations.
- `app.agents` re-exports the separated investigator, explainer and response functions.
- Existing caller imports and module-level patch locations remain supported.
- Added `pyproject.toml` to package both `agents` and the shared backend `app`.
- Installed the repository in editable mode in the local backend virtual environment.
- Updated Docker to copy agent sources and install the repository package.
- Added Docker exclusions for datasets, training notebooks, model assets, environments and local outputs.
- Updated active detector paths and model artifact hashing.
- Extended code identity hashing to include agent Python files.
- Updated setup instructions and architecture documentation.

Shared API, schemas, configuration, LLM transport, persistence, workers, policy, execution and telemetry remain in `backend/app`. Agent folders do not imply separately deployed microservices or independent state stores.

Attack capture CSVs were moved to `data/detector/`; the benign test capture remains in `data/`. Regression tests remain in `backend/tests/`.

## 9. Review of the supplied trained detector

The supplied files were inspected and organized:

| File | Role | Current location |
| --- | --- | --- |
| `detector_bundle.joblib` | Model, preprocessing, calibrator and metadata | `agents/detector/artifacts/multiclass/` |
| `best_model.json` | Selected model/run reference | `agents/detector/artifacts/multiclass/` |
| `experiment_log.csv` | Recorded model comparisons | `agents/detector/artifacts/multiclass/` |
| Multiclass notebook | Training, evaluation and export workflow | `agents/detector/training/multiclass_detector.ipynb` |

The bundle contains LightGBM, 13 variant classes, 39 model features, fitted preprocessing, sigmoid calibration, hierarchy mappings and version `643ad137db`. Its label hierarchy supports variant, subtype, family and binary outputs.

The 13 classes include benign traffic; SYN, TCP, UDP and ICMP DoS/DDoS variants; and MQTT connect/publish DoS/DDoS variants. The model excludes shortcut features `IAT`, `Number` and `Weight`, plus training-identified constant/duplicate columns. The old 45-feature RF schema and scaler must not be applied to this bundle.

Initial local loading failed because LightGBM was absent. LightGBM 4.6.0 was installed, and the bundle then loaded successfully. Added `backend/requirements-detector.txt` to document that optional dependency. No model training was performed in this conversation.

The selected model's recorded validation macro F1 is approximately 0.8637. The bundle's stored calibrated full-test variant macro F1 is approximately 0.74476. These are exported experiment results, not independently reproduced full-dataset measurements.

`best_model.json` still contains a Colab run directory. That source path is not a usable local runtime path. The matching new model card and schema were not supplied as separate files, although their underlying metadata is present in the bundle.

## 10. Verification performed during the conversation

### Earlier implementation verification

The existing implementation status records:

- 75 local backend checks and four separately executed opt-in PostgreSQL checks.
- PostgreSQL checks against an isolated PostgreSQL 16.15 server, including migration/idempotency, concurrent claims, ordered event writes, target/action exclusion and case outbox behavior.
- 45 paired seeded runs through separate API and worker processes using the socket smoke harness.
- TypeScript checking and Vite production build passing, with advisory build warnings.
- Compose configuration parsing successfully.
- Gateway behavior and generated commands tested using mocked nft execution.

These earlier results predate the package migration. They do not establish that Docker images were built or that physical lab enforcement succeeded. Earlier smoke exports are in [evaluation-smoke/report.json](evaluation-smoke/report.json), [manifest.json](evaluation-smoke/manifest.json) and [runs.csv](evaluation-smoke/runs.csv).

### Regression verification after reorganization

Backend discovery ran 79 tests: **75 passed, four skipped, zero failures**. The skipped tests were PostgreSQL integration checks requiring a separately configured test database. This later run covered the reorganized imports and coordination paths, including queue/persistence behavior, policy boundaries, cancellation, worker deadlines, reuse checks and failure handling.

### Real API credential checks

One configured credential per active provider was checked with a real JSON completion request:

| Provider | Configured model | Result | Observed request latency |
| --- | --- | --- | --- |
| Groq | `openai/gpt-oss-120b` | Successful JSON response | About 988 ms |
| Gemini | `gemini-3.6-flash` | Successful JSON response | About 2,192 ms |

Remaining keys in each pool were not individually tested. Credentials were neither printed nor written to reports.

### Three complete live-LLM pipeline runs

The low, medium and high scenarios ran through separate API and worker processes with authenticated access, spawned specialist workers, isolated temporary SQLite state, real capture rows and actual LLM requests. These runs used the **legacy RF detector** and the **stub executor**.

| Scenario | Completion | Events | Contiguous sequence | Duration |
| --- | --- | --- | --- | --- |
| Low | Completed | 126 | Yes | 23.64 s |
| Medium | Completed | 131 | Yes | 20.23 s |
| High | Completed | 145 | Yes | 27.69 s |

All three runs produced investigator source `llm+rules`, explanation source `llm`, and response source `llm_recommendation`. They progressed through capture, detection, similarity classification, risk assessment, full investigation, response preparation, policy checking, execution, outcome validation and finalization.

The threat worker reported its missing feed/address evidence as an advisory gap. No unresolved action intents remained. Outcomes correctly remained `UNVALIDATED`; no successful live precedent was learned. Seven seed cases were imported into isolated test storage. Validation-owned API and worker processes were stopped afterward.

API health LLM counters are process-local: the API reported zero calls because the dedicated worker made the reasoning requests. Persisted artifacts establish the live reasoning used.

### Local multiclass inference checks

The new bundle was tested independently on the first 256 rows from each of two local test captures:

| Capture label | Predictions | Mean attack probability | Batch inference time |
| --- | --- | --- | --- |
| Benign | 256 Benign | 0.067145 | 446.73 ms |
| DoS-TCP | 254 DDoS-TCP, two DoS-TCP | 0.999988 | 309.40 ms |

Probability outputs were finite, normalized and correctly shaped. The TCP sample supports binary attack detection but shows substantial DoS/DDoS variant confusion. Contiguous capture prefixes are not representative evaluation samples and cannot establish full model accuracy. Timings are local batch observations, not complete pipeline or deployment guarantees.

Scikit-learn emitted feature-name warnings in the notebook's array-based calibration path; loading and probability checks succeeded.

Detailed evidence is in [live-validation/README.md](live-validation/README.md) and [live-validation/report.json](live-validation/report.json). The explicit repeatable harness is `backend/tests/live_validation.py`; it contacts real providers and consumes API usage.

## 11. Remaining implementation and acceptance work

### Multiclass runtime integration

1. Implement a multiclass adapter using the bundle's preprocessing and class order.
2. Replace hardcoded binary probability extraction and `TCP_Flood` event construction with hierarchy-aware outputs.
3. Propagate model identity, feature schema identity and confidence semantics.
4. Keep chosen variant confidence separate from aggregate attack probability and window-level averages.
5. Validate required input features and reject unusable inputs rather than silently imputing an entirely missing feature set.
6. Extend investigator evidence and response coverage beyond existing TCP-oriented scenarios.
7. Keep source cardinality tied to actual address evidence; a DoS/DDoS prediction is not proof of the number of sources.
8. Use clinical context and policy to determine severity rather than relying only on model confidence.
9. Include the selected multiclass artifact and matching metadata in active reproducibility manifests.
10. Test adapter failures, deliberate model selection/fallback behavior and local latency before activating the new model.

### Detector evaluation

Evaluate all classes over broader held-out captures; investigate DoS/DDoS confusion; validate calibration, false alarms and class-level recall. Preserve the distinction between exported training results and reproduced evaluation results.

### Physical lab and deployment

Deploy the gateway on the isolated Linux forwarding path and independently measure malicious traffic plus legitimate delivery/latency. Confirm enforcement, rule expiry, restart cleanup, rollback and receipt reconciliation. Build and deploy containers, confirm capacity and worker monitoring, and exercise database backup/restore.

Enable verified reuse only after detector and independently measured outcome acceptance satisfy the implemented gates.

## 12. Final status

**Implemented and organized:** Agent architecture, typed coordination, durable API/worker execution, concurrent specialist supervision, fallbacks, reuse checks, policy/execution interfaces, authentication, operational UI and evaluation tooling.

**Verified after organization:** 75 passing backend tests; successful Groq/Gemini credential checks; three completed live-LLM pipeline runs with contiguous persisted events; successful independent loading and inference of the trained multiclass bundle.

**Still pending:** Multiclass detector activation in the runtime, broader model evaluation, physical lab enforcement/outcome acceptance and container deployment verification.

The next implementation milestone is integrating the trained detector into the existing typed pipeline while preserving the tested synchronization and safety boundaries.
