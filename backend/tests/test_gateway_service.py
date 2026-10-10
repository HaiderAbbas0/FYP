import json
import tempfile
import time
import unittest
from pathlib import Path
from types import SimpleNamespace

from fastapi.testclient import TestClient
import httpx

from app.lab_gateway import HttpLabExecutor
from app.run_store import RunStore
from app.schemas import PolicyCheck, PolicyDecision, PolicyVerdict

from gateway.agent import GatewayConfig, create_app
from gateway.driver import NftDriver, Target, TABLE


class FakeDriver:
    def __init__(self):
        self.effects = []
        self.removed = []
        self.resets = 0

    def initialize(self):
        self.resets += 1

    def apply(self, key, target, action, duration):
        self.effects.append((key, target, action, duration))

    def rollback(self, key):
        self.removed.append(key)


class GatewayServiceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name)
        self.target = Target("device", "10.20.1.5", "10.20.2.0/24", "medical-sensor", "Low")
        self.config = GatewayConfig("s" * 32, {"device": self.target}, self.path / "actions.sqlite3",
                                    self.path / "sensor.json", "sensor", enabled=True)
        self.driver = FakeDriver()
        self.app = create_app(self.config, self.driver)
        self.headers = {"Authorization": "Bearer " + "s" * 32}

    def tearDown(self):
        self.tmp.cleanup()

    def command(self, duration=10):
        return dict(run_id="run", idempotency_key="run:containment:1", target_id="device",
                    action=f"connection_cap({duration}s)", action_name="connection_cap", duration_s=duration,
                    expires_at=time.time() + duration, authorization_expires_at=time.time() + 15,
                    policy_hash="a" * 64, reversible=True)

    def test_apply_replay_receipt_rollback_are_idempotent(self):
        with TestClient(self.app) as client:
            command = self.command()
            self.assertEqual(client.post("/actions", json=command).status_code, 401)
            self.assertEqual(client.post("/actions", json=command, headers=self.headers).status_code, 200)
            self.assertEqual(client.post("/actions", json=command, headers=self.headers).status_code, 200)
            self.assertEqual(len(self.driver.effects), 1)
            receipt = client.get("/receipts/run:containment:1", headers=self.headers).json()
            self.assertFalse(receipt["simulated"])
            rollback = {key: command[key] for key in ("run_id", "idempotency_key", "target_id")}
            self.assertEqual(client.post("/rollbacks", json=rollback, headers=self.headers).status_code, 200)
            self.assertEqual(client.post("/rollbacks", json=rollback, headers=self.headers).status_code, 200)
            self.assertEqual(len(self.driver.removed), 1)
            self.assertEqual(client.get("/receipts/run:containment:1", headers=self.headers).json()["status"], "rolled_back")
            self.assertEqual(client.post("/actions", json=command, headers=self.headers).status_code, 409)
            self.assertEqual(len(self.driver.effects), 1)

    def test_stale_policy_and_critical_isolation_rejected(self):
        with TestClient(self.app) as client:
            command = self.command()
            command["authorization_expires_at"] = time.time() - 1
            self.assertEqual(client.post("/actions", json=command, headers=self.headers).status_code, 403)
        critical = Target("device", "10.20.1.5", "10.20.2.0/24", "ventilator", "Critical")
        config = GatewayConfig("s" * 32, {"device": critical}, self.path / "critical.sqlite3",
                               self.path / "sensor.json", "sensor", enabled=True)
        with TestClient(create_app(config, self.driver)) as client:
            command = self.command()
            command.update(action="device_isolate(10s)", action_name="device_isolate")
            self.assertEqual(client.post("/actions", json=command, headers=self.headers).status_code, 403)

    def test_independent_sensor_missing_and_stale_fail_closed(self):
        with TestClient(self.app) as client:
            self.assertEqual(client.get("/counters/device", headers=self.headers).status_code, 503)
            sample = dict(target_id="device", sensor_id="sensor", provenance="live_lab", timestamp=time.time(),
                          malicious_packets=100, legitimate_attempts=20, legitimate_successes=20, latency_ms=5)
            self.config.sensor_path.write_text(json.dumps({"samples": {"device": sample}}))
            self.assertEqual(client.get("/counters/device", headers=self.headers).status_code, 200)
            sample["timestamp"] -= 30
            self.config.sensor_path.write_text(json.dumps({"samples": {"device": sample}}))
            self.assertEqual(client.get("/counters/device", headers=self.headers).status_code, 503)

    def test_autonomous_expiry_rolls_back(self):
        with TestClient(self.app) as client:
            command = self.command(1)
            self.assertEqual(client.post("/actions", json=command, headers=self.headers).status_code, 200)
            time.sleep(1.35)
            receipt = client.get("/rollback-receipts/run:containment:1", headers=self.headers)
            self.assertEqual(receipt.status_code, 200)
            self.assertEqual(receipt.json()["reason"], "automatic-expiry")

    def test_restart_clears_owned_effects_and_records_rollback(self):
        command = self.command()
        self.app.state.journal.intent(__import__("gateway.agent", fromlist=["ActionCommand"]).ActionCommand(**command))
        self.app.state.journal.unknown(command["idempotency_key"])
        with TestClient(self.app) as client:
            receipt = client.get("/rollback-receipts/run:containment:1", headers=self.headers)
            self.assertEqual(receipt.status_code, 200)
            self.assertEqual(receipt.json()["reason"], "restart-owned-table-reset")


