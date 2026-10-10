"""Durable target exclusion survives controller and action uncertainty."""
import tempfile
import time
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from app.run_store import RunStore


class TargetLockTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = RunStore(Path(self.temp.name) / 'runs.db')
        for name in ('r1', 'r2'):
            self.store.create(name, {'source_mode': 'live_lab'})
            self.store.claim_next(name)

    def tearDown(self):
        self.temp.cleanup()

    def test_concurrent_workers_cannot_claim_same_target(self):
        with ThreadPoolExecutor(2) as pool:
            results = list(pool.map(lambda run: self.store.claim_target(run, 'gateway', run), ('r1', 'r2')))
        self.assertEqual(sum(results), 1)
        winner = 'r1' if results[0] else 'r2'
        loser = 'r2' if results[0] else 'r1'
        self.assertFalse(self.store.release_target(winner, 'gateway', loser))
        self.assertTrue(self.store.release_target(winner, 'gateway', winner))
        self.assertTrue(self.store.claim_target(loser, 'gateway', loser))

    def test_terminal_unknown_action_blocks_after_release_and_restart(self):
        self.assertTrue(self.store.claim_target('r1', 'gateway', 'r1'))
        self.store.begin_action_intent('r1', 'action', 'gateway', 'connection_cap(1s)')
        self.store.interrupt_run('r1', 'crash')
        self.store.release_target('r1', 'gateway', 'r1')
        again = RunStore(self.store.path)
        self.assertEqual(again.action_intents('r1')[0]['status'], 'unknown')
        self.assertFalse(again.claim_target('r2', 'gateway', 'r2'))

    def test_applied_action_blocks_until_confirmed_rollback(self):
        self.store.claim_target('r1', 'gateway', 'r1')
        self.store.begin_action_intent('r1', 'action', 'gateway', 'connection_cap(60s)')
        self.store.complete_action_intent('r1', 'action', 'applied_to_lab', {'applied_at_epoch': time.time()})
        self.store.set_status('r1', 'completed')
        self.store.release_target('r1', 'gateway', 'r1')
        self.assertFalse(self.store.claim_target('r2', 'gateway', 'r2'))
        self.store.begin_rollback('r1', 'action')
        self.assertFalse(self.store.claim_target('r2', 'gateway', 'r2'))
        self.store.complete_rollback('r1', 'action', {'status': 'rolled_back'})
        self.assertTrue(self.store.claim_target('r2', 'gateway', 'r2'))

    def test_expired_applied_action_can_release_target(self):
        self.store.claim_target('r1', 'gateway', 'r1')
        self.store.begin_action_intent('r1', 'action', 'gateway', 'connection_cap(1s)')
        self.store.complete_action_intent('r1', 'action', 'applied_to_lab', {'applied_at_epoch': 1})
        self.store.set_status('r1', 'completed')
        self.store.release_target('r1', 'gateway', 'r1')
        with self.store._connect(write=True) as db:
            db.execute('UPDATE runs SET started_epoch=1 WHERE run_id=?', ('r1',))
            db.execute("UPDATE action_intents SET updated_at='1970-01-01 00:00:01' WHERE run_id=?", ('r1',))
        self.assertTrue(self.store.claim_target('r2', 'gateway', 'r2'))

    def test_lease_owner_and_target_are_required_at_intent_boundary(self):
        self.assertFalse(self.store.claim_target('r1', 'gateway', 'wrong'))
        with self.assertRaises(ValueError):
            self.store.begin_action_intent('r1', 'action', 'gateway', 'connection_cap(1s)')
        self.assertTrue(self.store.claim_target('r1', 'gateway', 'r1'))
        with self.store._connect(write=True) as db:
            db.execute('UPDATE runs SET lease_until=0 WHERE run_id=?', ('r1',))
        with self.assertRaises(ValueError):
            self.store.begin_action_intent('r1', 'action', 'gateway', 'connection_cap(1s)')


if __name__ == '__main__':
    unittest.main()
