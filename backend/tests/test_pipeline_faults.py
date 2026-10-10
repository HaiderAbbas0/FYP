"""Assembled fixture orchestration: faults, policy boundaries and compensation."""
import asyncio
import os
import tempfile
import unittest
from pathlib import Path
from dataclasses import replace
from unittest.mock import patch

from app.action_catalog import parse_action
from app.config import settings
from app.executor import StubExecutor
from app.llm import LLMClient
from app.memory import CaseCache, MemoryAgent
from app.planner import Faults, Planner
from app.run_store import RunStore
from app.schemas import RunRequest
from app.sources import prepare


class PipelineFaultTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name)
        self.store = RunStore(self.path / "runs.sqlite3")
        self.env = patch.dict(os.environ, {"SPECIALIST_EXECUTION": "inprocess"})
        self.env.start()
        # Allow OS scheduling under concurrent integration checks; injected
        # stalls still exceed this budget and exercise the real timeout path.
        self.timeout = patch("app.specialists.settings", replace(settings, specialist_timeout_s=2))
        self.timeout.start()

    def tearDown(self):
        self.timeout.stop()
        self.env.stop()
        self.temp.cleanup()

    async def collect(self, *, faults=None, scenario="medium", cancel_state=None, cancel_during_ack=False):
        faults = faults or {}
        run_id = "fault-test"
        request = RunRequest(source_mode="fixture", scenario=scenario, speed=20, faults=faults)
        windows, event, payload = prepare(request)
        self.store.create(run_id, request.model_dump(mode="json"))
        self.store.claim_next("test-worker", lease_s=30)
        memory = MemoryAgent(self.path / "cases.json", available=not faults.get("memoryDown", False))
        memory.cache = CaseCache()
        llm = LLMClient(force_unavailable=True)
        cancel = asyncio.Event()
        store = self.store

        class CancelAfterAcknowledgement(StubExecutor):
            async def execute(self, run_id, target_id, action):
                receipt = await super().execute(run_id, target_id, action)
                # Cancellation reaches the controller while the external
                # acknowledgement boundary is suspended; effect is confirmed.
                store.request_cancel(run_id)
                cancel.set()
                await asyncio.sleep(0)
                return receipt

        executor = CancelAfterAcknowledgement(self.store) if cancel_during_ack else StubExecutor(self.store)
        planner = Planner(memory, llm, Faults.from_dict(faults), executor=executor)
        events = []
        async for item in planner.run(event, scenario=scenario, windows=windows, detector_payload=payload,
                                      run_id=run_id, source_mode="fixture", speed=20, cancel_event=cancel):
            output = item.model_dump(mode="json", by_alias=True, exclude_none=True)
            self.store.append(run_id, output, "test-worker")
            events.append(output)
            if cancel_state is not None and output.get("state") == cancel_state and not cancel.is_set():
                self.store.request_cancel(run_id)
                cancel.set()
        self.assertEqual(events[-1]["type"], "run.end")
        self.assertEqual(events[-1]["outcome"], "UNVALIDATED")
        self.assertNotIn("CASE_STORED", [item.get("state") for item in events])
        self.assertEqual(memory.cases, [])
        self.assertEqual(self.store.load_cases(), [])
        self.assertFalse(memory.path.exists(), "fixture outcomes must not persist case precedent")
        self.assertEqual(llm.calls, 0, "forced unavailable LLM must not contact a provider")
        journal = self.store.events_after(run_id, 0)
        self.assertEqual([row["sequence"] for row in journal], list(range(1, len(events) + 1)))
        return events, self.store.action_intents(run_id)

    def assert_bounded_stub_effect(self, intents):
        for intent in intents:
            parsed = parse_action(intent["action"])
            self.assertIsNotNone(parsed)
            name, duration = parsed
            self.assertNotEqual(name, "device_isolate")
            self.assertLessEqual(duration, settings.max_unattended_action_s)
            self.assertEqual(intent["receipt"]["mode"], "gateway_stub")
            self.assertTrue(intent["receipt"]["simulated"])

    async def test_memory_outage_runs_full_investigation_without_learning(self):
        events, intents = await self.collect(faults={"memoryDown": True, "llmDown": True})
        self.assertIn("FULL_INV", [item.get("state") for item in events])
        self.assertTrue(any(item["type"] == "fallback" and item.get("node") == "memory" for item in events))
        self.assert_bounded_stub_effect(intents)
        self.assertEqual(self.store.get("fault-test")["status"], "completed")

    async def test_required_specialist_timeout_escalates_without_effect(self):
        events, intents = await self.collect(faults={"subAgentTimeout": True, "llmDown": True})
        self.assertEqual(intents, [])
        self.assertIn("ESCALATED", [item.get("state") for item in events])
        results = [item["payload"] for item in events if item.get("title") == "log findings"]
        self.assertEqual(results[0]["status"], "unavailable")
        self.assertEqual(results[0]["provenance"], "unavailable")

    async def test_controller_crash_holds_without_effect_or_replay(self):
        events, intents = await self.collect(faults={"plannerCrash": True, "llmDown": True})
        self.assertEqual(intents, [])
        self.assertIn("SAFE_HOLD", [item.get("state") for item in events])
        self.assertEqual(self.store.get("fault-test")["status"], "safe_hold")
        self.assertIsNone(self.store.claim_next("replacement-worker"))

    async def test_unsafe_policy_proposal_is_downgraded_before_execution(self):
        events, intents = await self.collect(faults={"policyConflict": True, "llmDown": True}, scenario="high")
        recommendations = [item["payload"] for item in events if item.get("title") == "Response recommendation"]
        self.assertEqual(recommendations[0]["action"], "device_isolate(600s)")
        self.assertEqual(len(intents), 1)
        self.assertNotEqual(intents[0]["action"], recommendations[0]["action"])
        self.assert_bounded_stub_effect(intents)

    async def test_llm_outage_preserves_rule_pipeline_and_unvalidated_outcome(self):
        events, intents = await self.collect(faults={"llmDown": True})
        recommendation = next(item["payload"] for item in events if item.get("title") == "Response recommendation")
        self.assertEqual(recommendation["selector"], "deterministic_table")
        self.assertEqual(len(intents), 1)
        self.assert_bounded_stub_effect(intents)

    async def test_cancel_before_capture_applies_no_effect(self):
        events, intents = await self.collect(cancel_state="CAPTURED")
        self.assertEqual(intents, [])
        self.assertIn("CANCELLED", [item.get("state") for item in events])
        self.assertEqual(self.store.get("fault-test")["status"], "cancelled")

    async def test_cancel_after_confirmed_effect_persists_compensation(self):
        events, intents = await self.collect(cancel_state="EXECUTED")
        self.assertEqual(intents[0]["status"], "applied_to_stub")
        self.assertEqual(intents[0]["rollback_status"], "rolled_back")
        self.assertTrue(any(item.get("title") == "Rollback receipt" for item in events))
        self.assertIn("CANCELLED", [item.get("state") for item in events])
        self.assertEqual(self.store.get("fault-test")["status"], "cancelled")

    async def test_cancel_during_acknowledgement_compensates_confirmed_effect(self):
        events, intents = await self.collect(cancel_during_ack=True)
        self.assertEqual(intents[0]["status"], "applied_to_stub")
        self.assertEqual(intents[0]["rollback_status"], "rolled_back")
        self.assertTrue(any(item.get("title") == "Rollback receipt" for item in events))
        self.assertNotIn("EXECUTED", [item.get("state") for item in events])
        self.assertIn("CANCELLED", [item.get("state") for item in events])
