# Memory agent

Retrieves similar cases, validates reuse and records incident outcomes.

## Contract

- Input: DetectorEvent, case records and outcomes.
- Output: RetrievedCase and similarity/reuse information.
- Implementation: `agent.py`.
- Shared message schemas: `backend/app/schemas.py`.

## Failure handling and runtime

Deterministic retrieval. Reuse requires configured eligibility; shared persistence lives in app.run_store.

The API and worker invoke this package; it is not a separately deployed service. See `../README.md` for setup and the runtime runbook for deadlines and worker configuration.
