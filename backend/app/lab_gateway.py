"""Bounded isolated-lab HTTP actuator; ambiguous effects require reconciliation.

Gateway contract: POST /actions, GET /receipts/{key}, POST /rollbacks,
GET /rollback-receipts/{key}, GET /counters/{target}. The gateway must persist
idempotency keys, enforce expires_at, and automatically undo expired controls.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import math
import os
import time
from urllib.parse import quote, urlsplit

import httpx

from .action_catalog import parse_action
from .executor import ActionReceipt, ExecutionRejected, RollbackReceipt
from .outcomes import CounterSample
from .schemas import PolicyDecision, PolicyVerdict
from .run_store import RUNS, RunStore


class HttpLabExecutor:
    def __init__(self, *, base_url: str | None = None, token: str | None = None,
                 targets: set[str] | None = None, store: RunStore = RUNS,
                 transport: httpx.AsyncBaseTransport | None = None) -> None:
        self.base_url = (base_url or os.getenv("IDS_LAB_GATEWAY_URL", "")).rstrip("/")
        parsed = urlsplit(self.base_url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
            raise ValueError("A fixed HTTP(S) gateway base URL without credentials is required")
        self.token = token or os.getenv("IDS_LAB_GATEWAY_TOKEN", "")
        if not self.token:
            raise ValueError("IDS_LAB_GATEWAY_TOKEN is required")
        self.targets = targets if targets is not None else set(json.loads(os.getenv("IDS_LAB_TARGETS_JSON", "[]")))
        if not self.targets or any(not isinstance(target, str) or not target for target in self.targets):
            raise ValueError("Register isolated lab target IDs in IDS_LAB_TARGETS_JSON")
        self.sensor_id = os.getenv("IDS_LAB_SENSOR_ID", "independent-lab-sensor")
        self.max_duration_s = min(300, max(1, int(os.getenv("IDS_LAB_MAX_ACTION_S", "60"))))
        self.store = store
        self.transport = transport
        self._lock = asyncio.Lock()
        self._authorizations: dict[str, dict] = {}

    def authorize(self, run_id: str, target_id: str, action: str,
                  policy_decision: PolicyDecision, expires_at: float | None = None) -> None:
        """Bind the exact action and target to this controller's policy decision."""
        parsed = parse_action(action)
        if (policy_decision.verdict not in {PolicyVerdict.PASS, PolicyVerdict.DOWNGRADE}
                or policy_decision.executed_action != action or not policy_decision.checks
                or parsed is None or parsed[0] == "alert_escalate"
                or not 1 <= parsed[1] <= self.max_duration_s or target_id not in self.targets):
            raise ExecutionRejected("Live actuator requires an exact bounded policy authorization and registered target")
        # DOWNGRADE may include failed checks for the original proposal; the
        # controller must pass the actual bounded executed_action shown above.
        if policy_decision.verdict == PolicyVerdict.PASS and any(check.result != "PASS" for check in policy_decision.checks):
            raise ExecutionRejected("PASS decision contains failed policy checks")
        now = time.time()
        expiry = expires_at if expires_at is not None else now + 15
        if not now < expiry <= now + 30:
            raise ExecutionRejected("Policy authorization must expire within thirty seconds")
        payload = policy_decision.model_dump(mode="json")
        self._authorizations[run_id] = {"target": target_id, "action": action, "expires": expiry,
                                       "policy_hash": hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()}

    async def _request(self, method: str, path: str, payload: dict | None = None) -> dict:
        async with httpx.AsyncClient(base_url=self.base_url + "/", timeout=3,
                                     follow_redirects=False, transport=self.transport,
                                     headers={"Authorization": f"Bearer {self.token}"}) as client:
            response = await client.request(method, path.lstrip("/"), json=payload)
            response.raise_for_status()
            if len(response.content) > 65536:
                raise ValueError("Gateway response exceeds receipt limit")
            result = response.json()
            if not isinstance(result, dict):
                raise ValueError("Gateway response is not an object")
            return result

    def _row(self, key: str, run_id: str) -> dict:
        row = next((item for item in self.store.action_intents(run_id) if item["idempotency_key"] == key), None)
        if row is None:
            raise ExecutionRejected("Unknown action intent")
        return {**row, "key": key, "target": row["target_id"],
                "policy_hash": (row.get("receipt") or {}).get("policy_hash")}

    async def execute(self, run_id: str, target_id: str, action: str) -> ActionReceipt:
        key = f"{run_id}:containment:1"
        async with self._lock:
            auth = self._authorizations.pop(run_id, None)
            if not auth or auth["target"] != target_id or auth["action"] != action or auth["expires"] <= time.time():
                raise ExecutionRejected("Missing or expired exact policy authorization")
            try:
                inserted, _ = self.store.begin_action_intent(run_id, key, target_id, action)
            except ValueError as exc:
                raise ExecutionRejected(str(exc)) from exc
            row = self._row(key, run_id)
            if row["target"] != target_id or row["action"] != action:
                raise ExecutionRejected("Idempotency key target/action mismatch")
            if not inserted:
                return await self.reconcile(run_id, key)
            self.store.complete_action_intent(run_id, key, "pending", {"policy_hash": auth["policy_hash"]})
            row["policy_hash"] = auth["policy_hash"]
            parsed = parse_action(action)
            assert parsed is not None
            payload = {"run_id": run_id, "idempotency_key": key, "target_id": target_id,
                       "action": action, "action_name": parsed[0], "duration_s": parsed[1],
                       "expires_at": time.time() + parsed[1], "authorization_expires_at": auth["expires"],
                       "policy_hash": auth["policy_hash"], "reversible": True}
            try:
                raw = await self._request("POST", "actions", payload)
                return self._save_action(row, raw)
            except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
                self.store.complete_action_intent(run_id, key, "unknown", {"note": "Gateway effect could not be confirmed", "policy_hash": auth["policy_hash"]})
                raise ExecutionRejected("Gateway action state is unknown; reconcile receipt before further action") from exc

    def _save_action(self, row: dict, raw: dict) -> ActionReceipt:
        for field, value in (("run_id", row["run_id"]), ("idempotency_key", row["key"]),
                             ("target_id", row["target"]), ("action", row["action"])):
            if raw.get(field) != value:
                raise ValueError("Gateway receipt does not match bound action intent")
        if row.get("policy_hash") and raw.get("policy_hash") != row["policy_hash"]:
            raise ValueError("Gateway receipt policy authorization mismatch")
        if raw.get("status") != "applied" or raw.get("simulated") is not False:
            raise ValueError("Gateway did not confirm a real applied action")
        applied = float(raw["applied_at_epoch"])
        if not 0 < applied <= time.time() + 5:
            raise ValueError("Invalid gateway action timestamp")
        receipt = ActionReceipt(row["run_id"], row["key"], row["target"], row["action"],
                                "applied", "http_lab", False, applied,
                                "Gateway confirmed policy-bound expiring isolated-lab action",
                                policy_hash=raw.get('policy_hash'))
        if row['status'] in {'pending', 'unknown'}:
            self.store.complete_action_intent(row["run_id"], row["key"], "applied",
                                              {**receipt.to_json(), "policy_hash": raw.get("policy_hash")})
        return receipt

    async def reconcile(self, run_id: str, idempotency_key: str) -> ActionReceipt:
        """Read existing receipt only; never resend an ambiguous command."""
        row = self._row(idempotency_key, run_id)
        if row["run_id"] != run_id:
            raise ExecutionRejected("Receipt run mismatch")
        try:
            raw = await self._request("GET", "receipts/" + quote(idempotency_key, safe=""))
            if raw.get('current_status', raw.get('status')) != 'applied' or raw.get('expires_at', time.time() + 1) <= time.time():
                raise ValueError('Gateway action is expired or no longer active')
            return self._save_action(row, raw)
        except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
            raise ExecutionRejected("Gateway action remains unknown; manual review required") from exc

    async def inspect(self, run_id: str, idempotency_key: str) -> dict:
        """Inspect both durable gateway receipts; perform no external mutation."""
        async with self._lock:
            row = self._row(idempotency_key, run_id)
            observed = {}
            errors = []
            for label, path in (('action', 'receipts/'), ('rollback', 'rollback-receipts/')):
                try:
                    observed[label] = await self._request('GET', path + quote(idempotency_key, safe=''))
                except (httpx.HTTPError, ValueError, TypeError) as exc:
                    errors.append(type(exc).__name__)
            try:
                action = observed.get('action')
                if action:
                    for field, expected in (('run_id', run_id), ('idempotency_key', idempotency_key),
                                             ('target_id', row['target']), ('action', row['action']),
                                             ('policy_hash', row.get('policy_hash'))):
                        if not expected or action.get(field) != expected:
                            raise ValueError('Action receipt binding mismatch')
                rollback = observed.get('rollback')
                if rollback:
                    for field, expected in (('run_id', run_id), ('idempotency_key', idempotency_key),
                                             ('target_id', row['target']), ('action', row['action']),
                                             ('policy_hash', row.get('policy_hash')), ('status', 'rolled_back')):
                        if not expected or rollback.get(field) != expected:
                            raise ValueError('Rollback receipt binding mismatch')
                    rolled_back = float(rollback['rolled_back_at_epoch'])
                    if not math.isfinite(rolled_back) or not 0 < rolled_back <= time.time() + 5:
                        raise ValueError('Invalid rollback receipt timestamp')
                    receipt = RollbackReceipt(run_id, idempotency_key, row['target'], 'rolled_back',
                                              'http_lab', rolled_back, 'Gateway rollback confirmed by read-only inspection')
                    self.store.record_reconciled_rollback(run_id, idempotency_key,
                                                         {**rollback, **receipt.to_json()})
                    return {'status': 'rolled_back', 'rollback_receipt': receipt.to_json(), 'run_resumed': False}
                if action and action.get('current_status', action.get('status')) == 'applied' and action.get('expires_at', time.time() + 1) > time.time():
                    receipt = self._save_action(row, action)
                    return {'status': 'applied', 'action_receipt': receipt.to_json(), 'run_resumed': False}
            except (ValueError, TypeError, KeyError) as exc:
                raise ExecutionRejected('Gateway inspection receipt failed binding validation') from exc
            return {'status': 'unknown', 'run_resumed': False,
                    'note': 'No confirmed current effect or rollback; target remains held', 'errors': errors}

    async def rollback(self, run_id: str, idempotency_key: str, target_id: str) -> RollbackReceipt:
        async with self._lock:
            row = self._row(idempotency_key, run_id)
            if row["run_id"] != run_id or row["target"] != target_id or row["status"] != "applied":
                raise ExecutionRejected("Rollback requires a confirmed matching action")
            if row["rollback_status"] == "rolled_back":
                return RollbackReceipt(**row["rollback_receipt"])
            try:
                owns_rollback, _ = self.store.begin_rollback(run_id, idempotency_key)
            except ValueError as exc:
                raise ExecutionRejected(str(exc)) from exc
            pending = not owns_rollback
            try:
                raw = await self._request("GET" if pending else "POST",
                                          "rollback-receipts/" + quote(idempotency_key, safe="") if pending else "rollbacks",
                                          None if pending else {"run_id": run_id, "idempotency_key": idempotency_key, "target_id": target_id})
                if any(raw.get(field) != expected for field, expected in
                       (("run_id", run_id), ("idempotency_key", idempotency_key), ("target_id", target_id), ("status", "rolled_back"))):
                    raise ValueError("Rollback receipt mismatch")
                receipt = RollbackReceipt(run_id, idempotency_key, target_id, "rolled_back", "http_lab",
                                          float(raw["rolled_back_at_epoch"]), "Gateway confirmed rollback")
                self.store.complete_rollback(run_id, idempotency_key, receipt.to_json())
                return receipt
            except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
                raise ExecutionRejected("Rollback state unknown; reconcile before retry") from exc

    async def counters(self, target_id: str) -> CounterSample:
        if target_id not in self.targets:
            raise ExecutionRejected("Unregistered telemetry target")
        raw = await self._request("GET", "counters/" + quote(target_id, safe=""))
        sample = CounterSample.model_validate(raw)
        if sample.target_id != target_id or sample.sensor_id != self.sensor_id or sample.provenance != "live_lab":
            raise ExecutionRejected("Telemetry target, sensor or provenance mismatch")
        if abs(time.time() - sample.timestamp) > 10:
            raise ExecutionRejected("Stale or future telemetry sample")
        return sample
