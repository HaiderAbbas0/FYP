"""Opt-in real PostgreSQL checks, isolated in disposable per-test schemas.

Set IDS_TEST_POSTGRES_URL to a test database URL. No public tables are changed.
"""
import concurrent.futures
import os
import unittest
import uuid
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from app.run_store import RunStore

URL = os.getenv("IDS_TEST_POSTGRES_URL")


@unittest.skipUnless(URL, "IDS_TEST_POSTGRES_URL is not configured")
class PostgreSQLIntegrationTests(unittest.TestCase):
    def setUp(self):
        import psycopg
        from psycopg import sql
        self.schema = "ids_test_" + uuid.uuid4().hex
        with psycopg.connect(URL, autocommit=True) as db:
            db.execute(sql.SQL("CREATE SCHEMA {}").format(sql.Identifier(self.schema)))
        parts = urlsplit(URL)
        query = dict(parse_qsl(parts.query))
        query["options"] = f"-csearch_path={self.schema}"
        scoped = urlunsplit(parts._replace(query=urlencode(query)))
        self.store = RunStore(database_url=scoped)

    def tearDown(self):
        import psycopg
        from psycopg import sql
        with psycopg.connect(URL, autocommit=True) as db:
            db.execute(sql.SQL("DROP SCHEMA {} CASCADE").format(sql.Identifier(self.schema)))

    def test_migration_and_idempotent_submission(self):
        self.store.migrate()
        self.assertTrue(self.store.health()["available"])
        self.assertTrue(self.store.create("one", {"source_mode": "fixture"}, "idem"))
        self.assertFalse(self.store.create("two", {"source_mode": "fixture"}, "idem"))
        self.assertEqual(self.store.by_idempotency_key("idem"), "one")

    def test_concurrent_claims_skip_locked_and_journal_sequence(self):
        for i in range(8):
            self.store.create(f"run-{i}", {"source_mode": "fixture"})
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            claimed = list(pool.map(lambda i: self.store.claim_next(f"worker-{i}"), range(8)))
        self.assertEqual(len({r["run_id"] for r in claimed}), 8)
        self.assertIsNone(self.store.claim_next("ninth"))
        run = claimed[0]
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            sequences = list(pool.map(lambda i: self.store.append(run["run_id"], {"type": "log", "ts": i, "msg": str(i)}, run["worker_id"]), range(16)))
        self.assertEqual(sorted(sequences), list(range(1, 17)))
        self.assertEqual(len(self.store.events_after(run["run_id"], 0)), 16)

    def test_live_target_lock_and_action_idempotency(self):
        self.store.create("a", {"source_mode": "live_lab"})
        self.store.create("b", {"source_mode": "live_lab"})
        a, b = self.store.claim_next("wa"), self.store.claim_next("wb")
        self.assertTrue(self.store.claim_target(a["run_id"], "GW-01", "wa"))
        self.assertFalse(self.store.claim_target(b["run_id"], "GW-01", "wb"))
        created, _ = self.store.begin_action_intent(a["run_id"], "intent", "GW-01", "upstream_rate_limit(30s)")
        self.assertTrue(created)
        created, _ = self.store.begin_action_intent(a["run_id"], "intent", "GW-01", "upstream_rate_limit(30s)")
        self.assertFalse(created)
        self.store.complete_action_intent(a["run_id"], "intent", "applied", {"status": "applied", "applied_at": 1})
        self.assertTrue(self.store.release_target(a["run_id"], "GW-01", "wa"))
        # Releasing ownership must not permit another action while one is unresolved.
        self.assertFalse(self.store.claim_target(b["run_id"], "GW-01", "wb"))

    def test_case_outbox_is_durable_idempotent_and_rejects_fixture(self):
        self.store.create("measured-run", {"source_mode": "live_lab"})
        self.store.claim_next("sensor-worker")
        self.store.append("measured-run", {"type": "artifact", "title": "Outcome validation", "ts": 1,
            "payload": {"outcome": "SUCCESS", "validated": True, "measurement_source": "independent_lab"}}, "sensor-worker")
        case = {"case_id": "measured", "run_id": "measured-run", "source_mode": "live_lab", "outcome": "SUCCESS"}
        self.store.queue_case(case)
        self.store.queue_case(case)
        self.assertEqual(self.store.drain_case_outbox(), 1)
        self.assertEqual(self.store.drain_case_outbox(), 0)
        self.assertEqual(len(self.store.load_cases()), 1)
        self.store.queue_case({**case, "case_id": "fake", "source_mode": "fixture"})
        self.assertEqual(self.store.drain_case_outbox(), 0)
        self.assertEqual(len(self.store.load_cases()), 1)


if __name__ == "__main__":
    unittest.main()
