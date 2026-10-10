"""Durable, authenticated gateway service for an explicitly enabled lab."""
from __future__ import annotations

import asyncio
import hmac
import json
import os
import re
import sqlite3
import sys
import time
from contextlib import asynccontextmanager
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from app.action_catalog import parse_action
from app.outcomes import CounterSample
from .driver import NftDriver, Target

LIFE_CRITICAL = {"patient-monitor-gateway", "infusion-pump", "ventilator", "telemetry-hub", "pacemaker", "life-support"}


@dataclass(frozen=True)
class GatewayConfig:
    token: str
    targets: dict[str, Target]
    journal_path: Path
    sensor_path: Path
    sensor_id: str
    enabled: bool = False
    max_duration_s: int = 60
    sensor_max_age_s: float = 5
    protected_sources: tuple[str, ...] = ()

    @classmethod
    def environment(cls) -> "GatewayConfig":
        raw = json.loads(os.getenv("IDS_GATEWAY_TARGETS_JSON", "{}"))
        targets = {key: Target(target_id=key, **value) for key, value in raw.items()}
        return cls(token=os.getenv("IDS_GATEWAY_TOKEN", ""), targets=targets,
                   journal_path=Path(os.getenv("IDS_GATEWAY_JOURNAL", "/var/lib/iomt-gateway/actions.sqlite3")),
                   sensor_path=Path(os.getenv("IDS_GATEWAY_SENSOR_JSON", "/sensor/latest.json")),
                   sensor_id=os.getenv("IDS_GATEWAY_SENSOR_ID", "independent-lab-sensor"),
                   enabled=os.getenv("IDS_GATEWAY_LAB_ENABLED", "false").lower() == "true",
                   max_duration_s=int(os.getenv("IDS_GATEWAY_MAX_ACTION_S", "60")),
                   protected_sources=tuple(json.loads(os.getenv("IDS_GATEWAY_PROTECTED_SOURCES_JSON", "[]"))))

    def validate(self) -> None:
        if not self.enabled:
            raise ValueError("Gateway activation requires IDS_GATEWAY_LAB_ENABLED=true")
        if len(self.token) < 32 or not self.targets or not self.sensor_id:
            raise ValueError("Gateway token >=32 characters, targets and sensor ID required")
        if not 1 <= self.max_duration_s <= 300 or not 0 < self.sensor_max_age_s <= 10:
            raise ValueError("Gateway duration/freshness bounds invalid")
        for key, target in self.targets.items():
            if not re.fullmatch(r"[A-Za-z0-9_.-]{1,128}", key) or target.target_id != key:
                raise ValueError("Invalid registered target ID")
            target.validate()


class ActionCommand(BaseModel):
    model_config = ConfigDict(extra="forbid")
    run_id: str = Field(pattern=r"^[A-Za-z0-9_.:-]{1,128}$")
    idempotency_key: str = Field(pattern=r"^[A-Za-z0-9_.:-]{1,256}$")
    target_id: str = Field(pattern=r"^[A-Za-z0-9_.-]{1,128}$")
    action: str = Field(max_length=100)
    action_name: str = Field(max_length=40)
    duration_s: int = Field(ge=1, le=300, strict=True)
    expires_at: float = Field(gt=0, allow_inf_nan=False)
    authorization_expires_at: float = Field(gt=0, allow_inf_nan=False)
    policy_hash: str = Field(pattern=r"^[a-f0-9]{64}$")
    reversible: bool


class RollbackCommand(BaseModel):
    model_config = ConfigDict(extra="forbid")
    run_id: str = Field(max_length=128)
    idempotency_key: str = Field(max_length=256)
    target_id: str = Field(max_length=128)


