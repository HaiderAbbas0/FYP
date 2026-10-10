"""Independent measured recurrence builds and invalidates shared precedent."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.config import settings
from app.memory import MemoryAgent, _rate_matches
from app.run_store import RunStore
from app.schemas import DetectorEvent


class RecurrenceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = RunStore(Path(self.temp.name) / 'runs.db')
        self.base = json.loads(settings.cases_seed_path.read_text())[0]
        self.base.update(source_mode='live_lab', model_version='detector-v1', policy_version='policy-v1',
                         outcome_version='independent-v1', behavioral_signature='DoS:TCP-flood:syn_count',
                         peak_rate='1k-10k', executed_response='connection_cap(30s)', reliability=.5,
                         evidence_count=1, reuse_count=0)

    def tearDown(self):
        self.temp.cleanup()

    def write(self, n, outcome='SUCCESS', **changes):
        run_id = f'run{n}'
        if not self.store.get(run_id):
            self.store.create(run_id, {'source_mode': 'live_lab'})
            self.store.claim_next(run_id)
            self.store.append(run_id, {'type': 'artifact', 'title': 'Outcome validation',
                                      'payload': {'outcome': outcome, 'validated': True,
                                                  'measurement_source': 'independent_lab'}})
        case = {**self.base, 'case_id': f'case{n}', 'run_id': run_id, 'outcome': outcome, **changes}
        return self.store.write_case(case)

    def test_three_independent_successes_bootstrap_precedent(self):
        self.write(1)
        self.write(2)
        result = self.write(3)
        self.assertEqual(result['aggregation']['independent_successes'], 3)
        for case in self.store.load_cases():
            self.assertEqual(case['evidence_count'], 3)
            self.assertEqual(case['reliability'], .8)
        self.write(3)
        self.assertEqual(len(self.store.load_cases()), 3)
        self.assertEqual(self.store.load_cases()[0]['evidence_count'], 3)

    def test_duplicate_run_and_incompatible_model_do_not_raise_count(self):
        self.write(1)
        self.write(2, run_id='run1')
        self.write(3, model_version='other')
        cases = {case['case_id']: case for case in self.store.load_cases()}
        self.assertEqual(cases['case1']['evidence_count'], 1)
        self.assertEqual(cases['case3']['evidence_count'], 1)

    def test_measured_failure_vetoes_prior_success_group(self):
        for n in range(1, 4):
            self.write(n)
        result = self.write(4, outcome='HARMFUL')
        self.assertEqual(result['aggregation']['independent_successes'], 0)
        self.assertEqual(result['aggregation']['veto_case_ids'], ['case4'])
        for case in self.store.load_cases():
            self.assertEqual(case['evidence_count'], 0)
        self.write(5)
        self.assertEqual(self.store.load_cases()[0]['evidence_count'], 0)

    def test_seed_and_unverified_live_cannot_be_promoted(self):
        self.assertFalse(self.store.write_case({**self.base, 'case_id': 'fake', 'run_id': 'missing', 'outcome': 'SUCCESS'})['stored'])
        seed = {**self.base, 'case_id': 'seed', 'source_mode': 'fixture', 'outcome': 'SUCCESS', 'evidence_count': 99}
        self.store.seed_cases([seed])
        for n in range(1, 4):
            self.write(n)
        case = next(case for case in self.store.load_cases() if case['case_id'] == 'case1')
        self.assertEqual(case['aggregate_case_ids'], ['case1', 'case2', 'case3'])

    def test_outbox_is_drained_on_memory_construction(self):
        self.write(1)
        case = {**self.base, 'case_id': 'queued', 'run_id': 'run1', 'outcome': 'SUCCESS'}
        self.store.queue_case(case)
        with patch('app.run_store.RUNS', self.store):
            memory = MemoryAgent()
        self.assertIn('queued', [case.case_id for case in memory.cases])
        self.assertEqual(self.store.drain_case_outbox(), 0)

    def test_structured_rate_band_matches_without_parsing_as_scalar(self):
        self.assertTrue(_rate_matches(2000, '1k-10k'))
        self.assertFalse(_rate_matches(11000, '1k-10k'))

    def test_ineligible_seed_cache_cannot_mask_measured_precedent(self):
        for n in range(1, 4):
            self.write(n)
        with patch('app.run_store.RUNS', self.store):
            memory = MemoryAgent()
        memory.cache.clear()
        seed = next(case for case in memory.cases if case.source_mode == 'fixture' and case.outcome.value == 'SUCCESS')
        memory.cache.promote(seed, promoted_by='test')
        event = DetectorEvent(incident_id='test', attack_family=self.base['attack_family'],
                              attack_subtype=self.base['attack_subtype'], confidence=.99,
                              device_id='test', device_type=self.base['device_type'],
                              device_criticality=self.base['device_criticality'], src_ip='192.0.2.1',
                              dst_ip='192.0.2.2', packets_per_sec=2000)
        recall = memory.recall(event, self.base['source_cardinality'],
                               eligibility=lambda case: case.source_mode == 'live_lab' and case.evidence_count >= 3)
        _, best = memory.classify(recall['retrieved'])
        self.assertIsNotNone(best)
        self.assertEqual(best.case.source_mode, 'live_lab')
        memory.cache.clear()


if __name__ == '__main__':
    unittest.main()
