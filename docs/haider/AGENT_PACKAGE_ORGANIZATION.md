# Agent package organization

## Implementation ownership

Agent implementations live in the repository-level `agents` Python package:

| Package | Entry point | Supporting files |
| --- | --- | --- |
| Detector | `agents/detector/agent.py` | Versioned artifacts and offline training notebook |
| Memory | `agents/memory/agent.py` | Retrieval, eligibility and cache implementation |
| Investigator | `agents/investigator/agent.py` | `prompts.py`, specialist worker package |
| Explainer | `agents/explainer/agent.py` | `prompts.py` |
| Response | `agents/response/agent.py` | `prompts.py`, deterministic response table |
| Controller | `agents/controller/agent.py` | Routing, deadlines and pipeline coordination |

Every agent has a README describing responsibility, contracts and failure handling. This change organizes code ownership; deployment still uses the shared API and worker services.

## Shared services

`backend/app` retains schemas, configuration, API/authentication, LLM transport, persistence, process workers, deterministic policy, action execution, telemetry and gateway integration. Agent-specific state uses shared persistence, rather than independent JSON files per agent.

The former `app.detector`, `app.memory`, `app.planner` and `app.specialists` modules alias their new implementation modules, preserving existing callers and module-level patch locations. `app.agents` re-exports the three separated reasoning functions. These files are compatibility entry points, not duplicate implementations.

## Detector assets

- `agents/detector/artifacts/legacy/`: active binary RF model, scaler, feature schema and model metadata.
- `agents/detector/artifacts/multiclass/`: staged LightGBM bundle, best-model pointer and experiment log.
- `agents/detector/training/multiclass_detector.ipynb`: offline training workflow.
- `data/detector/`: attack training and test capture CSVs.
- `data/Benign_test.pcap.csv`: existing benign replay capture.

The active detector and reproducibility manifest use the new legacy artifact path. Code identity now includes all agent Python files. The multiclass bundle still requires dependency setup, a multiclass inference adapter, event label propagation and runtime validation before activation.

## Installation and deployment

From `backend/`, run `python -m pip install --no-deps -e ..` using the backend virtual environment after installing its requirements. The editable repository package exposes both `agents` and `app`, including to spawned workers. The package has been installed in the current local backend environment.

Docker copies the agent sources and installs the repository package in editable mode. Training notebooks, model artifacts and datasets are excluded from the image; capture mode requires mounting the artifact and capture directories at their documented repository paths.

## Validation status

After reorganization, 75 regression tests passed and four PostgreSQL integration tests were skipped. Three separate API/worker capture-replay runs completed with real LLM reasoning and contiguous persisted events. See `live-validation/README.md` and `live-validation/report.json` for evidence and limitations. Docker builds and physical gateway enforcement were not tested.