class GatewayJournal:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.path = path
        with self.db() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.execute("CREATE TABLE IF NOT EXISTS actions (key TEXT PRIMARY KEY, command TEXT NOT NULL, status TEXT NOT NULL, expires REAL NOT NULL, receipt TEXT, rollback_receipt TEXT)")

    @contextmanager
    def db(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def get(self, key: str) -> dict | None:
        with self.db() as db:
            row = db.execute("SELECT * FROM actions WHERE key=?", (key,)).fetchone()
        if row is None:
            return None
        return {**dict(row), "command": json.loads(row["command"]),
                "receipt": json.loads(row["receipt"]) if row["receipt"] else None,
                "rollback_receipt": json.loads(row["rollback_receipt"]) if row["rollback_receipt"] else None}

    def unfinished(self) -> list[dict]:
        with self.db() as db:
            keys = [row[0] for row in db.execute("SELECT key FROM actions WHERE status IN ('pending','applied','unknown')")]
        return [self.get(key) for key in keys]

    def intent(self, command: ActionCommand) -> None:
        with self.db() as db:
            db.execute("INSERT INTO actions(key,command,status,expires) VALUES(?,?,'pending',?)",
                       (command.idempotency_key, command.model_dump_json(), command.expires_at))

    def applied(self, key: str, receipt: dict) -> None:
        with self.db() as db:
            db.execute("UPDATE actions SET status='applied',receipt=? WHERE key=?", (json.dumps(receipt), key))

    def unknown(self, key: str) -> None:
        with self.db() as db:
            db.execute("UPDATE actions SET status='unknown' WHERE key=?", (key,))

    def rolled_back(self, key: str, reason: str) -> dict:
        row = self.get(key)
        command = row["command"]
        receipt = {"run_id": command["run_id"], "idempotency_key": key,
                   "target_id": command["target_id"], "status": "rolled_back",
                   "action": command['action'], "policy_hash": command['policy_hash'],
                   "rolled_back_at_epoch": time.time(), "reason": reason}
        with self.db() as db:
            db.execute("UPDATE actions SET status='rolled_back',rollback_receipt=? WHERE key=?", (json.dumps(receipt), key))
        return receipt


def create_app(config: GatewayConfig | None = None, driver=None) -> FastAPI:
    config = config or GatewayConfig.environment()
    config.validate()
    if driver is None and sys.platform != "linux":
        raise ValueError("Real nftables gateway requires Linux")
    protected_sources = tuple(sorted(set(config.protected_sources) | {"10.0.0.1", "10.0.0.2", "10.0.0.10"}))
    driver = driver or NftDriver(protected_sources)
    journal = GatewayJournal(config.journal_path)
    lock = asyncio.Lock()
    stop = asyncio.Event()

    async def expire_loop():
        while not stop.is_set():
            async with lock:
                for row in journal.unfinished():
                    if row["expires"] <= time.time():
                        try:
                            await asyncio.to_thread(driver.rollback, row["key"])
                            journal.rolled_back(row["key"], "automatic-expiry")
                        except Exception:
                            # Kernel timeout elements already disable filtering;
                            # leave unconfirmed cleanup open for the next cycle.
                            journal.unknown(row["key"])
            try:
                await asyncio.wait_for(stop.wait(), .25)
            except asyncio.TimeoutError:
                pass

    @asynccontextmanager
    async def lifespan(app):
        # Exclusive gateway process ownership prevents startup clearing another
        # active service's controls. No inherited locks across uvicorn workers.
        process_lock = None
        if sys.platform == "linux":
            import fcntl
            process_lock = open(str(config.journal_path) + ".lock", "a")
            try:
                fcntl.flock(process_lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            except OSError:
                process_lock.close()
                raise RuntimeError("Another gateway process owns this journal")
        try:
            await asyncio.to_thread(driver.initialize)
            for row in journal.unfinished():
                journal.rolled_back(row["key"], "restart-owned-table-reset")
            task = asyncio.create_task(expire_loop())
            try:
                yield
            finally:
                stop.set()
                await task
                async with lock:
                    for row in journal.unfinished():
                        await asyncio.to_thread(driver.rollback, row["key"])
                        journal.rolled_back(row["key"], "gateway-shutdown")
        finally:
            if process_lock:
                process_lock.close()

    app = FastAPI(title="Isolated IoMT laboratory gateway", lifespan=lifespan)
    app.state.journal = journal

    def authenticated(request: Request):
        authorization = request.headers.get("authorization", "")
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not hmac.compare_digest(token, config.token):
            raise HTTPException(401, "Gateway authentication required")

    @app.get("/health")
    async def health(_=Depends(authenticated)):
        return {"mode": "isolated_lab", "sensor_id": config.sensor_id}

    @app.post("/actions")
    async def actions(command: ActionCommand, _=Depends(authenticated)):
        now = time.time()
        parsed = parse_action(command.action)
        target = config.targets.get(command.target_id)
        if (not target or parsed != (command.action_name, command.duration_s)
                or command.action_name == "alert_escalate" or not command.reversible
                or command.duration_s > config.max_duration_s
                or not now < command.authorization_expires_at <= now + 30
                or not now < command.expires_at <= now + command.duration_s + 1
                or command.idempotency_key != f"{command.run_id}:containment:1"):
            raise HTTPException(403, "Gateway action scope, authorization or expiry rejected")
        if (target.criticality == "Critical" or target.device_class in LIFE_CRITICAL) and command.action_name in {"device_isolate", "temp_source_block"}:
            raise HTTPException(403, "Blocking/isolation prohibited for life critical target")
        async with lock:
            if command.authorization_expires_at <= time.time() or command.expires_at <= time.time():
                raise HTTPException(403, "Authorization or action lease expired while waiting")
            existing = journal.get(command.idempotency_key)
            if existing:
                fields = ("run_id", "target_id", "action", "duration_s", "policy_hash")
                if any(existing["command"][field] != getattr(command, field) for field in fields):
                    raise HTTPException(409, "Idempotency key conflicts with a prior intent")
                if existing["receipt"]:
                    if existing["status"] != "applied":
                        raise HTTPException(409, "Prior action is no longer active; it will not be replayed")
                    return existing["receipt"]
                raise HTTPException(409, "Prior action state unconfirmed; reconcile or rollback")
            if any(row["command"]["target_id"] == target.target_id and row["expires"] > now for row in journal.unfinished()):
                raise HTTPException(409, "Target already has an active control")
            journal.intent(command)
            try:
                remaining = max(1, int(command.expires_at - time.time()))
                await asyncio.to_thread(driver.apply, command.idempotency_key, target, command.action_name, remaining)
                receipt = {"run_id": command.run_id, "idempotency_key": command.idempotency_key,
                           "target_id": command.target_id, "action": command.action,
                           "policy_hash": command.policy_hash, "status": "applied", "simulated": False,
                           "applied_at_epoch": time.time(), "expires_at": command.expires_at}
                journal.applied(command.idempotency_key, receipt)
                return receipt
            except Exception as exc:
                journal.unknown(command.idempotency_key)
                raise HTTPException(503, "Action effect unconfirmed; no automatic retry") from exc

    @app.get("/receipts/{key}")
    async def receipts(key: str, _=Depends(authenticated)):
        row = journal.get(key)
        if not row:
            raise HTTPException(404, "Unknown action")
        if not row["receipt"]:
            raise HTTPException(409, "Action was never confirmed applied")
        return {**row["receipt"], "status": row["status"], "current_status": row["status"]}

    @app.post("/rollbacks")
    async def rollbacks(command: RollbackCommand, _=Depends(authenticated)):
        async with lock:
            row = journal.get(command.idempotency_key)
            if not row or row["command"]["run_id"] != command.run_id or row["command"]["target_id"] != command.target_id:
                raise HTTPException(409, "Rollback does not match a known action intent")
            if row["rollback_receipt"]:
                return row["rollback_receipt"]
            try:
                await asyncio.to_thread(driver.rollback, command.idempotency_key)
                return journal.rolled_back(command.idempotency_key, "operator-or-policy-rollback")
            except Exception as exc:
                raise HTTPException(503, "Rollback state unknown") from exc

    @app.get("/rollback-receipts/{key}")
    async def rollback_receipts(key: str, _=Depends(authenticated)):
        row = journal.get(key)
        if not row:
            raise HTTPException(404, "Unknown action")
        if not row["rollback_receipt"]:
            raise HTTPException(409, "Rollback not confirmed")
        return row["rollback_receipt"]

    @app.get("/counters/{target_id}")
    async def counters(target_id: str, _=Depends(authenticated)):
        if target_id not in config.targets:
            raise HTTPException(404, "Unregistered target")
        try:
            if config.sensor_path.stat().st_size > 1048576:
                raise ValueError("Sensor snapshot too large")
            raw = json.loads(config.sensor_path.read_text(encoding="utf-8"))
            sample = CounterSample.model_validate(raw["samples"][target_id])
            if (sample.sensor_id != config.sensor_id or sample.target_id != target_id
                    or sample.provenance != "live_lab" or abs(time.time() - sample.timestamp) > config.sensor_max_age_s):
                raise ValueError("Sensor binding/freshness mismatch")
            return sample.model_dump()
        except (OSError, ValueError, KeyError, TypeError) as exc:
            raise HTTPException(503, "Independent traffic instrumentation unavailable") from exc

    return app
