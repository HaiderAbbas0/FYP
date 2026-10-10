import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from starlette.requests import Request

from app.auth import AuthManager, Principal
from app.evaluation import run_paired
from app.run_store import RunStore


class SessionTests(unittest.TestCase):
    def test_logout_revocation_is_shared_across_api_instances(self):
        with tempfile.TemporaryDirectory() as directory:
            store = RunStore(Path(directory) / 'runs.db')
            config = {'IDS_SESSION_SECRET': 'test-signing-secret-32-characters',
                      'IDS_AUTH_DEV_LOCALHOST': 'false',
                      'IDS_API_KEYS_JSON': json.dumps({'admin': {'sha256': '0' * 64, 'role': 'admin'}})}
            with patch.dict('os.environ', config):
                first = AuthManager(store.session_revoked, store.revoke_session)
                second = AuthManager(store.session_revoked, store.revoke_session)
            token = first.create_session(Principal('admin', 'admin'))
            request = Request({'type': 'http', 'method': 'GET', 'scheme': 'http', 'path': '/api/runs',
                               'headers': [(b'cookie', ('ids_session=' + token).encode())],
                               'client': ('127.0.0.1', 1), 'server': ('localhost', 80), 'query_string': b''})
            self.assertEqual(second.authenticate(request).role, 'admin')
            first.revoke_session(token)
            with self.assertRaises(HTTPException) as caught:
                second.authenticate(request)
            self.assertEqual(caught.exception.status_code, 401)


class ExperimentTests(unittest.IsolatedAsyncioTestCase):
    async def test_manifest_is_saved_before_any_execution(self):
        calls = []
        async def save(manifest):
            calls.append(('manifest', manifest['manifest_hash']))
        async def execute(case, profile, seed):
            self.assertEqual(calls[0][0], 'manifest')
            calls.append(('run', profile))
            return [{'type': 'run.start', 'ts': 0}, {'type': 'run.end', 'ts': 1, 'outcome': 'UNVALIDATED'}]
        report = await run_paired([{'source_mode': 'fixture'}], execute, model={}, config={},
                                  case_snapshot=[], on_manifest=save)
        self.assertEqual(len(report['runs']), 3)
        self.assertEqual(calls[0][1], report['manifest']['manifest_hash'])
