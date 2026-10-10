# Explainer agent

Creates the incident explanation and audit narrative.

## Contract

- Input: Detector event, investigation and prior case.
- Output: Explanation.
- Implementation: `agent.py`.
- Shared message schemas: `backend/app/schemas.py`.

## Failure handling and runtime

Validated LLM output or deterministic explanation; follows the shared LLM budget.

The API and worker invoke this package; it is not a separately deployed service. See `../README.md` for setup and the runtime runbook for deadlines and worker configuration.
