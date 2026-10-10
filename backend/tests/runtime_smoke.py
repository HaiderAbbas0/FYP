"""Opt-in socket/API/dedicated-process evaluation smoke; no external LLM/lab effects."""
import hashlib
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import tempfile
import time

import httpx


def main():
    root = Path(__file__).resolve().parents[1]
    with tempfile.TemporaryDirectory(prefix='iomt-runtime-') as directory:
        key = secrets.token_hex(32)
        env = {**os.environ, 'IDS_SQLITE_PATH': str(Path(directory) / 'runtime.db'), 'DATABASE_URL': '',
               'IDS_API_KEYS_JSON': json.dumps({'smoke': {'sha256': hashlib.sha256(key.encode()).hexdigest(), 'role': 'admin'}}),
               'IDS_SESSION_SECRET': secrets.token_hex(32), 'IDS_AUTH_DEV_LOCALHOST': 'false',
               'IDS_EMBEDDED_WORKER': 'false', 'LLM_PROVIDER_CHAIN': '', 'SPECIALIST_EXECUTION': 'process',
               'SPECIALIST_TIMEOUT_S': '8', 'IDS_API_KEY': key, 'ENABLE_VERIFIED_REUSE': 'false'}
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        url = f'http://127.0.0.1:{port}'
        processes = []
        with open(Path(directory) / 'api.log', 'w') as api_log, open(Path(directory) / 'worker.log', 'w') as worker_log:
            try:
                processes.append(subprocess.Popen([sys.executable, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', str(port)], cwd=root, env=env, stdout=api_log, stderr=api_log))
                for _ in range(120):
                    try:
                        if httpx.get(url + '/api/ready', timeout=1).status_code == 200:
                            break
                    except httpx.HTTPError:
                        pass
                    time.sleep(.25)
                else:
                    raise RuntimeError('API did not become ready')
                processes.append(subprocess.Popen([sys.executable, 'worker.py'], cwd=root, env=env, stdout=worker_log, stderr=worker_log))
                output = root.parent / 'docs' / 'haider' / 'evaluation-smoke'
                result = subprocess.run([sys.executable, 'evaluate.py', '--url', url, '--output', str(output), '--speed', '20'], cwd=root, env=env, timeout=600)
                if result.returncode:
                    raise RuntimeError(f'Evaluation CLI failed ({result.returncode})')
                report = json.loads((output / 'report.json').read_text())
                assert len(report['runs']) == 45
                assert all(r['complete'] and r['outcome'] == 'UNVALIDATED' for r in report['runs'])
                assert not any(r['real_validated_success'] for r in report['runs'])
                with httpx.Client(base_url=url, headers={'Authorization': f'Bearer {key}'}, timeout=10) as client:
                    assert client.get('/api/memory/cases').status_code == 200
                    assert len(client.get('/api/runs').json()['runs']) == 45
                    session = client.post('/api/auth/session')
                    assert session.status_code == 200
                    client.headers.pop('Authorization')
                    assert client.get('/api/runs').status_code == 200
                    token = client.cookies.get('ids_session')
                    assert client.delete('/api/auth/session').status_code == 200
                    client.cookies.set('ids_session', token)
                    assert client.get('/api/runs').status_code == 401
                print('PASS: 45 persisted paired runs via separate API/worker processes; signed-session logout revocation verified')
            finally:
                for process in reversed(processes):
                    if os.name == 'nt':
                        # The Windows venv launcher has a Python child; stop the owned tree.
                        subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'],
                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15)
                    else:
                        process.terminate()
                for process in processes:
                    try:
                        process.wait(timeout=15)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait(timeout=5)


if __name__ == '__main__':
    main()
