# Agent packages

Each directory owns one agent's implementation and documentation. Investigator specialist workers live under `investigator/specialists/`. Shared formatting lives in `common.py`.

## Setup

From `backend/`, install dependencies and the repository package:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pip install --no-deps -e ..
.\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8099
```

The editable install makes both `agents` and `app` importable from API and worker processes, including spawned specialist processes. Install once in each environment; no PYTHONPATH edits are needed. Docker installs the package automatically.

## Ownership

| Package | Responsibility |
| --- | --- |
| detector | Feature-window inference and model assets |
| memory | Retrieval, similarity and reuse eligibility |
| investigator | Evidence fusion and specialist workers |
| explainer | Incident explanation |
| response | Action recommendation and deterministic fallback |
| controller | Pipeline coordination and routing |

Shared schemas, configuration, LLM transport, API, authentication, persistence, worker execution, policy, gateway integration and telemetry remain in `backend/app/`. Agent state is persisted through shared storage; do not create separate state files per agent. Large captures remain under `data/`.

The previous `app.detector`, `app.memory`, `app.planner`, `app.specialists` and `app.agents` imports remain compatibility entry points. New agent code lives here; do not maintain duplicate implementations in those backend files.

Existing regression tests remain in `backend/tests/`; run commands and deployment details are in `docs/haider/RUNTIME_RUNBOOK.md`. The multiclass detector assets are staged, not activated by this directory reorganization.
