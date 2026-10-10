"""Transactional ownership and assembled API failure boundaries."""
import asyncio
import hashlib
import json
import os
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

from app.run_store import RunStore


class RepositoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = RunStore(Path(self.temp.name) / 'runs.db')

    def tearDown(self):
        self.temp.cleanup()

    def test_queue_claim_is_exclusive_and_survives_repository_restart(self):
        self.assertTrue(self.store.create('r1', {'source_mode': 'fixture'}, 'key'))
        self.assertFalse(self.store.create('r2', {}, 'key'))
        again = RunStore(self.store.path)
        self.assertEqual(again.get('r1')['status'], 'queued')
        self.assertEqual(again.claim_next('one')['run_id'], 'r1')
        self.assertIsNone(self.store.claim_next('two'))
        self.assertFalse(self.store.heartbeat('r1', 'two'))
        self.assertTrue(self.store.heartbeat('r1', 'one'))

    def test_expired_lease_interrupts_and_never_replays_effect(self):
        self.store.create('r1', {})
        self.store.claim_next('one', .02)
        self.store.begin_action_intent('r1', 'k', 'SN-02', 'connection_cap(1s)')
        time.sleep(.03)
        self.assertEqual(self.store.interrupt_expired(), 1)
        self.assertEqual(self.store.get('r1')['status'], 'interrupted')
        self.assertEqual(self.store.action_intents('r1')[0]['status'], 'unknown')
        self.assertIsNone(self.store.claim_next('two'))
        with self.assertRaises(ValueError):
            self.store.append('r1', {'type': 'state', 'state': 'EXECUTED', 'ts': 0}, 'one')

    def test_cancel_queued_run_is_terminal_without_execution(self):
        self.store.create('r1', {})
        self.assertTrue(self.store.request_cancel('r1'))
        self.assertEqual(self.store.get('r1')['status'], 'cancelled')
        self.assertEqual(self.store.events_after('r1', 0)[-1]['event']['outcome'], 'UNVALIDATED')
        self.assertIsNone(self.store.claim_next('one'))

    def test_concurrent_append_has_unique_monotonic_sequence(self):
        from concurrent.futures import ThreadPoolExecutor
        self.store.create('r1', {})
        self.store.claim_next('one')
        with ThreadPoolExecutor(max_workers=6) as executor:
            seqs = list(executor.map(lambda i: self.store.append('r1', {'type': 'log', 'ts': i, 'msg': str(i)}), range(30)))
        self.assertEqual(sorted(seqs), list(range(1, 31)))
        self.assertEqual([r['sequence'] for r in self.store.events_after('r1', 10)], list(range(11, 31)))

    def test_manifest_is_frozen_and_fixture_case_is_not_learned(self):
        self.store.create('r1', {})
        self.store.freeze_manifest('r1', {'hash': 'one'})
        with self.assertRaises(ValueError):
            self.store.freeze_manifest('r1', {'hash': 'two'})
        self.assertFalse(self.store.write_case({'case_id': 'c', 'source_mode': 'fixture', 'outcome': 'SUCCESS'})['stored'])
        self.assertEqual(self.store.load_cases(), [])


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = RunStore(Path(self.temp.name) / 'runs.db')
        config = {role: {'sha256': hashlib.sha256(role.encode()).hexdigest(), 'role': role} for role in ('viewer', 'operator', 'admin')}
        self.env = patch.dict(os.environ, {'IDS_API_KEYS_JSON': json.dumps(config), 'IDS_SESSION_SECRET': 'test-only-session-signing-secret-32-characters',
                                          'SPECIALIST_EXECUTION': 'inprocess', 'IDS_AUTH_DEV_LOCALHOST': 'false', 'IDS_EMBEDDED_WORKER': 'true'})
        self.env.start()
        import app.main as main
        import app.run_store as run_store
        from app.auth import AuthManager
        from fastapi.testclient import TestClient
        self.main = main
        self.patches = [patch.object(main, 'RUNS', self.store), patch.object(run_store, 'RUNS', self.store), patch.object(main, 'AUTH', AuthManager())]
        for item in self.patches:
            item.start()
        self.client_context = TestClient(main.app)
        self.client = self.client_context.__enter__()
        self.headers = {'Authorization': 'Bearer operator'}

    def tearDown(self):
        self.client_context.__exit__(None, None, None)
        for item in reversed(self.patches):
            item.stop()
        self.env.stop()
        self.temp.cleanup()

    def wait_terminal(self, run_id):
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            run = self.client.get('/api/runs/' + run_id, headers=self.headers).json()
            if run['status'] not in ('queued', 'running', 'cancelling'):
                return run
            time.sleep(.02)
        self.fail('run failed to terminate')

    def test_fixture_pipeline_journals_without_model_and_cannot_create_precedent(self):
        response = self.client.post('/api/runs', headers=self.headers, json={'source_mode': 'fixture', 'speed': 20, 'faults': {'llmDown': True}})
        self.assertEqual(response.status_code, 202, response.text)
        run_id = response.json()['run_id']
        run = self.wait_terminal(run_id)
        self.assertEqual(run['status'], 'completed', run)
        journal = self.client.get(f'/api/runs/{run_id}/journal', headers=self.headers).json()['events']
        events = [row['event'] for row in journal]
        self.assertEqual(events[-1]['outcome'], 'UNVALIDATED')
        self.assertEqual(run['manifest']['source_mode'], 'fixture')
        self.assertEqual(run['outcome_observation']['observation']['measurement_source'], 'gateway_stub')
        self.assertEqual(run['action_intents'][0]['status'], 'applied_to_stub')
        self.assertFalse(any(e.get('state') == 'CASE_STORED' for e in events))

    def test_roles_idempotency_and_sse_cookie_session(self):
        self.assertEqual(self.client.post('/api/runs', json={}).status_code, 401)
        self.assertEqual(self.client.post('/api/runs', headers={'Authorization': 'Bearer viewer'}, json={}).status_code, 403)
        self.assertEqual(self.client.post('/api/memory/reset', headers=self.headers).status_code, 403)
        headers = {**self.headers, 'Idempotency-Key': 'same-request'}
        body = {'source_mode': 'fixture', 'speed': 20, 'faults': {'llmDown': True}}
        first = self.client.post('/api/runs', headers=headers, json=body).json()
        second = self.client.post('/api/runs', headers=headers, json=body).json()
        self.assertEqual(first['run_id'], second['run_id'])
        self.assertEqual(self.client.post('/api/runs', headers=headers, json={**body, 'scenario': 'high'}).status_code, 409)
        self.wait_terminal(first['run_id'])
        self.assertEqual(self.client.post('/api/auth/session', headers={'Authorization': 'Bearer viewer'}).status_code, 200)
        stream = self.client.get(f"/api/runs/{first['run_id']}/events", headers={'Last-Event-ID': '2'})
        self.assertEqual(stream.status_code, 200)
        self.assertNotIn('id: 1\n', stream.text)
        self.assertIn('run.end', stream.text)

    def test_live_ablation_and_nonfinite_incident_rejected(self):
        response = self.client.post('/api/runs', headers=self.headers, json={'source_mode': 'live_lab', 'evaluation_profile': 'similarity_only'})
        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.client.get('/api/simulate/stream', headers=self.headers).status_code, 410)


if __name__ == '__main__':
    unittest.main()
