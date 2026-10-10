"""Execution boundary for the isolated PoC gateway stub.

This adapter never sends firewall or network commands. It validates the action
again, restricts the target to the registered lab devices, and only changes the
in-process gateway stub so the independent monitor can observe simulated
recovery. A real lab executor must implement this port separately.
"""

from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass
from typing import Protocol

from .action_catalog import parse_action
from .config import settings
from .incidents import DEVICES
from .monitor import GATEWAY
from .run_store import RUNS, RunStore


class ExecutionRejected(Exception):
    """Raised when a policy-approved action fails executor-side validation."""


@dataclass(frozen=True)
class ActionReceipt:
    run_id: str
    idempotency_key: str
    target_id: str
    action: str
    status: str
    mode: str
    simulated: bool
    applied_at_epoch: float
    note: str
    policy_hash: str | None = None

    def to_json(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class RollbackReceipt:
    run_id: str
    idempotency_key: str
    target_id: str
    status: str
    mode: str
    rolled_back_at_epoch: float
    note: str

    def to_json(self) -> dict:
        return asdict(self)


class Executor(Protocol):
    async def execute(self, run_id: str, target_id: str, action: str) -> ActionReceipt: ...
    async def rollback(self, run_id: str, idempotency_key: str, target_id: str) -> RollbackReceipt: ...


class StubExecutor:
    """Idempotent in-process executor for the current simulated gateway."""

    def __init__(self, store: RunStore = RUNS) -> None:
        self.store = store

    async def execute(self, run_id: str, target_id: str, action: str) -> ActionReceipt:
        parsed = parse_action(action)
        if parsed is None:
            raise ExecutionRejected("action does not match the canonical action catalog")
        action_name, duration_s = parsed
        if action_name == "alert_escalate":
            raise ExecutionRejected("alert escalation is not an actuator action")
        if not 1 <= duration_s <= settings.max_unattended_action_s:
            raise ExecutionRejected("action duration is outside the unattended policy limit")
        if target_id not in DEVICES:
            raise ExecutionRejected("target is not registered in the isolated PoC lab")

        idempotency_key = f"{run_id}:containment:1"
        try:
            owns_intent, intent = self.store.begin_action_intent(run_id, idempotency_key, target_id, action)
        except ValueError as exc:
            raise ExecutionRejected(str(exc)) from exc
        if not owns_intent:
            if intent["status"] == "applied_to_stub" and intent.get("receipt_json"):
                return ActionReceipt(**json.loads(intent["receipt_json"]))
            raise ExecutionRejected(
                f"action intent is {intent['status']}; refusing to repeat an unconfirmed effect"
            )

        # The simulator models service recovery, not the efficacy of each
        # network control. Outcome remains UNVALIDATED without a traffic counter.
        GATEWAY.mark_contained()
        receipt = ActionReceipt(
            run_id=run_id,
            idempotency_key=idempotency_key,
            target_id=target_id,
            action=action,
            status="applied_to_stub",
            mode="gateway_stub",
            simulated=True,
            applied_at_epoch=time.time(),
            note="Simulated gateway state transition; no firewall or network command was sent.",
        )
        self.store.complete_action_intent(run_id, idempotency_key, receipt.status, receipt.to_json())
        return receipt

    async def rollback(self, run_id: str, idempotency_key: str, target_id: str) -> RollbackReceipt:
        try:
            owns_rollback, intent = self.store.begin_rollback(run_id, idempotency_key)
        except ValueError as exc:
            raise ExecutionRejected(str(exc)) from exc
        if intent["target_id"] != target_id:
            raise ExecutionRejected("rollback target does not match the action intent")
        if not owns_rollback:
            if intent.get("rollback_status") == "rolled_back" and intent.get("rollback_json"):
                return RollbackReceipt(**json.loads(intent["rollback_json"]))
            raise ExecutionRejected(
                f"rollback status is {intent.get('rollback_status')}; refusing to repeat an unconfirmed rollback"
            )

        GATEWAY.mark_containment_rolled_back()
        receipt = RollbackReceipt(
            run_id=run_id,
            idempotency_key=idempotency_key,
            target_id=target_id,
            status="rolled_back_in_stub",
            mode="gateway_stub",
            rolled_back_at_epoch=time.time(),
            note="Simulated rollback restored the pre-containment gateway state; no network command was sent.",
        )
        self.store.complete_rollback(run_id, idempotency_key, receipt.to_json())
        return receipt


STUB_EXECUTOR = StubExecutor()
