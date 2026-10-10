"""Opt-in real-provider and local-detector validation; uses isolated runtime state.

Run explicitly from backend: .venv/Scripts/python tests/live_validation.py
Never prints credentials. Runtime actions use the stub executor.
"""
import os
os.environ.setdefault('OMP_NUM_THREADS', '1')
import asyncio
import hashlib
import json
import logging
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import tempfile
import time

import httpx
import joblib
import numpy as np
import pandas as pd
from app.config import settings
from app.llm import LLMClient, _extract_json
from app.run_store import RunStore

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'docs' / 'haider' / 'live-validation'

async def providers():
    results = []
    for provider in settings.llm.active:
        started = time.perf_counter()
        try:
            text = await asyncio.wait_for(LLMClient()._request(provider, provider.keys[0],
                'Return JSON only: {"ok":true}.', 'Connectivity check. Return the requested JSON.', 160), timeout=40)
            result = {'provider': provider.name, 'model': provider.model,
                      'success': _extract_json(text) == {'ok': True}}
        except httpx.HTTPStatusError as exc:
            result = {'provider': provider.name, 'model': provider.model, 'success': False,
                      'http_status': exc.response.status_code}
        except Exception as exc:
            result = {'provider': provider.name, 'model': provider.model, 'success': False,
                      'error_type': type(exc).__name__}
        result['latency_ms'] = round((time.perf_counter() - started) * 1000, 1)
        results.append(result)
        print(json.dumps(result), flush=True)
    return results

def detector():
    bundle = joblib.load(ROOT / 'agents/detector/artifacts/multiclass/detector_bundle.joblib')
    model = bundle['calibrator']
    records = []
    for label, path in [('Benign', ROOT / 'data/Benign_test.pcap.csv'),
                        ('DoS-TCP', ROOT / 'data/detector/TCP_IP-DoS-TCP_test.pcap.csv')]:
        rows = pd.read_csv(path, nrows=256)
        missing = set(bundle['features']) - set(rows.columns)
        if missing:
            raise ValueError('Capture missing model features')
        features = bundle['pipeline'].named_steps['prep'].transform(rows)
        started = time.perf_counter()
        probability = model.predict_proba(features)
        elapsed = time.perf_counter() - started
        assert probability.shape == (len(rows), len(bundle['classes']))
        assert np.isfinite(probability).all() and np.allclose(probability.sum(axis=1), 1)
        prediction = np.asarray(bundle['classes'])[probability.argmax(axis=1)]
        attack_index = bundle['eval_levels']['binary']['names'].index('Attack')
        attack_p = (probability @ np.asarray(bundle['eval_levels']['binary']['matrix']))[:, attack_index]
        variants, counts = np.unique(prediction, return_counts=True)
        records.append({'capture_label': label, 'rows': len(rows),
            'predictions': dict(zip(variants.tolist(), counts.tolist())),
            'mean_attack_probability': float(attack_p.mean()),
            'sample_variant_accuracy': float((prediction == label).mean()),
            'batch_inference_ms': round(elapsed * 1000, 2)})
    result = {'loaded': True, 'model': bundle['model_name'], 'model_version': bundle['config_hash'],
              'class_count': len(bundle['classes']), 'feature_count': len(bundle['features']),
              'active_in_runtime': False, 'samples': records,
              'scope': 'First 256 rows of two local captures; not a full dataset evaluation'}
    print(json.dumps(result), flush=True)
    return result

