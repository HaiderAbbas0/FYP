# Controller agent

Coordinates detection, retrieval, investigation, explanation, response and outcomes.

## Contract

- Input: Run request, runtime services and incident evidence.
- Output: Pipeline events and terminal run result.
- Implementation: `agent.py`.
- Shared message schemas: `backend/app/schemas.py`.

## Failure handling and runtime

Owns routing, synchronization and fallback selection. Worker leases and durability live in shared backend infrastructure.

The API and worker invoke this package; it is not a separately deployed service. See `../README.md` for setup and the runtime runbook for deadlines and worker configuration.
