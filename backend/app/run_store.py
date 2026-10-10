"""Transactional PostgreSQL/SQLite repository, durable queue and audit journal.

Claimed executions use leases. An expired execution is interrupted, never
automatically retried; queued jobs safely survive a service restart.
"""
from __future__ import annotations

import json
import os
import sqlite3
import time
import uuid
import math
from datetime import datetime, timezone
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from .config import settings

TERMINAL = frozenset({'completed', 'failed', 'cancelled', 'safe_hold', 'escalated', 'interrupted'})


def encode(value: Any) -> str:
    return json.dumps(value, separators=(',', ':'), sort_keys=True, default=str, allow_nan=False)


class Connection:
    def __init__(self, db, postgres: bool) -> None:
        self.db, self.postgres = db, postgres

    def execute(self, sql: str, params=()):
        return self.db.execute(sql.replace('?', '%s') if self.postgres else sql, params)


class RunStore:
    def __init__(self, path: Path | None = None, database_url: str | None = None) -> None:
        self.database_url = database_url if database_url is not None else (os.getenv('DATABASE_URL', '') if path is None else '')
        self.postgres = self.database_url.startswith(('postgresql://', 'postgres://'))
        if self.database_url and not self.postgres:
            raise ValueError('DATABASE_URL must be a PostgreSQL URL; use IDS_SQLITE_PATH for local storage')
        self.path = path or Path(os.getenv('IDS_SQLITE_PATH', str(settings.cases_path.parent / 'runs.sqlite3')))
        if not self.postgres:
            self.path.parent.mkdir(parents=True, exist_ok=True)
        self.migrate()

    @contextmanager
    def _connect(self, write: bool = False) -> Iterator[Connection]:
        if self.postgres:
            import psycopg
            from psycopg.rows import dict_row
            raw = psycopg.connect(self.database_url, row_factory=dict_row, connect_timeout=5)
        else:
            raw = sqlite3.connect(self.path, timeout=10)
            raw.row_factory = sqlite3.Row
            raw.execute('PRAGMA foreign_keys=ON')
            raw.execute('PRAGMA busy_timeout=10000')
            if write:
                raw.execute('BEGIN IMMEDIATE')
        try:
            yield Connection(raw, self.postgres)
            raw.commit()
        except BaseException:
            raw.rollback()
            raise
        finally:
            raw.close()

    def migrate(self) -> None:
        sql = (Path(__file__).parent.parent / 'migrations' / '001_pipeline.sql').read_text(encoding='utf-8')
        if self.postgres:
            sql = sql.replace('DEFAULT CURRENT_TIMESTAMP', 'DEFAULT (CURRENT_TIMESTAMP::text)')
        with self._connect(write=True) as db:
            if self.postgres:
                db.execute('SELECT pg_advisory_xact_lock(7243186)')
            for statement in sql.split(';'):
                if statement.strip():
                    # Existing databases may not have lease columns yet.
                    if 'CREATE INDEX' not in statement:
                        db.execute(statement)
            additions = {
                'runs': {'idempotency_key': 'TEXT', 'current_state': 'TEXT',
                         'cancel_requested': 'INTEGER NOT NULL DEFAULT 0', 'worker_id': 'TEXT',
                         'lease_until': 'DOUBLE PRECISION', 'started_epoch': 'DOUBLE PRECISION',
                         'enqueued_epoch': 'DOUBLE PRECISION',
                         'requested_by': "TEXT NOT NULL DEFAULT 'local'", 'manifest_json': 'TEXT'},
                'action_intents': {'rollback_status': 'TEXT', 'rollback_json': 'TEXT'},
            }
            for table, columns in additions.items():
                if self.postgres:
                    for name, kind in columns.items():
                        db.execute(f'ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {name} {kind}')
                else:
                    present = {r['name'] for r in db.execute(f'PRAGMA table_info({table})').fetchall()}
                    for name, kind in columns.items():
                        if name not in present:
                            db.execute(f'ALTER TABLE {table} ADD COLUMN {name} {kind}')
            db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_runs_idempotency ON runs(idempotency_key)')
            db.execute('CREATE INDEX IF NOT EXISTS idx_runs_queue ON runs(status,created_at)')
            db.execute('CREATE INDEX IF NOT EXISTS idx_runs_lease ON runs(status,lease_until)')
            db.execute('INSERT INTO schema_migrations(version) VALUES(1) ON CONFLICT(version) DO NOTHING')

    def _lock_run(self, db: Connection, run_id: str):
        suffix = ' FOR UPDATE' if self.postgres else ''
        return db.execute('SELECT * FROM runs WHERE run_id=?' + suffix, (run_id,)).fetchone()

    def _append(self, db: Connection, run_id: str, event: dict[str, Any]) -> int:
        row = db.execute('SELECT COALESCE(MAX(sequence),0)+1 AS n FROM run_events WHERE run_id=?', (run_id,)).fetchone()
        sequence = int(row['n'])
        db.execute('INSERT INTO run_events(run_id,sequence,event_json) VALUES(?,?,?)', (run_id, sequence, encode(event)))
        kind = event.get('type')
        if kind == 'state':
            db.execute('UPDATE runs SET current_state=?,updated_at=CURRENT_TIMESTAMP WHERE run_id=?', (event['state'], run_id))
        elif kind == 'run.end':
            row = db.execute('SELECT current_state FROM runs WHERE run_id=?', (run_id,)).fetchone()
            status = {'CANCELLED': 'cancelled', 'SAFE_HOLD': 'safe_hold', 'ESCALATED': 'escalated'}.get(row['current_state'], 'completed')
            db.execute('UPDATE runs SET status=?,lease_until=NULL,updated_at=CURRENT_TIMESTAMP WHERE run_id=?', (status, run_id))
        elif kind == 'artifact' and event.get('title') == 'Outcome validation':
            payload = event.get('payload') or {}
            db.execute('INSERT INTO outcome_observations(run_id,outcome,observation_json) VALUES(?,?,?) '
                       'ON CONFLICT(run_id) DO UPDATE SET outcome=excluded.outcome,observation_json=excluded.observation_json',
                       (run_id, payload.get('outcome', 'UNVALIDATED'), encode(payload)))
        return sequence

    def create(self, run_id: str, request: dict[str, Any], idempotency_key: str | None = None,
               requested_by: str = 'local', manifest: dict | None = None) -> bool:
        with self._connect(write=True) as db:
            if self.postgres:
                db.execute('SELECT pg_advisory_xact_lock(7243187)')
            if idempotency_key and db.execute('SELECT run_id FROM runs WHERE idempotency_key=?', (idempotency_key,)).fetchone():
                return False
            count = db.execute("SELECT COUNT(*) AS n FROM runs WHERE status='queued'").fetchone()['n']
            if count >= int(os.getenv('RUN_QUEUE_CAPACITY', '100')):
                raise ValueError('run queue is full')
            result = db.execute('INSERT INTO runs(run_id,status,request_json,idempotency_key,requested_by,manifest_json,enqueued_epoch) '
                                'VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING',
                                (run_id, 'queued', encode(request), idempotency_key, requested_by, encode(manifest or {}), time.time()))
            return result.rowcount == 1

    def by_idempotency_key(self, key: str) -> str | None:
        with self._connect() as db:
            row = db.execute('SELECT run_id FROM runs WHERE idempotency_key=?', (key,)).fetchone()
            return row['run_id'] if row else None

    def claim_next(self, worker_id: str, lease_s: float = 30) -> dict | None:
        with self._connect(write=True) as db:
            suffix = ' FOR UPDATE SKIP LOCKED' if self.postgres else ''
            row = db.execute("SELECT * FROM runs WHERE status='queued' ORDER BY created_at,run_id LIMIT 1" + suffix).fetchone()
            if row is None:
                return None
            now = time.time()
            db.execute("UPDATE runs SET status='running',worker_id=?,lease_until=?,started_epoch=?,updated_at=CURRENT_TIMESTAMP WHERE run_id=?",
                       (worker_id, now + lease_s, now, row['run_id']))
            result = dict(row)
            result.update(status='running', worker_id=worker_id, lease_until=now + lease_s, started_epoch=now)
            result['request'] = json.loads(result.pop('request_json'))
            return result

    def heartbeat(self, run_id: str, worker_id: str, lease_s: float = 30) -> bool:
        with self._connect(write=True) as db:
            result = db.execute("UPDATE runs SET lease_until=? WHERE run_id=? AND worker_id=? AND status IN ('running','cancelling') AND lease_until>?",
                                (time.time() + lease_s, run_id, worker_id, time.time()))
            return result.rowcount == 1

    def _lock_target(self, db: Connection, target_id: str) -> None:
        # Serialize target acquisition even when no lock row exists yet.
        if self.postgres:
            db.execute('SELECT pg_advisory_xact_lock(hashtextextended(?,7243190))', (target_id,))

    @staticmethod
    def _action_blocks_target(row, now: float) -> bool:
        if row['rollback_status'] == 'rolled_back':
            return False
        if row['status'] in ('pending', 'unknown') or row['rollback_status'] in ('pending', 'unknown'):
            return True
        if row['status'] not in ('applied', 'applied_to_lab', 'applied_to_stub'):
            return False
        from .action_catalog import parse_action
        parsed = parse_action(row['action'])
        if parsed is None:
            return True
        epochs = []
        if row['started_epoch'] is not None:
            epochs.append(float(row['started_epoch']))
        try:
            receipt = json.loads(row['receipt_json'] or '{}')
            if receipt.get('applied_at_epoch') is not None:
                epochs.append(float(receipt['applied_at_epoch']))
            updated = datetime.fromisoformat(row['updated_at'].replace('Z', '+00:00'))
            if updated.tzinfo is None:
                updated = updated.replace(tzinfo=timezone.utc)
            epochs.append(updated.timestamp())
        except (TypeError, ValueError):
            return True
        if not epochs or not all(math.isfinite(epoch) for epoch in epochs):
            return True
        return max(epochs) + parsed[1] + 30 > now

    def claim_target(self, run_id: str, target_id: str, worker_id: str) -> bool:
        """Acquire exclusive target ownership only for a currently leased run.

        Old terminal runs continue blocking while an action is unresolved or
        its conservative duration has not elapsed, even after their lock was
        released. No acquisition retries or replays a previous action.
        """
        if not target_id:
            raise ValueError('target id is required')
        with self._connect(write=True) as db:
            self._lock_target(db, target_id)
            run = self._lock_run(db, run_id)
            now = time.time()
            if not run or run['status'] != 'running' or run['cancel_requested'] or run['worker_id'] != worker_id or not run['lease_until'] or run['lease_until'] <= now:
                return False
            target_suffix = ' FOR UPDATE OF t' if self.postgres else ''
            held = db.execute('SELECT t.*,r.status,r.lease_until FROM target_locks t JOIN runs r ON r.run_id=t.run_id WHERE t.target_id=?' + target_suffix, (target_id,)).fetchone()
            if held and held['run_id'] != run_id:
                if held['status'] not in TERMINAL and held['lease_until'] and held['lease_until'] > now:
                    return False
            actions = db.execute('SELECT a.*,r.started_epoch FROM action_intents a JOIN runs r ON r.run_id=a.run_id WHERE a.target_id=? AND a.run_id<>?', (target_id, run_id)).fetchall()
            if any(self._action_blocks_target(row, now) for row in actions):
                return False
            db.execute('INSERT INTO target_locks(target_id,run_id,worker_id,claimed_epoch) VALUES(?,?,?,?) '
                       'ON CONFLICT(target_id) DO UPDATE SET run_id=excluded.run_id,worker_id=excluded.worker_id,claimed_epoch=excluded.claimed_epoch',
                       (target_id, run_id, worker_id, now))
            return True

    def release_target(self, run_id: str, target_id: str, worker_id: str) -> bool:
        with self._connect(write=True) as db:
            self._lock_target(db, target_id)
            result = db.execute('DELETE FROM target_locks WHERE target_id=? AND run_id=? AND worker_id=?', (target_id, run_id, worker_id))
            return result.rowcount == 1

    def append(self, run_id: str, event: dict[str, Any], worker_id: str | None = None) -> int:
        with self._connect(write=True) as db:
            row = self._lock_run(db, run_id)
            if row is None:
                raise ValueError('run not found')
            if row['status'] in TERMINAL:
                raise ValueError('cannot append to a terminal run')
            if worker_id and (row['worker_id'] != worker_id or not row['lease_until'] or row['lease_until'] <= time.time()):
                raise ValueError('worker lease no longer owns this run')
            return self._append(db, run_id, event)

    def interrupt_expired(self) -> int:
        with self._connect(write=True) as db:
            suffix = ' FOR UPDATE SKIP LOCKED' if self.postgres else ''
            rows = db.execute("SELECT * FROM runs WHERE status IN ('running','cancelling') AND (lease_until IS NULL OR lease_until<=?)" + suffix, (time.time(),)).fetchall()
            for row in rows:
                run_id = row['run_id']
                self._append(db, run_id, {'type': 'run.end', 'ts': 0, 'outcome': 'UNVALIDATED',
                                         'summary': 'Worker lease expired; execution was interrupted and will not be retried.'})
                db.execute("UPDATE runs SET status='interrupted',lease_until=NULL WHERE run_id=?", (run_id,))
                db.execute("UPDATE action_intents SET status='unknown' WHERE run_id=? AND status='pending'", (run_id,))
                db.execute("UPDATE action_intents SET rollback_status='unknown' WHERE run_id=? AND rollback_status='pending'", (run_id,))
            return len(rows)

    def request_cancel(self, run_id: str) -> bool:
        with self._connect(write=True) as db:
            row = self._lock_run(db, run_id)
            if not row or row['status'] in TERMINAL:
                return False
            if row['status'] == 'queued':
                self._append(db, run_id, {'type': 'state', 'state': 'CANCELLED', 'ts': 0})
                self._append(db, run_id, {'type': 'run.end', 'outcome': 'UNVALIDATED', 'ts': 0,
                                         'summary': 'Queued run cancelled before a worker started it.'})
                db.execute('UPDATE runs SET cancel_requested=1 WHERE run_id=?', (run_id,))
            else:
                db.execute("UPDATE runs SET status='cancelling',cancel_requested=1,updated_at=CURRENT_TIMESTAMP WHERE run_id=?", (run_id,))
            return True

    def set_status(self, run_id: str, status: str, error: str | None = None) -> None:
        if status not in TERMINAL | {'queued', 'running', 'cancelling'}:
            raise ValueError('unknown run status')
        with self._connect(write=True) as db:
            self._lock_run(db, run_id)
            db.execute('UPDATE runs SET status=?,error=?,lease_until=NULL,updated_at=CURRENT_TIMESTAMP WHERE run_id=?', (status, error, run_id))

    def finish_error(self, run_id: str, message: str) -> None:
        self.set_status(run_id, 'failed', message)

    def interrupt_run(self, run_id: str, error: str = 'Worker interrupted') -> None:
        with self._connect(write=True) as db:
            row = self._lock_run(db, run_id)
            if not row or row['status'] in TERMINAL:
                return
            self._append(db, run_id, {'type': 'run.end', 'ts': 0, 'outcome': 'UNVALIDATED', 'summary': error})
            db.execute("UPDATE runs SET status='interrupted',lease_until=NULL,error=? WHERE run_id=?", (error, run_id))
            db.execute("UPDATE action_intents SET status='unknown' WHERE run_id=? AND status='pending'", (run_id,))

    def freeze_manifest(self, run_id: str, manifest: dict) -> None:
        with self._connect(write=True) as db:
            row = self._lock_run(db, run_id)
            if not row:
                raise ValueError('run not found')
            prior = json.loads(row['manifest_json'] or '{}')
            if prior and prior != manifest:
                raise ValueError('run manifest is frozen')
            db.execute('UPDATE runs SET manifest_json=? WHERE run_id=?', (encode(manifest), run_id))

    def begin_action_intent(self, run_id: str, key: str, target_id: str, action: str) -> tuple[bool, dict]:
        with self._connect(write=True) as db:
            run = self._lock_run(db, run_id)
            if run is None or run['status'] not in ('running', 'cancelling') or run['cancel_requested']:
                raise ValueError('run is not active or cancellation is pending')
            if json.loads(run['request_json']).get('source_mode') == 'live_lab':
                suffix = ' FOR UPDATE' if self.postgres else ''
                target = db.execute('SELECT * FROM target_locks WHERE target_id=?' + suffix, (target_id,)).fetchone()
                if not run['lease_until'] or run['lease_until'] <= time.time() or not target or target['run_id'] != run_id or target['worker_id'] != run['worker_id']:
                    raise ValueError('live actuator requires an owned target and an active worker lease')
            result = db.execute('INSERT INTO action_intents(run_id,idempotency_key,target_id,action,status) VALUES(?,?,?,?,?) '
                                'ON CONFLICT DO NOTHING', (run_id, key, target_id, action, 'pending'))
            row = db.execute('SELECT * FROM action_intents WHERE run_id=? AND idempotency_key=?', (run_id, key)).fetchone()
            if row['target_id'] != target_id or row['action'] != action:
                raise ValueError('action idempotency key reused for different parameters')
            return result.rowcount == 1, dict(row)

    def complete_action_intent(self, run_id: str, key: str, status: str, receipt: dict) -> None:
        with self._connect(write=True) as db:
            self._lock_run(db, run_id)
            result = db.execute("UPDATE action_intents SET status=?,receipt_json=?,updated_at=CURRENT_TIMESTAMP WHERE run_id=? AND idempotency_key=? AND status IN ('pending','unknown')",
                                (status, encode(receipt), run_id, key))
            if result.rowcount != 1:
                raise ValueError('no pending or unknown action intent to complete')

    def begin_rollback(self, run_id: str, key: str) -> tuple[bool, dict]:
        with self._connect(write=True) as db:
            self._lock_run(db, run_id)
            row = db.execute('SELECT * FROM action_intents WHERE run_id=? AND idempotency_key=?', (run_id, key)).fetchone()
            if not row or row['status'] not in ('applied', 'applied_to_lab', 'applied_to_stub'):
                raise ValueError('no confirmed action to roll back')
            if row['rollback_status']:
                return False, dict(row)
            db.execute("UPDATE action_intents SET rollback_status='pending' WHERE run_id=? AND idempotency_key=?", (run_id, key))
            result = dict(row)
            result['rollback_status'] = 'pending'
            return True, result

    def complete_rollback(self, run_id: str, key: str, receipt: dict) -> None:
        with self._connect(write=True) as db:
            self._lock_run(db, run_id)
            result = db.execute("UPDATE action_intents SET rollback_status='rolled_back',rollback_json=?,updated_at=CURRENT_TIMESTAMP WHERE run_id=? AND idempotency_key=? AND rollback_status IN ('pending','unknown')",
                                (encode(receipt), run_id, key))
            if result.rowcount != 1:
                raise ValueError('no pending or unknown rollback to complete')

    def record_reconciled_rollback(self, run_id: str, key: str, receipt: dict) -> None:
        """Resolve an ambiguous effect using a bound gateway receipt only.

        This resolves actuator ownership, never the held run or its outcome.
        """
        with self._connect(write=True) as db:
            self._lock_run(db, run_id)
            row = db.execute('SELECT * FROM action_intents WHERE run_id=? AND idempotency_key=?',
                             (run_id, key)).fetchone()
            if row is None:
                raise ValueError('unknown action intent')
            expected = {'run_id': run_id, 'idempotency_key': key, 'target_id': row['target_id'],
                        'action': row['action'], 'status': 'rolled_back'}
            if any(receipt.get(name) != value for name, value in expected.items()):
                raise ValueError('reconciled rollback does not match action intent')
            policy_hash = json.loads(row['receipt_json'] or '{}').get('policy_hash')
            if not policy_hash or receipt.get('policy_hash') != policy_hash:
                raise ValueError('reconciled rollback policy authorization mismatch')
            timestamp = receipt.get('rolled_back_at_epoch')
            if isinstance(timestamp, bool) or not isinstance(timestamp, (int, float)) or not math.isfinite(timestamp) or not 0 < timestamp <= time.time() + 5:
                raise ValueError('invalid reconciled rollback timestamp')
            if row['rollback_status'] == 'rolled_back':
                return
            db.execute("UPDATE action_intents SET status='rolled_back',rollback_status='rolled_back',rollback_json=?,updated_at=CURRENT_TIMESTAMP WHERE run_id=? AND idempotency_key=?",
                       (encode(receipt), run_id, key))
            self._append(db, run_id, {'type': 'artifact', 'ts': 0, 'node': 'actuator',
                                     'title': 'Reconciled gateway rollback', 'payload': receipt})

    def action_intents(self, run_id: str | None = None) -> list[dict]:
        with self._connect() as db:
            sql = 'SELECT * FROM action_intents' + (' WHERE run_id=?' if run_id else '') + ' ORDER BY created_at DESC LIMIT 1000'
            items = [dict(r) for r in db.execute(sql, (run_id,) if run_id else ()).fetchall()]
            for item in items:
                for column, name in (('receipt_json', 'receipt'), ('rollback_json', 'rollback_receipt')):
                    raw = item.pop(column)
                    if raw:
                        item[name] = json.loads(raw)
            return items

    def outcome_observation(self, run_id: str) -> dict | None:
        with self._connect() as db:
            row = db.execute('SELECT * FROM outcome_observations WHERE run_id=?', (run_id,)).fetchone()
            if not row:
                return None
            result = dict(row)
            result['observation'] = json.loads(result.pop('observation_json'))
            return result

    def get(self, run_id: str) -> dict | None:
        with self._connect() as db:
            row = db.execute('SELECT * FROM runs WHERE run_id=?', (run_id,)).fetchone()
            if not row:
                return None
            result = dict(row)
            result['request'] = json.loads(result.pop('request_json'))
            result['manifest'] = json.loads(result.pop('manifest_json') or '{}')
            return result

    def list_runs(self, limit: int = 100) -> list[dict]:
        with self._connect() as db:
            rows = db.execute('SELECT run_id,status,current_state,requested_by,created_at,updated_at,error,request_json FROM runs ORDER BY created_at DESC,run_id DESC LIMIT ?', (min(max(limit, 1), 1000),)).fetchall()
            results = []
            for row in rows:
                item = dict(row)
                item['source_mode'] = json.loads(item.pop('request_json')).get('source_mode', 'fixture')
                results.append(item)
            return results

    def events_after(self, run_id: str, sequence: int, limit: int = 500) -> list[dict]:
        with self._connect() as db:
            rows = db.execute('SELECT sequence,event_json FROM run_events WHERE run_id=? AND sequence>? ORDER BY sequence LIMIT ?', (run_id, sequence, min(max(limit, 1), 5000))).fetchall()
            return [{'sequence': r['sequence'], 'event': json.loads(r['event_json'])} for r in rows]

    def health(self) -> dict:
        with self._connect() as db:
            counts = {r['status']: r['n'] for r in db.execute('SELECT status,COUNT(*) AS n FROM runs GROUP BY status').fetchall()}
            unknown = db.execute("SELECT COUNT(*) AS n FROM action_intents WHERE status IN ('pending','unknown') OR rollback_status IN ('pending','unknown')").fetchone()['n']
            return {'available': True, 'backend': 'postgresql' if self.postgres else 'sqlite', 'runs': sum(counts.values()),
                    'queue': counts, 'unresolved_action_intents': unknown, 'schema_version': 1}

    def seed_cases(self, cases: list[dict]) -> None:
        with self._connect(write=True) as db:
            # Seed is an import operation, never overwrites learned evidence.
            for case in cases:
                db.execute('INSERT INTO cases(case_id,case_json) VALUES(?,?) ON CONFLICT DO NOTHING', (case['case_id'], encode(case)))

    def load_cases(self) -> list[dict]:
        with self._connect() as db:
            return [json.loads(r['case_json']) for r in db.execute('SELECT case_json FROM cases ORDER BY case_id').fetchall()]

    @staticmethod
    def _recurrence_key(case: dict) -> tuple | None:
        """Only comparable independently measured live actions form precedent."""
        from .action_catalog import parse_action
        parsed = parse_action(case.get('executed_response', ''))
        if case.get('source_mode') != 'live_lab' or not case.get('run_id') or parsed is None or parsed[1] <= 0:
            return None
        versions = tuple(case.get(field) for field in ('model_version', 'policy_version', 'outcome_version'))
        if any(not value or value == 'unknown' for value in versions):
            return None
        fields = ('device_type', 'device_criticality', 'attack_family', 'attack_subtype',
                  'behavioral_signature', 'source_cardinality', 'peak_rate', 'executed_response')
        return tuple(case.get(field) for field in fields) + versions

    def _aggregate_recurrence(self, db: Connection, case: dict) -> dict:
        key = self._recurrence_key(case)
        if key is None:
            return {'aggregated': False, 'reason': 'missing independent live run identity or known action/model versions'}
        group = []
        observations = {row['run_id']: json.loads(row['observation_json']) for row in db.execute('SELECT run_id,observation_json FROM outcome_observations').fetchall()}
        requests = {row['run_id']: json.loads(row['request_json']) for row in db.execute('SELECT run_id,request_json FROM runs').fetchall()}
        for row in db.execute('SELECT case_json FROM cases').fetchall():
            member = json.loads(row['case_json'])
            if self._recurrence_key(member) != key:
                continue
            observation = observations.get(member['run_id'], {})
            request = requests.get(member['run_id'], {})
            if request.get('source_mode') != 'live_lab' or observation.get('validated') is not True or observation.get('measurement_source') != 'independent_lab' or observation.get('outcome') != member.get('outcome'):
                continue
            group.append(member)
        # A measured adverse or incomplete outcome vetoes this exact precedent.
        # New successes do not erase earlier patient-harm or failed containment.
        adverse = [member for member in group if member.get('outcome') != 'SUCCESS']
        successful = [member for member in group if member.get('outcome') == 'SUCCESS']
        run_ids = sorted({member['run_id'] for member in successful})
        count = len(run_ids) if not adverse else 0
        # Posterior mean with a uniform Beta(1,1) prior: three independent
        # successes reach 0.8. Planner still requires >=3 and calibrated input.
        reliability = min(.99, (count + 1) / (count + 2)) if count else 0.0
        case_ids = sorted({member['case_id'] for member in successful})
        for member in group:
            member['evidence_count'] = count
            if member.get('outcome') == 'SUCCESS':
                member['reliability'] = round(reliability, 4)
            member['aggregate_case_ids'] = case_ids
            member['aggregate_run_ids'] = run_ids
            member['aggregate_veto_case_ids'] = sorted(row['case_id'] for row in adverse)
            db.execute('UPDATE cases SET case_json=?,revision=revision+1 WHERE case_id=?', (encode(member), member['case_id']))
        return {'aggregated': True, 'independent_successes': count, 'case_ids': case_ids,
                'run_ids': run_ids, 'reliability': round(reliability, 4),
                'veto_case_ids': sorted(row['case_id'] for row in adverse)}

    def write_case(self, case: dict, reused_case_id: str | None = None) -> dict:
        if case['outcome'] == 'UNVALIDATED' or case.get('source_mode') != 'live_lab':
            return {'stored': False, 'reason': 'only measured live-lab cases enter learned memory'}
        with self._connect(write=True) as db:
            if self.postgres:
                db.execute('SELECT pg_advisory_xact_lock(7243188)')
            run = db.execute('SELECT request_json FROM runs WHERE run_id=?', (case.get('run_id'),)).fetchone()
            observed = db.execute('SELECT observation_json FROM outcome_observations WHERE run_id=?', (case.get('run_id'),)).fetchone()
            observation = json.loads(observed['observation_json']) if observed else {}
            if not run or json.loads(run['request_json']).get('source_mode') != 'live_lab' or observation.get('validated') is not True or observation.get('measurement_source') != 'independent_lab' or observation.get('outcome') != case.get('outcome'):
                return {'stored': False, 'reason': 'no matching independently validated live run observation'}
            case = {**case, 'evidence_count': 1, 'reliability': min(float(case.get('reliability', .5)), .5)}
            added = db.execute('INSERT INTO cases(case_id,case_json) VALUES(?,?) ON CONFLICT DO NOTHING', (case['case_id'], encode(case)))
            result = {'stored': added.rowcount == 1, 'case_id': case['case_id']}
            if added.rowcount and reused_case_id:
                row = db.execute('SELECT case_json FROM cases WHERE case_id=?', (reused_case_id,)).fetchone()
                if row:
                    prior = json.loads(row['case_json'])
                    delta = .02 if case['outcome'] == 'SUCCESS' else (-.06 if case['outcome'] == 'PARTIAL' else -.25)
                    prior['reliability'] = round(min(.99, max(0, prior['reliability'] + delta)), 2)
                    prior['reuse_count'] += 1
                    prior['evidence_count'] = prior.get('evidence_count', 0) + 1
                    prior['last_validated'] = case['last_validated']
                    if case['outcome'] in ('HARMFUL', 'FAILURE'):
                        prior['outcome'] = case['outcome']
                    db.execute('UPDATE cases SET case_json=?,revision=revision+1 WHERE case_id=?', (encode(prior), reused_case_id))
            result['aggregation'] = self._aggregate_recurrence(db, case)
            return result

    def queue_case(self, case: dict, reused_case_id: str | None = None) -> None:
        if case['outcome'] == 'UNVALIDATED' or case.get('source_mode') != 'live_lab':
            return
        with self._connect(write=True) as db:
            db.execute('INSERT INTO case_outbox(case_id,case_json,reused_case_id) VALUES(?,?,?) ON CONFLICT DO NOTHING', (case['case_id'], encode(case), reused_case_id))

    def drain_case_outbox(self) -> int:
        with self._connect() as db:
            rows = db.execute('SELECT * FROM case_outbox ORDER BY created_at LIMIT 100').fetchall()
        for row in rows:
            self.write_case(json.loads(row['case_json']), row['reused_case_id'])
            with self._connect(write=True) as db:
                db.execute('DELETE FROM case_outbox WHERE case_id=?', (row['case_id'],))
        return len(rows)

    def reset_cases(self, seed: list[dict]) -> None:
        with self._connect(write=True) as db:
            db.execute('DELETE FROM cases')
            db.execute('DELETE FROM case_outbox')
            for case in seed:
                db.execute('INSERT INTO cases(case_id,case_json) VALUES(?,?)', (case['case_id'], encode(case)))

    def audit(self, actor: str, operation: str, resource: str, detail: dict | None = None) -> None:
        with self._connect(write=True) as db:
            db.execute('INSERT INTO audit_events(audit_id,actor,operation,resource,detail_json) VALUES(?,?,?,?,?)',
                       (uuid.uuid4().hex, actor, operation, resource, encode(detail or {})))

    def session_revoked(self, token_hash: str) -> bool:
        with self._connect() as db:
            return db.execute('SELECT token_hash FROM revoked_sessions WHERE token_hash=? AND expires_epoch>?',
                              (token_hash, time.time())).fetchone() is not None

    def revoke_session(self, token_hash: str, expires_epoch: float) -> None:
        with self._connect(write=True) as db:
            db.execute('DELETE FROM revoked_sessions WHERE expires_epoch<=?', (time.time(),))
            db.execute('INSERT INTO revoked_sessions(token_hash,expires_epoch) VALUES(?,?) ON CONFLICT DO NOTHING',
                       (token_hash, expires_epoch))

    def audits(self, limit: int = 100) -> list[dict]:
        with self._connect() as db:
            rows = db.execute('SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?', (min(max(limit, 1), 1000),)).fetchall()
            return [{**dict(r), 'detail': json.loads(r['detail_json'])} for r in rows]

    def save_experiment(self, experiment_id: str, manifest: dict, report: dict | None = None) -> None:
        with self._connect(write=True) as db:
            row = db.execute('SELECT manifest_json FROM experiments WHERE experiment_id=?', (experiment_id,)).fetchone()
            if row and json.loads(row['manifest_json']) != manifest:
                raise ValueError('frozen experiment manifest cannot be changed')
            db.execute('INSERT INTO experiments(experiment_id,manifest_json,report_json) VALUES(?,?,?) '
                       'ON CONFLICT(experiment_id) DO UPDATE SET report_json=excluded.report_json',
                       (experiment_id, encode(manifest), encode(report) if report else None))

    def experiments(self) -> list[dict]:
        with self._connect() as db:
            rows = db.execute('SELECT * FROM experiments ORDER BY created_at DESC LIMIT 100').fetchall()
            return [{'experiment_id': r['experiment_id'], 'manifest': json.loads(r['manifest_json']),
                     'report': json.loads(r['report_json']) if r['report_json'] else None, 'created_at': r['created_at']} for r in rows]


RUNS = RunStore()