class NftDriverTests(unittest.TestCase):
    def test_scripts_have_kernel_expiry_and_only_owned_table(self):
        calls = []
        def runner(argv, **kwargs):
            calls.append((argv, kwargs))
            return SimpleNamespace(returncode=0, stdout=json.dumps({"nftables": []}))
        driver = NftDriver(runner=runner)
        driver.initialize()
        driver.apply("run:containment:1", Target("device", "10.20.1.5", "10.20.2.0/24", "sensor", "Low"), "connection_cap", 10)
        self.assertTrue(all(call[0][0] == "/usr/sbin/nft" and call[1]["shell"] is False for call in calls))
        script = calls[-1][1]["input"]
        self.assertIn("timeout 10s", script)
        self.assertIn(TABLE, script)
        self.assertNotIn("flush ruleset", script)

    def test_private_scope_and_target_source_overlap_rejected(self):
        with self.assertRaises(ValueError):
            Target("device", "8.8.8.8", "10.20.2.0/24", "sensor", "Low").validate()
        with self.assertRaises(ValueError):
            Target("device", "10.20.1.5", "10.20.1.0/24", "sensor", "Low").validate()


class GatewayAdapterIntegrationTests(unittest.IsolatedAsyncioTestCase):
    async def test_adapter_service_and_durable_run_journal_agree(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            target = Target("device", "10.20.1.5", "10.20.2.0/24", "sensor", "Low")
            config = GatewayConfig("s" * 32, {"device": target}, path / "gateway.sqlite3",
                                   path / "sensor.json", "independent-lab-sensor", enabled=True)
            driver = FakeDriver()
            app = create_app(config, driver)
            store = RunStore(path / "runs.sqlite3")
            store.create("run", {})
            store.claim_next("integration-worker")
            executor = HttpLabExecutor(base_url="http://gateway", token="s" * 32,
                                       targets={"device"}, store=store, transport=httpx.ASGITransport(app=app))
            action = "connection_cap(10s)"
            policy = PolicyDecision(verdict=PolicyVerdict.PASS,
                                    checks=[PolicyCheck(rule="bounded", result="PASS")],
                                    executed_action=action, rationale="registered lab target")
            async with app.router.lifespan_context(app):
                executor.authorize("run", "device", action, policy)
                applied = await executor.execute("run", "device", action)
                self.assertEqual(applied.status, "applied")
                self.assertEqual(store.action_intents("run")[0]["status"], "applied")
                receipt = await executor.rollback("run", applied.idempotency_key, "device")
                self.assertEqual(receipt.status, "rolled_back")
                self.assertEqual(store.action_intents("run")[0]["rollback_status"], "rolled_back")
                self.assertEqual(len(driver.effects), 1)
                self.assertEqual(len(driver.removed), 1)
