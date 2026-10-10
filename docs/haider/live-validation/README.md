# Agent and detector validation

## Results

- Regression suite after package migration: 75 passed, four skipped, no failures. PostgreSQL tests require a separately configured test database.
- One credential per configured provider was checked with a real JSON request: Groq `openai/gpt-oss-120b` and Gemini `gemini-3.6-flash` both succeeded. The remaining keys in each pool were not individually checked.
- Three real capture-replay runs completed through separate authenticated API and worker processes, using spawned specialist workers and live LLM calls.
- Investigator returned `llm+rules`, explainer returned `llm`, and response returned `llm_recommendation` in every run.
- Persisted event sequences were contiguous. All three runs reached FINALIZED without unresolved action intents.
- Low, medium and high runs took approximately 23.64, 20.23 and 27.69 seconds respectively. These are local observations, not latency guarantees.
- The threat worker correctly reported unavailable feed/address evidence as an advisory gap.

The API health endpoint's LLM counters are process-local. Zero API-process calls do not mean zero worker calls; the persisted reasoning artifacts identify the live reasoning used in these tests.

## Trained multiclass detector

Installed LightGBM 4.6.0 and loaded the supplied bundle successfully. It contains 13 classes, 39 model features, fitted preprocessing, sigmoid calibration, hierarchy mappings and model version `643ad137db`.

Calibrated local inference was checked on the first 256 rows from each of two available test captures:

| Capture label | Predicted labels | Mean attack probability | Batch inference time |
| --- | --- | --- | --- |
| Benign | 256 Benign | 0.067145 | 446.73 ms |
| DoS-TCP | 254 DDoS-TCP, 2 DoS-TCP | 0.999988 | 309.40 ms |

All probability outputs were finite and normalized. The TCP sample supports binary attack detection, but shows substantial DoS/DDoS variant confusion. These contiguous capture prefixes are not representative dataset samples and cannot establish full model accuracy. Broader capture evaluation is required. The bundle's stored full-test variant macro F1 is approximately 0.74476; those stored training results were not independently reproduced here.

Scikit-learn emitted feature-name warnings for the notebook's array-based calibration path. This matches the saved notebook behavior; model loading and probability checks succeeded. The runtime currently still uses the legacy binary adapter. The multiclass bundle was tested independently and is not yet wired into event construction, specialist coverage or response routing.

## Scope

Runtime actions used the stub executor; all outcomes correctly remained UNVALIDATED. Seven seed cases were imported into an isolated temporary database. No successful reusable precedent was learned. No real firewall commands or physical medical-device actions were issued. No model training, complete dataset evaluation, Docker build or PostgreSQL validation was performed in this run.

API credentials were loaded from local configuration without printing or saving them. The saved report contains only public provider metadata and test results. Validation-owned API and worker processes were stopped after the run.

## Repeat

From `backend/`, using its configured virtual environment:

```powershell
.\.venv\Scripts\python.exe -m pip install --no-deps -e ..
.\.venv\Scripts\python.exe -m pip install -r requirements-detector.txt
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"
.\.venv\Scripts\python.exe tests/live_validation.py
```

The last command deliberately contacts configured external LLM providers and consumes their API usage. It validates live reasoning rather than accepting a deterministic fallback as success. The detector remains unchanged by these tests.
