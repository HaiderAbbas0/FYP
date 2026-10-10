import hashlib
import json
import os
import time
import unittest
from unittest.mock import patch

import httpx
from fastapi import HTTPException
from starlette.requests import Request

from app.auth import AuthManager
from app.lab_gateway import HttpLabExecutor
from app.executor import ExecutionRejected
from app.outcomes import CounterSample, validate_outcome
from app.schemas import PolicyCheck, PolicyDecision, PolicyVerdict, Outcome


class FakeStore:
    def __init__(self):
        self.rows = {}

    def begin_action_intent(self, run, key, target, action):
        owns = key not in self.rows
        if owns:
            self.rows[key] = dict(run_id=run, idempotency_key=key, target_id=target,
                                  action=action, status="pending", receipt=None, rollback_status=None)
        return owns, self.rows[key]

    def action_intents(self, run=None):
        return [row for row in self.rows.values() if run is None or row["run_id"] == run]

    def complete_action_intent(self, run, key, status, receipt):
        self.rows[key].update(status=status, receipt=receipt)


def decision(action):
    return PolicyDecision(verdict=PolicyVerdict.PASS,
                          checks=[PolicyCheck(rule="bounded", result="PASS")],
                          executed_action=action, rationale="allowed")


class GatewayTests(unittest.IsolatedAsyncioTestCase):
    async def test_timeout_reconciles_without_second_effect(self):
        writes = []
        applied = {}

        def handle(request):
            if request.method == "POST":
                payload = json.loads(request.content)
                writes.append(payload)
                applied.update(payload, status="applied", simulated=False, applied_at_epoch=time.time())
                raise httpx.ReadTimeout("receipt lost", request=request)
            return httpx.Response(200, json=applied)

        executor = HttpLabExecutor(base_url="https://lab.invalid", token="secret",
                                   targets={"device"}, store=FakeStore(),
                                   transport=httpx.MockTransport(handle))
        action = "connection_cap(10s)"
        executor.authorize("run", "device", action, decision(action))
        with self.assertRaises(ExecutionRejected):
            await executor.execute("run", "device", action)
        receipt = await executor.reconcile("run", "run:containment:1")
        self.assertEqual(receipt.status, "applied")
        self.assertFalse(receipt.simulated)
        self.assertEqual(len(writes), 1)

    async def test_unbound_action_and_wrong_target_rejected(self):
        executor = HttpLabExecutor(base_url="http://lab.invalid", token="secret",
                                   targets={"device"}, store=FakeStore())
        with self.assertRaises(ExecutionRejected):
            await executor.execute("run", "device", "connection_cap(10s)")
        with self.assertRaises(ExecutionRejected):
            executor.authorize("run", "other", "connection_cap(10s)", decision("connection_cap(10s)"))


class OutcomeTests(unittest.TestCase):
    def samples(self, start, rate, availability=100, provenance="live_lab"):
        offset = 10000 if start > 10 else 0
        return [CounterSample(target_id="device", sensor_id="sensor", provenance=provenance,
                              timestamp=start + i * 3, malicious_packets=offset + rate * i * 3,
                              legitimate_attempts=offset + i * 100, legitimate_successes=offset + i * availability,
                              latency_ms=5) for i in range(3)]

    def evaluate(self, post, baseline=None):
        return validate_outcome(baseline or self.samples(1, 100), post,
                                action_applied_at=10, target_id="device", independent_sensor_id="sensor")

    def test_measured_success_requires_live_provenance(self):
        self.assertEqual(self.evaluate(self.samples(11, 1)).outcome, Outcome.SUCCESS)
        self.assertEqual(self.evaluate(self.samples(11, 1, provenance="fixture")).outcome, Outcome.UNVALIDATED)

    def test_collateral_harm_overrides_suppression(self):
        self.assertEqual(self.evaluate(self.samples(11, 1, availability=80)).outcome, Outcome.HARMFUL)

    def test_reset_and_missing_samples_are_unvalidated(self):
        post = self.samples(11, 1)
        post[-1].malicious_packets = 0
        self.assertEqual(self.evaluate(post).outcome, Outcome.UNVALIDATED)
        self.assertEqual(self.evaluate(post[:1]).outcome, Outcome.UNVALIDATED)


class AuthTests(unittest.TestCase):
    def request(self, headers=None, cookie=None):
        items = [(key.lower().encode(), value.encode()) for key, value in (headers or {}).items()]
        if cookie:
            items.append((b"cookie", ("ids_session=" + cookie).encode()))
        return Request(dict(type="http", method="GET", path="/api/runs", headers=items,
                            client=("203.0.113.10", 123), server=("localhost", 8000), scheme="http"))

    def test_scoped_key_and_cookie_session(self):
        config = {"viewer1": {"sha256": hashlib.sha256(b"key").hexdigest(), "role": "viewer"}}
        with patch.dict(os.environ, IDS_API_KEYS_JSON=json.dumps(config), IDS_AUTH_DEV_LOCALHOST="false", IDS_SESSION_SECRET="x" * 32):
            auth = AuthManager()
        principal = auth.require(self.request({"Authorization": "Bearer key"}))
        with self.assertRaises(HTTPException) as caught:
            auth.require(self.request({"Authorization": "Bearer key"}), "operator")
        self.assertEqual(caught.exception.status_code, 403)
        token = auth.create_session(principal)
        self.assertEqual(auth.require(self.request(cookie=token)).role, "viewer")
        auth.revoke_session(token)
        with self.assertRaises(HTTPException):
            auth.require(self.request(cookie=token))

    def test_remote_origin_cannot_use_local_development_identity(self):
        with patch.dict(os.environ, IDS_API_KEYS_JSON="{}", IDS_AUTH_DEV_LOCALHOST="true"):
            auth = AuthManager()
        request = self.request({"Origin": "https://untrusted.invalid"})
        request.scope["client"] = ("127.0.0.1", 123)
        with self.assertRaises(HTTPException):
            auth.require(request)

    def test_x_api_key_and_tampered_signed_cookie(self):
        config = {"operator": {"sha256": hashlib.sha256(b"key").hexdigest(), "role": "operator"}}
        with patch.dict(os.environ, IDS_API_KEYS_JSON=json.dumps(config), IDS_AUTH_DEV_LOCALHOST="false", IDS_SESSION_SECRET="x" * 32):
            auth = AuthManager()
        principal = auth.require(self.request({"X-API-Key": "key"}), "operator")
        token = auth.create_session(principal)
        with self.assertRaises(HTTPException):
            auth.require(self.request(cookie=token[:-1] + ("0" if token[-1] != "0" else "1")))
