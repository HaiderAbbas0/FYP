# Agent pipeline runtime and deployment

## Start without a dataset or detector

From the repository's `backend` directory in PowerShell:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pip install --no-deps -e ..
$env:IDS_AUTH_DEV_LOCALHOST = 'true'
$env:IDS_SESSION_SECRET = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8099
```

This explicitly enables local development access. Bind it to loopback. Existing LLM keys are optional; request `faults.llmDown=true` for a reproducible offline run. Use the backend `fixture` input, which builds seeded synthetic detector evidence and runs the actual pipeline. It needs neither capture files nor model artifacts. Its actuator and outcome remain simulated and unvalidated.

From the repository root run `npm run dev`; the configured Vite port is 8443. The operational dashboard shows database runs, cases, experiments and service readiness. The Agent Simulation page's **Backend** mode executes the server pipeline; **Illustration** and **Design preview** show sample UI behavior. `capture_replay` requires the detector owner's artifacts.

## Authentication

Set `IDS_API_KEYS_JSON` to an object mapping key IDs to `{sha256, role}`. Hash a cryptographically random raw key with SHA256 locally; distribute the raw key separately. Supported roles are viewer (read), operator (start/cancel runs), and admin (memory resets, evaluation, audit and reconciliation). `IDS_SESSION_SECRET` must contain at least 32 characters and be shared by all API processes. Set development access false for shared deployment.

Clients can send `Authorization: Bearer <key>` or `X-API-Key`. The browser's operational dashboard exchanges the key at `POST /api/auth/session` for a signed HttpOnly cookie; the form clears the raw key. Sessions expire after 900 seconds by default, maximum 3600. Logout revocation is stored in the shared database. Key removal or role changes take effect during subsequent authentication. Configure trusted browser origins explicitly. HTTPS is required for shared access; cookies use Secure on HTTPS and SameSite Strict. Use the same hostname for UI and API, or a same-origin reverse proxy.

## Commands, streams and recovery

```json
{
  "scenario": "medium",
  "source_mode": "fixture",
  "fixture_seed": 42,
  "faults": {"llmDown": true},
  "speed": 20
}
```

Send this object to `POST /api/runs` with an optional `Idempotency-Key`. The server returns 202 with a durable run ID. Repeating the same key and request returns the same run; changing the request returns 409. Queue capacity is bounded, default 100.

- `GET /api/runs`: latest run statuses and input provenance.
- `GET /api/runs/{id}`: request, frozen manifest, action/rollback receipts and outcome observation.
- `GET /api/runs/{id}/events`: SSE ordered by database sequence; reconnect with `Last-Event-ID`.
- `GET /api/runs/{id}/journal?after=0&limit=5000`: paginated journal and next cursor.
- `POST /api/runs/{id}/cancel`: durable cancellation, including jobs executed by a separate worker.
- `POST /api/runs/{id}/reconcile`: admin inspection of existing live gateway receipts; resolves confirmed rollback without resuming the run or repeating its action.
- `GET /api/health`: service status, public provider counters, queue and unresolved actions.
- `GET /api/ready`: 503 unless persistence and authentication are available. This checks API prerequisites; dedicated worker and physical gateway availability must be monitored separately.
- `GET /api/audit`: admin operation audit records.

Browser stream disconnection does not cancel execution. Queued jobs survive restart. Workers claim jobs transactionally, renew a 30-second lease, and check cancellation throughout execution. Lease loss or an expired lease interrupts a job and makes pending effects unknown. It never replays a containment command. The run deadline requests cancellation at 180 seconds by default, allowing ten seconds for compensation before interruption. Confirmed containment cancellation attempts rollback; an ambiguous effect or rollback is held for reconciliation.

The stub is process-local and runs serialize within each worker. Independent specialists use disposable processes, default five concurrent and eight seconds each including startup and queue wait. Timed-out processes are terminated and joined. Process CPU and peak resident memory are measured; in-process test execution leaves these metrics unavailable.

## Shared PostgreSQL and dedicated workers

`DATABASE_URL=postgresql://user:password@host:5432/database` selects PostgreSQL; SQLite remains the default local adapter. Migrations run transactionally on startup. PostgreSQL uses row locking with SKIP LOCKED for queue claims and target advisory locks. The database owns ordered events, cases, outbox, audit and experiment manifests. Back up the database with normal PostgreSQL tools and keep credentials in deployment secrets. Do not copy the JSON seed over learned database cases.

Set `IDS_EMBEDDED_WORKER=false` on the API and run `python worker.py` separately using the same database and runtime configuration. Additional worker instances claim independent jobs. Live target ownership is exclusive across processes. An active or unresolved prior action blocks another action even if its originating run has finished. Known controls expire in the gateway and can be reconciled; unknown effects require receipt inspection.

Root `compose.yaml` defines PostgreSQL 16, API and dedicated worker. Set `IDS_DB_PASSWORD`, hashed `IDS_API_KEYS_JSON` and shared `IDS_SESSION_SECRET` before `docker compose up --build`. It publishes the API on loopback only. The default container image intentionally includes fixtures and seed cases; mount the final capture/model artifacts separately when activating capture replay. This Compose deployment does not activate a lab firewall. Container build/start must be checked on the deployment host.

## Live lab activation

The Linux gateway and its network scope are documented in `backend/gateway/README.md`. The gateway implements real bounded nftables actions, persistent receipts, automatic expiration, restart cleanup and independent counter reads. Run it only on the isolated forwarding gateway with one service worker. Configure the same token, target IDs and sensor ID in the pipeline. Match registered device IP/class/criticality with `backend/app/incidents.py`; update the trusted registry for the physical lab before enabling it.

`source_mode=live_lab` requires an authenticated detector incident envelope and numeric `window_stats`. The device attribution must match the trusted registry. Synthetic inputs, experimental profiles and injected faults cannot actuate the lab. Missing required statistics or sensor samples fail closed.

The independent sensor must provide cumulative malicious-packet and legitimate request/success counters, sample timestamps and latency. The runtime requires at least three fresh baseline samples over five seconds, then a sustained post-action window. Counter resets, incorrect provenance, missing observations or absent suppression measurements yield UNVALIDATED. The runtime implements sensor consumption; installing and calibrating the independent physical instrumentation is a lab responsibility.

Verified reuse is disabled by default. Enable it only after calibration and lab acceptance. Reuse requires calibrated same-version detector confidence, matching device class/criticality and attack context, current policy/outcome versions, sufficient similarity/reliability, and at least three independent matching live SUCCESS observations. Fixture seeds never become measured precedent. Adverse measurements veto the matching aggregate. The deterministic policy and executor still authorize every reused action.

## Verification and evaluation

```powershell
# From backend
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
$env:IDS_TEST_POSTGRES_URL = 'postgresql://user:password@localhost:5432/test_database'
.\.venv\Scripts\python.exe -m unittest discover -s tests -p test_postgres.py -v
# From repository root
npx tsc --noEmit
npm run build
```

PostgreSQL tests create and drop disposable schemas in the named test database. Gateway tests mock nft invocation; they never change this Windows computer's firewall. See `EVALUATION_GUIDE.md` for the paired CLI and exported reports. Freeze memory, configuration, code and model identity; report unavailable research measurements explicitly. Passing software checks does not establish detector accuracy, live suppression, clinical safety, load capacity or production readiness.
