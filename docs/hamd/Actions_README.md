# CI/CD Tool Manual — MediSOC

> **Handbook reference:** Table 1a, Maintenance Phase — "configuration/setup and tool manual"

---

## Overview

This repository uses **GitHub Actions** for continuous integration. Every push and pull request proves that the backend, frontend and Docker images build and pass their tests from a clean checkout — no secrets, no API keys, no lab hardware.

---

## Workflow Summary

| Workflow | File | Trigger | Jobs | Handbook evidence |
|----------|------|---------|------|-------------------|
| **Backend CI** | `backend-ci.yml` | Push/PR on `backend/**`, `agents/**`, `pyproject.toml` | `lint` (Ruff), `unit-tests` (3.12+3.13), `postgres-tests` | Table 1a Development Phase; AC-1 |
| **Frontend CI** | `frontend-ci.yml` | Push/PR on `src/**`, `package.json`, etc. | `typecheck`, `build`, `format-check` | Table 1a Development Phase; AC-2 |
| **System Smoke** | `system-smoke.yml` | Push/PR to `main`, manual | `smoke` (45 paired runs) | Table 1a Maintenance Phase; Forms 2 #7, 3 #8 |
| **Docker Build** | `docker-build.yml` | Push/PR on `backend/**`, `compose.yaml`, etc. | `build` (API + gateway images, compose validation) | Form 4 "buildable" |
| **Release** | `release.yml` | Tag push `v*` | `backend-tests`, `frontend-build`, `release` | Form 2 #6 (tagged code); Appendix C |
| **Dependabot** | `dependabot.yml` | Weekly | pip, npm, github-actions PRs | — |

### Blocking vs. report-only

| Check | Status | Notes |
|-------|--------|-------|
| Ruff `E9,F63,F7,F82` | **Blocking** | Syntax errors and undefined names |
| Ruff full default | Report only | ~142 findings to clean up |
| `tsc --noEmit` | **Blocking** | |
| `npm run build` | **Blocking** | |
| `oxfmt --check src` | Report only | ~31 files to reformat |
| Unit tests | **Blocking** | |
| PostgreSQL tests | **Blocking** | Fails if tests are skipped |
| System smoke | **Blocking** | |
| Docker build | **Blocking** | Build only, never pushed |

---

## How to Reproduce Locally

### Backend unit tests

```bash
# From repo root
python -m pip install -r backend/requirements.txt
pip install --no-deps -e .
cd backend
python -m unittest discover -s tests -v
# Expected: 79+ run, 75+ passed, 4 skipped (PostgreSQL), 0 failures
```

### PostgreSQL integration tests (with Docker)

```bash
# Start a PostgreSQL 16 container
docker run -d --name iomt-test-pg \
  -e POSTGRES_USER=iomt \
  -e POSTGRES_PASSWORD=iomt \
  -e POSTGRES_DB=iomt_test \
  -p 5432:5432 \
  postgres:16

# Wait for readiness
until docker exec iomt-test-pg pg_isready -U iomt -d iomt_test; do sleep 1; done

# Run the tests
export IDS_TEST_POSTGRES_URL=postgresql://iomt:iomt@localhost:5432/iomt_test
cd backend
python -m unittest tests.test_postgres -v
# Expected: 4 of 4 pass

# Cleanup
docker rm -f iomt-test-pg
```

### Static analysis (Ruff)

```bash
pip install ruff

# Blocking subset (must pass)
ruff check --isolated --select E9,F63,F7,F82 backend agents

# Full lint (report only)
ruff check --isolated backend agents
```

### Frontend

```bash
npm ci
npx tsc --noEmit         # must pass
npm run build             # must pass
npx oxfmt --check src    # report only (~31 files)
```

### System smoke test

```bash
cd backend
python tests/runtime_smoke.py
# Takes a few minutes. Starts API + worker, runs 45 paired evaluations.
# Output: docs/haider/evaluation-smoke/{report.json, runs.csv, manifest.json}
```

### Docker images (build only)

```bash
docker build -f backend/Dockerfile -t medisoc-api:ci .
docker build -f backend/gateway/Dockerfile -t medisoc-gateway:ci .

# Validate compose file
IDS_DB_PASSWORD=ci IDS_API_KEYS_JSON='{}' IDS_SESSION_SECRET=ci \
  docker compose -f compose.yaml config -q
```

---

## Cutting a Milestone Tag

The release workflow runs automatically when a `v*` tag is pushed. Tags containing `mid` or `rc` are marked as prereleases.

```bash
# FYP-1 Mid milestone
git tag -a v0.1-mid1 -m "FYP-1 Mid"
git push origin v0.1-mid1
```

The release will include:
- Unit test logs
- `pip freeze` output (dependency register, Appendix C)
- `npm ls --depth=0` output
- Commit timeline (`git log`)
- Zipped `dist/` (frontend build)

---

## What CI Deliberately Does NOT Run

| Excluded item | Reason |
|---------------|--------|
| `backend/tests/live_validation.py` | Needs real LLM API keys (Groq, Gemini), the 39 MB detector bundle, LightGBM and the dataset CSVs |
| Lab gateway / nftables / `backend/gateway/compose.yaml` | Needs `NET_ADMIN` capability and host networking; would alter firewall rules |
| Detector training notebook | Needs the full CICIoMT2024 dataset (~130 MB) and hours of runtime |
| Real LLM providers | `LLM_PROVIDER_CHAIN` is set to `""` in all backend jobs; deterministic fallbacks are always used |
| `.figma/make/*` scripts | Figma Make platform tooling; only `site.json` is needed at build time |
| Docker image push | Images are built for verification only; never pushed to any registry |
| Commit from CI | Generated files (e.g., smoke report) go to `actions/upload-artifact`, never committed back |

---

## Environment Variables

No GitHub Secrets are required. The backend tests and smoke harness set all needed environment variables internally. `LLM_PROVIDER_CHAIN: ""` is set at job level in every backend workflow as a safety measure.

For a full list of application environment variables, see `backend/app/config.py` and `backend/.env.example`.
