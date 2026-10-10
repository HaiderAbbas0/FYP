"""Process resource attribution and frozen evidence snapshot preservation."""
import os
import unittest
from unittest.mock import patch

from app.schemas import DetectorEvent
from app.specialists import run_specialists
from app.worker_runtime import process_specialist

EVENT = dict(incident_id='test', attack_family='DoS', attack_subtype='flood', confidence=.99,
             device_id='gateway', device_type='telemetry-hub', device_criticality='Critical',
             src_ip='192.0.2.1', dst_ip='192.0.2.2', packets_per_sec=10000)


class ResourceTests(unittest.IsolatedAsyncioTestCase):
    async def test_disposable_child_reports_cpu_and_peak_process_memory(self):
        result = await process_specialist('device', EVENT, {})
        usage = result.findings['_resource_usage']
        self.assertEqual(usage['scope'], 'specialist_process')
        self.assertTrue(usage['includes_startup'])
        if usage['measured']:
            self.assertGreater(usage['cpu_ms'], 0)
            self.assertGreater(usage['peak_rss_bytes'], 0)
        else:
            self.assertIsNone(usage['cpu_ms'])
            self.assertIsNone(usage['peak_rss_bytes'])

    async def test_inprocess_has_no_child_metrics_and_preserves_frozen_history(self):
        with patch.dict(os.environ, {'SPECIALIST_EXECUTION': 'inprocess'}):
            with patch('app.memory.MemoryAgent', side_effect=AssertionError('global memory reload')):
                result = (await run_specialists(DetectorEvent.model_validate(EVENT), ['history'],
                                               {'_history_snapshot': []}))[0]
        self.assertEqual(result.status, 'ok')
        self.assertEqual(result.findings['prior_cases_this_device_class'], 0)
        self.assertNotIn('_resource_usage', result.findings)


if __name__ == '__main__':
    unittest.main()
