# Detector agent

Scores traffic feature windows with the legacy binary detector.

## Contract

- Input: Feature rows and replay profile.
- Output: WindowResult consumed by incident construction.
- Implementation: `agent.py`.
- Shared message schemas: `backend/app/schemas.py`.

## Failure handling and runtime

No LLM. Invalid or unavailable model assets raise an error; no fabricated inference.

The API and worker invoke this package; it is not a separately deployed service. See `../README.md` for setup and the runtime runbook for deadlines and worker configuration.

## Assets

- `artifacts/legacy/`: active RF model, scaler, matching schema and metadata.
- `artifacts/multiclass/`: staged LightGBM bundle and experiment records; not yet active.
- `training/`: offline notebook; never run during service startup.
- Capture CSVs: repository `data/detector/`; benign capture: `data/Benign_test.pcap.csv`.

Multiclass integration still needs LightGBM dependencies, adapter, label propagation and validation. The old metadata must not be used for the new bundle.
