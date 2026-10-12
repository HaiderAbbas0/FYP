# Runtime notes — this machine

## Layout

- API: FastAPI in `backend/app/main.py`, port **8099**
- UI: Vite, port **8443**
- Legacy detector: `agents/detector/artifacts/legacy/`
- Staged multiclass bundle: `agents/detector/artifacts/multiclass/detector_bundle.joblib`

## Backend bring-up (Windows PowerShell)

Use the Windows CPython install, not MSYS `python` (that created a Unix-style `.venv` without `Scripts\python.exe`).

```powershell
& "C:\Users\ayesh\AppData\Local\Programs\Python\Python312\python.exe" -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pip install --no-deps -e ..
.\.venv\Scripts\python.exe -m pip install -r requirements-detector.txt
$env:IDS_AUTH_DEV_LOCALHOST = 'true'
$env:IDS_SESSION_SECRET = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8099
```

`requirements-detector.txt` is optional for the legacy API. It is required to load the LightGBM bundle.

## Checks

- `GET http://127.0.0.1:8099/api/health` — service
- `GET http://127.0.0.1:8099/api/detector/info` — **legacy** model card (must stay RF / TCP_Flood)
- `GET http://127.0.0.1:8099/api/detector/multiclass/info` — staged bundle card (`active_in_runtime: false`), plus `declared_classes` (13), `verified_class_count` (3) and a `verification` block

## Regenerating the evidence

```powershell
# Detector-level evaluation (181,671 rows over the 6 locally available classes)
.\.venv\Scripts\python.exe evaluate_multiclass.py

# Whole-pipeline evaluation (140 checks over all 5 scenarios)
$env:IDS_DETECTOR = 'multiclass'
.\.venv\Scripts\python.exe pipeline_evaluation.py   # non-zero exit on any failure
```

Both write to `docs/ayesha/evidence/`.

## Before trusting a failed run: check for a stale server

A `uvicorn` process started earlier keeps the code it loaded, so a schema change
made after it started is invisible to it. This produced a misleading
`Input should be 'low', 'medium' or 'high'` validation error that looked like a
code fault but was a 14:42 server still holding port 8099.

```powershell
Get-NetTCPConnection -LocalPort 8099 -State Listen
```

Stop that process and restart the server before investigating any runtime error
that contradicts the source you are reading.

## Recorded on this machine (12 Oct 2026)

- Interpreter: Python 3.12.3 (`C:\Users\ayesh\AppData\Local\Programs\Python\Python312\python.exe`)
- `python -m unittest discover -s tests`: **191 run, 4 skipped** (Postgres not configured), **0 failures**
- Suite growth under this owner: 92 at project start → 191 now.
  - `test_multiclass_detector.py` (13) — adapter, HTTP, opt-in activation
  - `test_attack_aware_response.py` (25) — shape routing and RULE-08 safety
  - `test_specialist_evidence.py` (24) — evidence narrative and severity
  - `test_variant_identity.py` (16) — variant in case identity
  - `test_detector_verification_api.py` (21) — declared vs verified classes
  - `test_pipeline_evaluation.py` (13) — harness plus two negative controls
- Pipeline evaluation: **140/140 checks passed**, exit 0, under `IDS_DETECTOR=multiclass`.
- Policy version is now `policy-v2` (RULE-08 added). Manifests record it correctly.
- Opt-in: `$env:IDS_DETECTOR = 'multiclass'` before uvicorn. Omit it (or `legacy`)
  for the original RF path.
- Live API on `http://127.0.0.1:8099` (`IDS_AUTH_DEV_LOCALHOST=true`):
  - `/api/health` → `status: ok`, sqlite, stub executor, `detector: multiclass`
  - `/api/detector/info` → RandomForestClassifier, 45 features, Benign vs TCP_Flood (unchanged)
  - `/api/detector/multiclass/info` → LightGBM, 13 declared classes, 39 features,
    `active_in_runtime: false`, 3 verified / 7 unevaluated / 3 not separable
  - `/api/detector/multiclass/sample?capture=benign&rows=32` → Benign, mean P(Attack) 0.0671
  - `/api/detector/multiclass/sample?capture=dos-tcp&rows=32` → majority `DDoS-TCP` (variant
    confusion is expected; mean P(Attack) 1.0, variant confidence 0.8441, kept separate)
- End-to-end capture replay, all five scenarios reach `completed` with the action
  matching the attack shape:
  - `low` / `medium` / `high` → `DoS-TCP` → `upstream_rate_limit(300s)`
  - `mqtt-dos-connect` → `MQTT-DoS-Connect` → `connection_cap(180s)`
  - `mqtt-ddos-publish` → `MQTT-DoS-Publish` → `upstream_prefix_ratelimit(180s)`