def runtime():
    with tempfile.TemporaryDirectory(prefix='iomt-live-validation-') as directory:
        folder = Path(directory)
        key = secrets.token_hex(32)
        database = folder / 'runs.sqlite3'
        env = {**os.environ, 'IDS_SQLITE_PATH': str(database), 'DATABASE_URL': '',
               'IDS_API_KEYS_JSON': json.dumps({'validation': {'sha256': hashlib.sha256(key.encode()).hexdigest(), 'role': 'admin'}}),
               'IDS_SESSION_SECRET': secrets.token_hex(32), 'IDS_AUTH_DEV_LOCALHOST': 'false',
               'IDS_EMBEDDED_WORKER': 'false', 'SPECIALIST_EXECUTION': 'process',
               'SPECIALIST_TIMEOUT_S': '8', 'ENABLE_VERIFIED_REUSE': 'false'}
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        url = f'http://127.0.0.1:{port}'
        env['GATEWAY_HEALTH_URL'] = url + '/gateway/health'
        processes = []
        records = []
        with open(folder / 'api.log', 'w') as api_log, open(folder / 'worker.log', 'w') as worker_log:
            try:
                processes.append(subprocess.Popen([sys.executable, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', str(port)], cwd=ROOT / 'backend', env=env, stdout=api_log, stderr=api_log))
                for _ in range(160):
                    try:
                        if httpx.get(url + '/api/ready', timeout=1).status_code == 200:
                            break
                    except httpx.HTTPError:
                        pass
                    time.sleep(.25)
                else:
                    raise RuntimeError('API readiness failed')
                processes.append(subprocess.Popen([sys.executable, 'worker.py'], cwd=ROOT / 'backend', env=env, stdout=worker_log, stderr=worker_log))
                store = RunStore(database)
                with httpx.Client(base_url=url, headers={'Authorization': f'Bearer {key}'}, timeout=15) as client:
                    for scenario in ('low', 'medium', 'high'):
                        start = time.perf_counter()
                        response = client.post('/api/runs', json={'scenario': scenario, 'source_mode': 'capture_replay', 'speed': 20})
                        response.raise_for_status()
                        run_id = response.json()['run_id']
                        for _ in range(400):
                            run = client.get('/api/runs/' + run_id).json()
                            if run['status'] in ('completed', 'failed', 'cancelled', 'interrupted', 'safe_hold', 'escalated'):
                                break
                            time.sleep(.5)
                        else:
                            raise RuntimeError('Runtime validation deadline exceeded')
                        journal = store.events_after(run_id, 0)
                        # RunStore returns payloads under event; accept its current persisted envelope.
                        events = [row.get('event', row.get('payload', row)) for row in journal]
                        artifacts = {event.get('node'): event.get('payload') for event in events if event.get('type') == 'artifact'}
                        end = next((event for event in reversed(events) if event.get('type') == 'run.end'), {})
                        result = {'scenario': scenario, 'status': run['status'], 'event_count': len(journal),
                                  'sequence_contiguous': [row['sequence'] for row in journal] == list(range(1, len(journal)+1)),
                                  'elapsed_s': round(time.perf_counter()-start, 2),
                                  'outcome': end.get('outcome'),
                                  'investigator_source': (artifacts.get('investigator') or {}).get('confidence_source'),
                                  'explainer_source': (artifacts.get('explainer') or {}).get('generated_by'),
                                  'response_source': (artifacts.get('response') or {}).get('selector'),
                                  'fallbacks': [e.get('trigger') for e in events if e.get('type') == 'fallback'],
                                  'states': [e['state'] for e in events if e.get('type') == 'state'],
                                  'executor': 'stub', 'detector': 'legacy RF capture replay'}
                        assert result['status'] == 'completed', 'Runtime did not complete'
                        assert result['sequence_contiguous'], 'Persisted events have a sequence gap'
                        assert result['outcome'] == 'UNVALIDATED', 'Stub run cannot establish a validated outcome'
                        assert result['investigator_source'] == 'llm+rules', 'Investigator fell back instead of using live reasoning'
                        assert result['explainer_source'] == 'llm', 'Explainer fell back instead of using live reasoning'
                        assert result['response_source'] == 'llm_recommendation', 'Response fell back instead of using live reasoning'
                        records.append(result)
                        print(json.dumps(result), flush=True)
                    health = client.get('/api/health').json()
                    return {'runs': records, 'api_process_health': health,
                            'health_scope': 'LLM counters belong to the API process; agent calls occurred in the dedicated worker.',
                            'persisted_case_count': len(store.load_cases())}
            finally:
                for process in reversed(processes):
                    if os.name == 'nt':
                        subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15)
                    else:
                        process.terminate()
                for process in processes:
                    try:
                        process.wait(timeout=15)
                    except subprocess.TimeoutExpired:
                        process.kill()

if __name__ == '__main__':
    logging.getLogger('httpx').setLevel(logging.WARNING)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    report = {'providers': asyncio.run(providers()), 'multiclass_detector': detector()}
    (OUTPUT / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    report['runtime'] = runtime()
    (OUTPUT / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
