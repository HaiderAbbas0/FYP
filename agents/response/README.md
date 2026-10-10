# Response agent

Recommends one bounded action for policy evaluation.

## Contract

- Input: Detector event, investigation, explanation and prior case.
- Output: ResponseRecommendation.
- Implementation: `agent.py`.
- Shared message schemas: `backend/app/schemas.py`.

## Failure handling and runtime

Validated LLM recommendation or deterministic action table. app.policy and app.executor authorize and execute actions.

The API and worker invoke this package; it is not a separately deployed service. See `../README.md` for setup and the runtime runbook for deadlines and worker configuration.
