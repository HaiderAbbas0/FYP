"""Failure-boundary checks for disposable workers and leased scheduling."""
import asyncio
import multiprocessing
import time
import unittest

from app.worker_runtime import RunWorkerService, process_specialist
from app.schemas import DetectorEvent
from app.specialists import _timed, traffic_analysis, log_analysis


EVENT = dict(incident_id="test", attack_family="DoS", attack_subtype="flood", confidence=.99,
             device_id="gateway", device_type="telemetry-hub", device_criticality="Critical",
             src_ip="192.0.2.1", dst_ip="192.0.2.2", packets_per_sec=10_000)


class FakeStore:
    def __init__(self):
        self.record = {"run_id": "r1", "status": "queued", "cancel_requested": False}
        self.claims = 0
        self.heartbeats = 0

    def interrupt_expired(self):
        pass

    def claim_next(self, worker_id, lease_s):
        if self.record["status"] != "queued":
            return None
        self.record["status"] = "running"
        self.claims += 1
        return self.record.copy()

    def heartbeat(self, run_id, worker_id, lease_s):
        self.heartbeats += 1
        return self.record["status"] == "running"

    def get(self, run_id):
        return self.record.copy()

    def set_status(self, run_id, status, error=None):
        self.record.update(status=status, error=error)


class WorkerTests(unittest.IsolatedAsyncioTestCase):
    async def test_missing_capture_measurements_are_unavailable(self):
        event = DetectorEvent.model_validate(EVENT)
        for worker in (traffic_analysis, log_analysis):
            result = await worker(event, {})
            self.assertEqual(result.status, "unavailable")
            self.assertEqual(result.provenance, "unavailable")

    async def test_fixture_evidence_is_not_labelled_capture(self):
        event = DetectorEvent.model_validate({**EVENT, "detector_source": "synthetic"})
        stats = {"Rate": {"mean": 100}, "Tot size": {"mean": 50}}
        result = await _timed("traffic", lambda: traffic_analysis(event, stats), 1,
                              run_id="test", run_started_at=time.perf_counter(), synthetic=True)
        self.assertEqual(result.provenance, "fixture")
        self.assertEqual(result.findings["provenance"], "fixture")

    async def test_process_returns_registry_evidence(self):
        result = await asyncio.wait_for(process_specialist("device", EVENT, {}), 10)
        self.assertTrue(result.findings["life_critical"])
        self.assertEqual(result.findings["provenance"], "registry")

    async def test_timeout_terminates_stalled_process(self):
        before = {p.pid for p in multiprocessing.active_children()}
        with self.assertRaises(asyncio.TimeoutError):
            await asyncio.wait_for(process_specialist("device", EVENT, {}, True), .2)
        self.assertEqual({p.pid for p in multiprocessing.active_children()}, before)

    async def test_task_cancellation_terminates_stalled_process(self):
        before = {p.pid for p in multiprocessing.active_children()}
        task = asyncio.create_task(process_specialist("device", EVENT, {}, True))
        await asyncio.sleep(.1)
        task.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await task
        self.assertEqual({p.pid for p in multiprocessing.active_children()}, before)

    async def test_durable_cancel_reaches_claimed_run(self):
        store = FakeStore()
        entered = asyncio.Event()

        async def execute(record, cancel):
            entered.set()
            await cancel.wait()
            store.set_status(record["run_id"], "cancelled")

        service = RunWorkerService(store, execute, poll_s=.01, lease_s=.3)
        service.start()
        try:
            await asyncio.wait_for(entered.wait(), 1)
            store.record["cancel_requested"] = True
            for _ in range(100):
                if store.record["status"] == "cancelled":
                    break
                await asyncio.sleep(.01)
            self.assertEqual(store.record["status"], "cancelled")
            self.assertEqual(store.claims, 1)
            self.assertGreater(store.heartbeats, 0)
        finally:
            await service.stop()

    async def test_shutdown_marks_uncooperative_run_interrupted(self):
        store = FakeStore()
        entered = asyncio.Event()

        async def execute(record, cancel):
            entered.set()
            await asyncio.Event().wait()

        service = RunWorkerService(store, execute, poll_s=.01)
        service.start()
        await asyncio.wait_for(entered.wait(), 1)
        await service.stop(grace_s=.01)
        self.assertEqual(store.record["status"], "interrupted")

    async def test_lease_loss_cancels_execution(self):
        store = FakeStore()
        store.heartbeat = lambda *args: False
        cancelled = asyncio.Event()

        async def execute(record, cancel):
            await cancel.wait()
            cancelled.set()
            store.set_status(record["run_id"], "interrupted")

        service = RunWorkerService(store, execute, poll_s=.01)
        service.start()
        try:
            await asyncio.wait_for(cancelled.wait(), 1)
            self.assertEqual(store.record["status"], "interrupted")
        finally:
            await service.stop()

    async def test_slow_repository_does_not_block_event_loop(self):
        store = FakeStore()

        def slow_claim(*args):
            time.sleep(.2)
            return None

        store.claim_next = slow_claim
        service = RunWorkerService(store, lambda *args: None, poll_s=.01)
        service.start()
        started = time.monotonic()
        await asyncio.sleep(.03)
        self.assertLess(time.monotonic() - started, .15)
        await service.stop()


if __name__ == "__main__":
    unittest.main()
