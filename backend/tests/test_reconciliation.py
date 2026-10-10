"""An unknown actuator effect can be resolved without replay or learning."""
import asyncio
import json
import tempfile
import time
import unittest
from pathlib import Path

import httpx

from app.executor import ExecutionRejected
from app.lab_gateway import HttpLabExecutor
from app.run_store import RunStore
from app.schemas import PolicyCheck, PolicyDecision, PolicyVerdict
from gateway.agent import GatewayConfig, create_app
from gateway.driver import Target


class Driver:
    def __init__(self):
        self.effects = []
        self.rollbacks = []

    def initialize(self):
        pass

    def apply(self, key, *args):
        self.effects.append(key)

    def rollback(self, key):
        self.rollbacks.append(key)


class LostAcknowledgement(httpx.AsyncBaseTransport):
    def __init__(self, app):
        self.inner = httpx.ASGITransport(app=app)
        self.posts = 0

    async def handle_async_request(self, request):
        response = await self.inner.handle_async_request(request)
        if request.method == 'POST' and request.url.path == '/actions':
            self.posts += 1
            raise httpx.ReadTimeout('lost action acknowledgement', request=request)
        return response


class ReconciliationTests(unittest.IsolatedAsyncioTestCase):
    async def test_cached_applied_receipt_does_not_hide_remote_rollback(self):
        with tempfile.TemporaryDirectory() as directory:
            store = RunStore(Path(directory) / 'runs.sqlite3')
            store.create('run', {})
            store.claim_next('worker')
            remote = {}
            writes = []
            def handler(request):
                if request.method == 'POST':
                    writes.append(request.url.path)
                    remote.update(json.loads(request.content), status='applied', simulated=False, applied_at_epoch=time.time())
                return httpx.Response(200, json=remote)
            executor = HttpLabExecutor(base_url='http://gateway', token='secret', targets={'device'},
                                       store=store, transport=httpx.MockTransport(handler))
            policy = PolicyDecision(verdict=PolicyVerdict.PASS, checks=[PolicyCheck(rule='bounded', result='PASS')],
                                    executed_action='connection_cap(10s)', rationale='bounded')
            executor.authorize('run', 'device', 'connection_cap(10s)', policy)
            await executor.execute('run', 'device', 'connection_cap(10s)')
            remote['status'] = 'rolled_back'
            with self.assertRaises(ExecutionRejected):
                await executor.reconcile('run', 'run:containment:1')
            self.assertEqual(writes, ['/actions'])

    async def test_unknown_effect_inspects_confirmed_rollback_and_unblocks_target(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            store = RunStore(path / 'runs.sqlite3')
            store.create('old', {'source_mode': 'live_lab'})
            store.claim_next('old-worker')
            self.assertTrue(store.claim_target('old', 'device', 'old-worker'))
            config = GatewayConfig('s' * 32, {'device': Target('device', '10.20.1.5', '10.20.2.0/24', 'sensor', 'Low')},
                                   path / 'gateway.sqlite3', path / 'sensor.json', 'sensor', enabled=True)
            driver = Driver()
            app = create_app(config, driver)
            transport = LostAcknowledgement(app)
            executor = HttpLabExecutor(base_url='http://gateway', token='s' * 32, targets={'device'},
                                       store=store, transport=transport)
            action = 'connection_cap(10s)'
            policy = PolicyDecision(verdict=PolicyVerdict.PASS, checks=[PolicyCheck(rule='bounded', result='PASS')],
                                    executed_action=action, rationale='registered lab action')
            async with app.router.lifespan_context(app):
                executor.authorize('old', 'device', action, policy)
                with self.assertRaises(ExecutionRejected):
                    await executor.execute('old', 'device', action)
                self.assertEqual(store.action_intents('old')[0]['status'], 'unknown')
                store.set_status('old', 'safe_hold')
                store.release_target('old', 'device', 'old-worker')
                store.create('new', {'source_mode': 'live_lab'})
                store.claim_next('new-worker')
                self.assertFalse(store.claim_target('new', 'device', 'new-worker'))
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://gateway') as client:
                    response = await client.post('/rollbacks', headers={'Authorization': 'Bearer ' + 's' * 32},
                                                 json={'run_id': 'old', 'target_id': 'device', 'idempotency_key': 'old:containment:1'})
                self.assertEqual(response.status_code, 200)
                inspected = await executor.inspect('old', 'old:containment:1')
                self.assertEqual(inspected['status'], 'rolled_back')
                self.assertFalse(inspected['run_resumed'])
                self.assertEqual(store.get('old')['status'], 'safe_hold')
                self.assertEqual(store.load_cases(), [])
                self.assertTrue(store.claim_target('new', 'device', 'new-worker'))
                self.assertEqual(transport.posts, 1)
                self.assertEqual(driver.effects, ['old:containment:1'])
                self.assertEqual(store.action_intents('old')[0]['rollback_status'], 'rolled_back')

    async def test_inspection_rejects_forged_binding_without_releasing_target(self):
        with tempfile.TemporaryDirectory() as directory:
            store = RunStore(Path(directory) / 'runs.sqlite3')
            store.create('run', {})
            store.claim_next('worker')
            store.begin_action_intent('run', 'run:containment:1', 'device', 'connection_cap(10s)')
            store.complete_action_intent('run', 'run:containment:1', 'unknown', {'policy_hash': 'a' * 64})
            raw = dict(run_id='run', idempotency_key='run:containment:1', target_id='other',
                       action='connection_cap(10s)', policy_hash='a' * 64, status='rolled_back',
                       rolled_back_at_epoch=time.time())
            def handler(request):
                return httpx.Response(200, json=raw) if 'rollback-receipts' in request.url.path else httpx.Response(409)
            executor = HttpLabExecutor(base_url='http://gateway', token='secret', targets={'device'},
                                       store=store, transport=httpx.MockTransport(handler))
            with self.assertRaises(ExecutionRejected):
                await executor.inspect('run', 'run:containment:1')
            self.assertEqual(store.action_intents('run')[0]['status'], 'unknown')
            self.assertIsNone(store.action_intents('run')[0]['rollback_status'])
