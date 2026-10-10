import asyncio
import unittest
from unittest.mock import patch
from app.llm import LLMClient


class BudgetTests(unittest.IsolatedAsyncioTestCase):
    async def test_whole_chain_timeout_returns_fallback(self):
        client = LLMClient(force_unavailable=True)
        cancelled = asyncio.Event()
        async def stalled(*args, **kwargs):
            try:
                await asyncio.sleep(30)
            finally:
                cancelled.set()
        with patch.object(client, '_complete_json', stalled), patch.dict('os.environ', {'LLM_TOTAL_BUDGET_S': '1'}):
            self.assertIsNone(await client.complete_json('system', 'input'))
        self.assertTrue(cancelled.is_set())
        self.assertIn('deadline', client.last_error)

    async def test_oversized_prompt_has_no_network_attempt(self):
        client = LLMClient(force_unavailable=True)
        self.assertIsNone(await client.complete_json('system', 'x' * 128001))
        self.assertEqual(client.calls, 0)

    async def test_cancellation_propagates(self):
        client = LLMClient(force_unavailable=True)
        async def stalled(*args, **kwargs):
            await asyncio.sleep(30)
        with patch.object(client, '_complete_json', stalled):
            task = asyncio.create_task(client.complete_json('system', 'input'))
            await asyncio.sleep(.01)
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await task
