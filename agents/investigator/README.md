# Investigator agent

Fuses detector, prior-case and specialist evidence into an investigation.

## Contract

- Input: DetectorEvent, SpecialistResult list and optional RetrievedCase.
- Output: InvestigationResult.
- Implementation: `agent.py`.
- Shared message schemas: `backend/app/schemas.py`.

## Failure handling and runtime

Validated LLM output or deterministic rules. Unavailable specialist evidence is recorded as a gap.

The API and worker invoke this package; it is not a separately deployed service. See `../README.md` for setup and the runtime runbook for deadlines and worker configuration.

## Specialists

`specialists/agent.py` contains the registry, bounded dispatch and log, traffic, device, history and threat workers. These workers supply evidence to the investigator.
