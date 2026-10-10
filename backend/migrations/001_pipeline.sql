CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS revoked_sessions (token_hash TEXT PRIMARY KEY, expires_epoch DOUBLE PRECISION NOT NULL);
CREATE TABLE IF NOT EXISTS runs (
 run_id TEXT PRIMARY KEY, status TEXT NOT NULL, request_json TEXT NOT NULL,
 current_state TEXT, cancel_requested INTEGER NOT NULL DEFAULT 0, idempotency_key TEXT UNIQUE,
 worker_id TEXT, lease_until DOUBLE PRECISION, started_epoch DOUBLE PRECISION, enqueued_epoch DOUBLE PRECISION,
 requested_by TEXT NOT NULL DEFAULT 'local', manifest_json TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, error TEXT
);
CREATE TABLE IF NOT EXISTS run_events (
 run_id TEXT NOT NULL REFERENCES runs(run_id), sequence INTEGER NOT NULL, event_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (run_id,sequence)
);
CREATE TABLE IF NOT EXISTS action_intents (
 run_id TEXT NOT NULL REFERENCES runs(run_id), idempotency_key TEXT NOT NULL, target_id TEXT NOT NULL,
 action TEXT NOT NULL, status TEXT NOT NULL, receipt_json TEXT, rollback_status TEXT, rollback_json TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (run_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS target_locks (
 target_id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(run_id), worker_id TEXT NOT NULL,
 claimed_epoch DOUBLE PRECISION NOT NULL
);
CREATE TABLE IF NOT EXISTS outcome_observations (
 run_id TEXT PRIMARY KEY REFERENCES runs(run_id), outcome TEXT NOT NULL, observation_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cases (case_id TEXT PRIMARY KEY, case_json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS case_outbox (case_id TEXT PRIMARY KEY, case_json TEXT NOT NULL, reused_case_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_events (
 audit_id TEXT PRIMARY KEY, actor TEXT NOT NULL, operation TEXT NOT NULL, resource TEXT NOT NULL,
 detail_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS experiments (experiment_id TEXT PRIMARY KEY, manifest_json TEXT NOT NULL, report_json TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_runs_queue ON runs(status,created_at);
CREATE INDEX IF NOT EXISTS idx_runs_lease ON runs(status,lease_until);
