"""FastAPI surface for the agent runtime.

Endpoints
---------
GET  /api/health              service + LLM provider status (no key required)
GET  /api/scenarios           the three demo incidents
GET  /api/memory/cases        the case store
GET  /api/memory/coverage     what the store currently knows (adaptation surface)
POST /api/simulate            run one incident, return the full event list
GET  /api/simulate/stream     run one incident as Server-Sent Events

The SSE stream emits exactly the `SimEvent` objects that
`src/agents/types.ts` already understands, so pointing the UI at this service is
a matter of replacing the local timer in `useSimRun` with an EventSource.
"""

from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from .config import settings
from .detector import get_detector
from agents.detector.confidence import window_stream_payload
from agents.detector.multiclass import (
    DetectorUnavailable,
    FeatureSchemaError,
    detector_mode,
    get_multiclass_detector,
    multiclass_runtime_status,
)
from .incidents import (
    DEVICES, SCENARIOS, build_event, detector_artifact, replay_scenario, source_cardinality,
)
from .llm import LLMClient
from .memory import CACHE, CaseCache, MemoryAgent
from .monitor import GATEWAY, GATEWAY_HEALTH_URL, PROBE_INTERVAL_S
from .planner import Faults, Planner
from .run_store import RUNS
from .schemas import RunRequest
from .auth import AuthManager
from .worker_runtime import RunWorkerService
from agents.detector.verification import evaluate_verification
from .sources import prepare
from .manifest import freeze, CODE_HASH
from .executor import StubExecutor, ExecutionRejected
from .lab_gateway import HttpLabExecutor
from .evaluation import run_paired


@asynccontextmanager
async def lifespan(app: FastAPI):
    global WORKERS
    if os.getenv('IDS_EMBEDDED_WORKER', 'true').lower() == 'true':
        WORKERS = RunWorkerService(RUNS, _execute_run)
        WORKERS.start()
    try:
        yield
    finally:
        if WORKERS:
            await WORKERS.stop()
            WORKERS = None

app = FastAPI(title="MediSOC Agent Runtime", version="0.2.0", lifespan=lifespan)
AUTH = AuthManager(revocation_lookup=RUNS.session_revoked, revocation_store=RUNS.revoke_session)
WORKERS: RunWorkerService | None = None


@app.middleware('http')
async def access_control(request: Request, call_next):
    if request.url.path.startswith('/api/') and request.url.path not in ('/api/health', '/api/ready') and request.method != 'OPTIONS':
        role = 'viewer'
        if request.method not in ('GET', 'HEAD'):
            role = 'operator'
        if request.url.path == '/api/auth/session':
            role = 'viewer'
        if request.url.path in ('/api/memory/reset', '/api/memory/cache/clear', '/api/audit', '/api/evaluation/experiments'):
            role = 'admin' if request.method != 'GET' or request.url.path == '/api/audit' else 'viewer'
        try:
            request.state.principal = await asyncio.to_thread(AUTH.require, request, role)
        except HTTPException as exc:
            return JSONResponse({'detail': exc.detail}, status_code=exc.status_code)
    return await call_next(request)


# CORS wraps authentication so browser clients can read 401/403 responses.
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins),
                   allow_methods=["*"], allow_headers=["*"], allow_credentials=True)


@app.post('/api/auth/session')
async def create_session(request: Request, response: Response):
    principal = AUTH.require(request, 'viewer')
    token = AUTH.create_session(principal)
    response.set_cookie('ids_session', token, httponly=True, secure=request.url.scheme == 'https',
                        samesite='strict', max_age=AUTH.ttl, path='/api')
    RUNS.audit(principal.key_id, 'session.create', principal.key_id)
    return {'role': principal.role, 'expires_in_s': AUTH.ttl}


@app.get('/api/auth/session')
async def session_identity(request: Request):
    return {'key_id': request.state.principal.key_id, 'role': request.state.principal.role}


@app.delete('/api/auth/session')
async def delete_session(request: Request, response: Response):
    await asyncio.to_thread(AUTH.revoke_session, request.cookies.get('ids_session', ''))
    response.delete_cookie('ids_session', path='/api')
    return {'logged_out': True}


# --------------------------------------------------------------------------- #
# Scenario definitions and the device registry live in `incidents.py`; the
# detector event is built from real scored capture windows, not constants.
# --------------------------------------------------------------------------- #


#: One shared client for the whole process. Key parking, circuit-breaker state
#: and call counters are cross-incident concerns: a key rate-limited by incident
#: N must still be parked for incident N+1, and the health endpoint has to report
#: cumulative usage rather than the last request's.
LLM = LLMClient()
_RUN_SUBSCRIBERS: dict[str, set[asyncio.Event]] = {}
# The PoC's gateway stub is process-global. Serialize runs that share it until
# the actuator/monitor boundary is backed by an isolated per-run testbed.
_EXECUTION_LOCK = asyncio.Lock()


def _notify_run(run_id: str) -> None:
    for subscriber in _RUN_SUBSCRIBERS.get(run_id, set()):
        subscriber.set()


def _planner(faults: Faults) -> Planner:
    memory = MemoryAgent(available=not faults.memory_down)
    # the llm-down fault uses a throwaway client so it cannot poison shared state
    llm = LLMClient(force_unavailable=True) if faults.llm_down else LLM
    return Planner(memory, llm, faults)


# --------------------------------------------------------------------------- #
# --------------------------------------------------------------------------- #
# Edge gateway stub.
#
# The availability monitor needs a real HTTP endpoint to probe. Until the
# testbed gateway exists, this stands in for it: it answers 200 while the
# service is healthy and 503 while it is saturated, and the incident run drives
# that state. The probing is real; only the thing being probed is a stub.
#
# Point GATEWAY_HEALTH_URL at the real gateway and nothing else changes.
# --------------------------------------------------------------------------- #
@app.get("/gateway/health")
async def gateway_health() -> JSONResponse:
    code, body = GATEWAY.status()
    return JSONResponse(status_code=code, content=body)


@app.get("/api/monitor/info")
async def monitor_info() -> dict:
    return {
        "probe_url": GATEWAY_HEALTH_URL,
        "probe_rate_hz": round(1 / PROBE_INTERVAL_S, 1),
        "interval_s": PROBE_INTERVAL_S,
        "healthy_now": GATEWAY.healthy,
        "success_criterion": "HTTP 200 = traffic healthy; any other status, timeout or connection error = outage",
        "note": (
            "Probing is real HTTP. The default target is the built-in gateway stub in this service; "
            "set GATEWAY_HEALTH_URL to point the same probe at the real edge gateway."
        ),
    }


@app.get("/api/health")
async def health() -> dict:
    try:
        persistence = RUNS.health()
    except Exception:  # noqa: BLE001 - readiness must explain database unavailability
        persistence = {"available": False, "backend": "sqlite", "unresolved_action_intents": None}
    return {
        "status": "ok" if persistence["available"] else "degraded",
        "code_hash": CODE_HASH,
        "persistence": persistence,
        "executor_mode": 'http_lab_available' if os.getenv('IDS_LAB_GATEWAY_URL') else 'gateway_stub',
        "source_mode_supported": ["fixture", "capture_replay", "live_lab"],
        "specialist_execution": os.getenv('SPECIALIST_EXECUTION', 'process'),
        "authentication": {'configured': bool(AUTH.keys), 'local_development': AUTH.dev_local},
        "worker": {'embedded': WORKERS is not None, 'concurrency': WORKERS.concurrency if WORKERS else 0},
        "llm": LLM.stats(),
        "thresholds": settings.thresholds.__dict__,
        "verified_case_reuse_enabled": settings.enable_verified_reuse,
        "detector": detector_mode(),
        "detector_status": multiclass_runtime_status(),
        "note": (
            "The runtime needs an operator API key or explicit localhost development access. Without LLM keys every "
            "agent takes its deterministic path: retrieval + rule-based fusion + the policy action "
            "table. Reasoning quality drops on novel incidents; safety properties do not change."
        ),
    }


@app.get("/api/scenarios")
async def scenarios() -> dict:
    return {
        "scenarios": [
            {
                "key": s.key,
                "name": s.name,
                "blurb": s.blurb,
                "device": DEVICES[s.device_id].__dict__,
                "src_ip": s.src_ip,
                "replay": {
                    "windows": s.profile.windows,
                    "rows_per_window": s.profile.rows_per_window,
                    "attack_start": s.profile.attack_start,
                    "attack_ratio": s.profile.attack_ratio,
                    "window_seconds": s.profile.window_seconds,
                    "attack_capture": s.attack_capture,
                },
            }
            for s in SCENARIOS.values()
        ]
    }


@app.get("/api/detector/info")
async def detector_info() -> dict:
    """Model card for the trained detector - what it is and what it covers."""
    return get_detector().info()


@app.get("/api/detector/multiclass/info")
async def multiclass_detector_info() -> dict:
    """Staged LightGBM bundle card. Does not replace the legacy detector.

    The card reports `declared_classes` (what the model is configured to emit)
    separately from the verification status of each class. A 13-class bundle with
    3 verified classes must not read as a 13-class validated detector.
    """
    try:
        card = get_multiclass_detector().info()
    except DetectorUnavailable as exc:
        return JSONResponse(
            {
                "loaded": False,
                "active_in_runtime": False,
                "declared_classes": [],
                "verified_class_count": 0,
                "detail": str(exc),
            },
            status_code=503,
        )
    verification = evaluate_verification()
    card["declared_classes"] = card.pop("classes", [])
    card["verification"] = verification
    card["verified_class_count"] = verification["summary"]["verified"]
    card["note"] = (
        card["note"]
        + f" Verified {verification['summary']['verified']} of {verification['summary']['declared']} "
        "declared classes under the recorded standard; see `verification` before treating a class "
        "label as established."
    )
    return card


@app.get("/api/detector/multiclass/sample")
async def multiclass_detector_sample(
    capture: str = Query("benign"),
    rows: int = Query(32, ge=1, le=256),
) -> dict:
    """Score a small capture prefix with the staged adapter; not a live run."""
    try:
        return get_multiclass_detector().sample_capture(capture, rows)
    except DetectorUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except FeatureSchemaError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/detector/replay")
async def detector_replay(scenario_key: str = Query("medium", alias="scenario")) -> dict:
    """Score a capture timeline without running the agent chain."""
    try:
        windows, trigger = replay_scenario(scenario_key)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    trigger_payload = window_stream_payload(trigger) if trigger else None
    return {
        "scenario": scenario_key,
        "detector": detector_mode(),
        "windows": [window_stream_payload(w) for w in windows],
        "trigger_index": trigger.index if trigger else None,
        "trigger_confidence": None if trigger_payload is None else {
            "variant_confidence": trigger_payload.get("variant_confidence"),
            "window_mean_attack_probability": trigger_payload.get("window_mean_attack_probability"),
            "attack_variant": trigger_payload.get("attack_variant"),
            "confidence_kind": trigger_payload.get("confidence_kind"),
        },
    }


@app.get("/api/memory/cases")
async def cases() -> dict:
    return {"cases": [c.model_dump(mode="json") for c in MemoryAgent().cases]}


@app.get("/api/memory/coverage")
async def coverage() -> dict:
    return MemoryAgent().coverage()


@app.get("/api/memory/cache")
async def memory_cache() -> dict:
    """Secondary memory: what is cached right now and how long it has left."""
    return CACHE.stats()


@app.post("/api/memory/cache/clear")
async def memory_cache_clear(request: Request) -> dict:
    CACHE.clear()
    await asyncio.to_thread(RUNS.audit, request.state.principal.key_id, 'memory.cache.clear', 'cache')
    return {"cleared": True, **CACHE.stats()}


@app.get("/api/memory/benchmark")
async def memory_benchmark(sizes: str = Query("7,100,1000,10000")) -> dict:
    """Measure primary-scan cost against store size, versus the bounded cache.

    The point of secondary memory is that its cost does not grow with the store.
    At seven cases that is an architectural claim rather than a visible saving,
    so this measures it properly: the same incident scored against progressively
    larger stores, with the <=10-entry cache lookup alongside for comparison.

    Stores are grown by cloning the seed cases with fresh ids - the similarity
    maths per case is identical, which is exactly what we are timing.
    """
    import time as _t

    from .memory import CaseCache

    windows, trigger = replay_scenario("low")
    if trigger is None:
        raise HTTPException(status_code=422, detail="replay produced no detection")
    event = build_event("low", trigger)
    base = MemoryAgent()
    cardinality = source_cardinality(event)

    # a full cache, so the comparison is against the worst case (10 entries)
    cache = CaseCache()
    for c in base.cases[: CaseCache.CAPACITY]:
        cache.promote(c, promoted_by="benchmark")

    def time_it(fn, reps: int) -> float:
        start = _t.perf_counter()
        for _ in range(reps):
            fn()
        return (_t.perf_counter() - start) / reps * 1_000_000  # microseconds

    cache_us = time_it(
        lambda: cache.lookup(event, cardinality, base.similarity, base.context_compatible), 200
    )

    rows = []
    for size in [int(x) for x in sizes.split(",") if x.strip().isdigit()][:6]:
        agent = MemoryAgent()
        seed = list(agent.cases)
        clones = []
        i = 0
        while len(clones) < size:
            c = seed[i % len(seed)].model_copy(deep=True)
            c.case_id = f"BENCH-{len(clones):06d}"
            clones.append(c)
            i += 1
        agent.cases = clones
        reps = 50 if size <= 1000 else 5
        primary_us = time_it(lambda: agent.retrieve(event, cardinality), reps)
        rows.append({
            "store_size": size,
            "primary_us": round(primary_us, 1),
            "cache_us": round(cache_us, 1),
            "speedup_x": round(primary_us / cache_us, 1) if cache_us else None,
        })

    return {
        "note": (
            "Primary scores every case; the cache scores at most 10. Measured on this machine, "
            "single-threaded, structured similarity only (no embedding term)."
        ),
        "cache_entries_scored": len(cache.entries),
        "results": rows,
    }


@app.post("/api/memory/reset")
async def reset_memory(request: Request) -> dict:
    """Restore the pristine seed store.

    Every completed run appends a validated case, which is the point of the
    system but means a demo store drifts after a few runs. This puts it back to
    the seven curated cases so a walkthrough tells the same story twice.
    """
    seed = settings.cases_seed_path.read_text(encoding="utf-8")
    queue = (await asyncio.to_thread(RUNS.health))['queue']
    if any(queue.get(status, 0) for status in ('running', 'queued', 'cancelling')):
        raise HTTPException(409, 'Cannot reset learned memory while runs are active or queued')
    await asyncio.to_thread(RUNS.reset_cases, json.loads(seed))
    await asyncio.to_thread(RUNS.audit, request.state.principal.key_id, 'memory.reset', 'cases')
    CACHE.clear()  # secondary memory holds copies of primary; reset both together
    return {"reset": True, "cases": len(json.loads(seed)), "cache_cleared": True}


async def _execute_run(record: dict, cancel_event: asyncio.Event) -> None:
    """Whole-run deadline requests compensation, then fences an unresponsive job."""
    deadline = max(15., min(600., float(os.getenv('RUN_DEADLINE_S', '180'))))
    async def expire():
        await asyncio.sleep(deadline)
        cancel_event.set()
    timer = asyncio.create_task(expire())
    try:
        await asyncio.wait_for(_execute_leased_run(record, cancel_event), deadline + 10)
    except asyncio.TimeoutError:
        await asyncio.to_thread(RUNS.interrupt_run, record['run_id'], 'Run deadline exceeded; reconcile action receipts. Live gateway controls expire automatically.')
    finally:
        timer.cancel()
        await asyncio.gather(timer, return_exceptions=True)


async def _execute_leased_run(record: dict, cancel_event: asyncio.Event) -> None:
    """One leased job. Queue ownership is checked at every persisted event."""
    run_id, owner = record['run_id'], record['worker_id']
    req = RunRequest.model_validate(record['request'])
    planner = None
    target_claimed = False
    started = time.perf_counter()
    try:
        async with _EXECUTION_LOCK:
            if record.get('enqueued_epoch') is not None:
                await asyncio.to_thread(RUNS.append, run_id, {'type': 'metric', 'key': 'queueWaitMs',
                    'value': round(max(0., time.time() - record['enqueued_epoch']) * 1000, 3), 'ts': 0}, owner)
            windows, event, payload = await asyncio.to_thread(prepare, req)
            await asyncio.to_thread(RUNS.drain_case_outbox)
            memory = await asyncio.to_thread(MemoryAgent, available=not req.faults.get('memoryDown', False))
            if req.evaluation_memory_snapshot is not None:
                memory.cases = [c.model_copy(deep=True) for c in req.evaluation_memory_snapshot] if memory.available else []
                memory.cache = CaseCache()
            frozen_cases = req.evaluation_memory_snapshot if req.evaluation_memory_snapshot is not None else memory.cases
            manifest = await asyncio.to_thread(freeze, req.model_dump(mode='json'), [c.model_dump(mode='json') for c in frozen_cases])
            await asyncio.to_thread(RUNS.freeze_manifest, run_id, manifest)
            await asyncio.to_thread(RUNS.append, run_id, {'type': 'artifact', 'node': 'planner', 'title': 'Frozen run manifest', 'payload': manifest, 'ts': 0}, owner)
            if event is None:
                await asyncio.to_thread(RUNS.append, run_id, {'type': 'run.end', 'outcome': 'UNVALIDATED', 'summary': 'No detection in the source timeline.', 'ts': 0}, owner)
                return
            if req.source_mode == 'live_lab':
                target_claimed = await asyncio.to_thread(RUNS.claim_target, run_id, event.device_id, owner)
                if not target_claimed:
                    await asyncio.to_thread(RUNS.append, run_id, {'type': 'state', 'state': 'SAFE_HOLD', 'ts': 0}, owner)
                    await asyncio.to_thread(RUNS.append, run_id, {'type': 'run.end', 'outcome': 'UNVALIDATED', 'summary': 'Target has an active run or unresolved action; reconcile its receipts before another action.', 'ts': 0}, owner)
                    return
            executor = HttpLabExecutor(store=RUNS) if req.source_mode == 'live_lab' else StubExecutor(RUNS)
            faults = Faults.from_dict(req.faults)
            llm = LLMClient(force_unavailable=True) if faults.llm_down else LLM
            planner = Planner(memory, llm, faults, executor=executor)
            async for item in planner.run(event, req.scenario, windows, payload, run_id=run_id,
                                          source_mode=req.source_mode, cancel_event=cancel_event,
                                          evaluation_profile=req.evaluation_profile, speed=req.speed):
                await asyncio.to_thread(RUNS.append, run_id, item.model_dump(mode='json', by_alias=True, exclude_none=True), owner)
                _notify_run(run_id)
    except asyncio.CancelledError:
        await asyncio.to_thread(RUNS.interrupt_run, run_id, 'Worker shutdown interrupted execution; inspect action receipts before any new action.')
        raise
    except Exception as exc:
        current = await asyncio.to_thread(RUNS.get, run_id)
        if current and current['status'] not in ('interrupted', 'failed', 'completed', 'cancelled', 'safe_hold', 'escalated'):
            elapsed = time.perf_counter() - started
            await asyncio.to_thread(RUNS.append, run_id, {'type': 'log', 'ts': elapsed, 'level': 'error', 'agent': 'runtime', 'msg': f'Execution stopped: {type(exc).__name__}'}, owner)
            await asyncio.to_thread(RUNS.append, run_id, {'type': 'run.end', 'ts': elapsed, 'outcome': 'UNVALIDATED', 'summary': 'Execution failed; inspect run journal and action receipts before retrying.'}, owner)
            await asyncio.to_thread(RUNS.finish_error, run_id, f'{type(exc).__name__}: execution failed')
    finally:
        if planner:
            await planner.close()
        if target_claimed:
            await asyncio.to_thread(RUNS.release_target, run_id, owner)
        _notify_run(run_id)


@app.post("/api/simulate")
async def simulate(req: RunRequest, request: Request) -> dict:
    """Run one incident to completion and return every event at once."""
    accepted = await create_run(req, request, None)
    deadline = time.monotonic() + 180
    while RUNS.get(accepted['run_id'])['status'] in ('queued', 'running', 'cancelling'):
        if time.monotonic() >= deadline:
            return {'run_id': accepted['run_id'], 'status': RUNS.get(accepted['run_id'])['status'], 'events': []}
        await asyncio.sleep(.25)
    return {
        "run_id": accepted["run_id"],
        "events": [row["event"] for row in RUNS.events_after(accepted["run_id"], 0, 5000)],
        "llm": LLM.stats(),
    }


@app.post("/api/runs", status_code=202)
async def create_run(req: RunRequest, request: Request, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")) -> dict:
    """Create a run independently of its event-stream connection."""
    if req.evaluation_memory_snapshot is not None:
        AUTH.require(request, 'admin')
        if req.source_mode == 'live_lab' or req.evaluation_profile == 'operational':
            raise HTTPException(422, 'Frozen memory overrides are limited to non-live evaluation profiles')
    if idempotency_key:
        existing = RUNS.by_idempotency_key(idempotency_key)
        if existing:
            prior = RUNS.get(existing)
            if prior["request"] != req.model_dump(mode="json"):
                raise HTTPException(status_code=409, detail="Idempotency-Key was already used for a different request")
            return {"run_id": existing, "status": prior["status"], "created": False}

    if req.source_mode == 'live_lab':
        if req.evaluation_profile != 'operational' or any(req.faults.values()):
            raise HTTPException(422, 'Evaluation ablations and fault injection cannot drive live lab actions')
        try:
            HttpLabExecutor(store=RUNS)
            prepare(req)  # validates trusted device mapping and incident envelope
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from None
    actor = request.state.principal.key_id
    if idempotency_key and len(idempotency_key) > 128:
        raise HTTPException(422, 'Idempotency-Key is limited to 128 characters')

    run_id = f"RUN-{uuid.uuid4().hex[:12].upper()}"
    try:
        created = await asyncio.to_thread(RUNS.create, run_id, req.model_dump(mode='json'), idempotency_key, actor)
    except ValueError as exc:
        raise HTTPException(429, str(exc)) from None
    if not created:
        # Covers two concurrent POSTs racing with the same key.
        existing = RUNS.by_idempotency_key(idempotency_key) if idempotency_key else None
        if existing:
            prior = RUNS.get(existing)
            if prior["request"] != req.model_dump(mode="json"):
                raise HTTPException(status_code=409, detail="Idempotency-Key was already used for a different request")
            return {"run_id": existing, "status": prior["status"], "created": False}
        raise HTTPException(status_code=409, detail="run creation conflict")

    await asyncio.to_thread(RUNS.audit, actor, 'run.create', run_id, {'source_mode': req.source_mode})
    return {"run_id": run_id, "status": "queued", "created": True}


@app.get("/api/runs/{run_id}")
async def get_run(run_id: str) -> dict:
    run = RUNS.get(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="run not found")
    return {
        **run,
        "action_intents": RUNS.action_intents(run_id),
        "outcome_observation": RUNS.outcome_observation(run_id),
    }


@app.post("/api/runs/{run_id}/cancel", status_code=202)
async def cancel_run(run_id: str, request: Request) -> dict:
    """Request cooperative cancellation; post-action cancellation rolls back in the stub."""
    run = RUNS.get(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="run not found")
    if not RUNS.request_cancel(run_id):
        raise HTTPException(status_code=409, detail=f"run is already terminal ({run['status']})")
    if WORKERS:
        WORKERS.cancel(run_id)
    RUNS.audit(request.state.principal.key_id, 'run.cancel', run_id)
    _notify_run(run_id)
    return {"run_id": run_id, "status": RUNS.get(run_id)['status'], "requested": True}


@app.get("/api/runs/{run_id}/events")
async def run_events(run_id: str, last_event_id: str | None = Header(default=None, alias="Last-Event-ID")) -> StreamingResponse:
    if RUNS.get(run_id) is None:
        raise HTTPException(status_code=404, detail="run not found")
    try:
        cursor = max(0, int(last_event_id or "0"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Last-Event-ID must be an integer") from None
    wake = asyncio.Event()
    _RUN_SUBSCRIBERS.setdefault(run_id, set()).add(wake)

    async def gen():
        nonlocal cursor
        try:
            while True:
                wake.clear()
                batch = await asyncio.to_thread(RUNS.events_after, run_id, cursor)
                for row in batch:
                    cursor = row["sequence"]
                    yield f"id: {cursor}\ndata: {json.dumps(row['event'], separators=(',', ':'), default=str)}\n\n"
                current = await asyncio.to_thread(RUNS.get, run_id)
                if current["status"] in (
                    "completed", "failed", "cancelled", "safe_hold", "escalated", "interrupted",
                ) and not RUNS.events_after(run_id, cursor):
                    break
                try:
                    await asyncio.wait_for(wake.wait(), timeout=1)
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            subscribers = _RUN_SUBSCRIBERS.get(run_id)
            if subscribers:
                subscribers.discard(wake)
                if not subscribers:
                    _RUN_SUBSCRIBERS.pop(run_id, None)

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/api/simulate/stream")
async def simulate_stream(
    scenario: str = Query("medium"),  # noqa: A002 - matches the UI query param
    llmDown: bool = False,
    plannerCrash: bool = False,
    memoryDown: bool = False,
    subAgentTimeout: bool = False,
    policyConflict: bool = False,
    speed: float = Query(1.0, gt=0),
) -> StreamingResponse:
    raise HTTPException(410, 'Create runs with POST /api/runs and observe GET /api/runs/{run_id}/events')


@app.get('/api/runs')
async def list_runs(limit: int = Query(100, ge=1, le=1000)):
    return {'runs': await asyncio.to_thread(RUNS.list_runs, limit)}


@app.post('/api/runs/{run_id}/reconcile')
async def reconcile_run(run_id: str, request: Request):
    principal = await asyncio.to_thread(AUTH.require, request, 'admin')
    record = await asyncio.to_thread(RUNS.get, run_id)
    if not record:
        raise HTTPException(404, 'run not found')
    if record['status'] in ('queued', 'running', 'cancelling'):
        raise HTTPException(409, 'Reconciliation requires a terminal held or interrupted run')
    if record['request']['source_mode'] != 'live_lab':
        raise HTTPException(422, 'Gateway reconciliation is available only for live lab runs')
    try:
        executor = HttpLabExecutor(store=RUNS)
        intents = await asyncio.to_thread(RUNS.action_intents, run_id)
        results = [await executor.inspect(run_id, intent['idempotency_key']) for intent in intents]
    except (ValueError, ExecutionRejected):
        raise HTTPException(409, 'Gateway could not confirm the bound action state; keep the target held') from None
    await asyncio.to_thread(RUNS.audit, principal.key_id, 'run.reconcile', run_id, {'statuses': [r['status'] for r in results]})
    return {'run_id': run_id, 'receipts': results, 'run_resumed': False}


@app.get('/api/runs/{run_id}/journal')
async def journal(run_id: str, after: int = Query(0, ge=0), limit: int = Query(5000, ge=1, le=5000)):
    if RUNS.get(run_id) is None:
        raise HTTPException(404, 'run not found')
    rows = await asyncio.to_thread(RUNS.events_after, run_id, after, limit)
    return {'run_id': run_id, 'events': rows, 'next_cursor': rows[-1]['sequence'] if rows else after}


@app.get('/api/audit')
async def audit_events():
    return {'events': await asyncio.to_thread(RUNS.audits)}


@app.get('/api/ready')
async def readiness():
    try:
        persistence = await asyncio.to_thread(RUNS.health)
        available = persistence['available'] and (bool(AUTH.keys) or AUTH.dev_local)
    except Exception:
        persistence, available = {'available': False}, False
    detector = multiclass_runtime_status()
    if detector['requested'] == 'multiclass' and not detector['available']:
        available = False
    return JSONResponse(status_code=200 if available else 503, content={
        'ready': available, 'persistence': persistence,
        'authentication_configured': bool(AUTH.keys) or AUTH.dev_local,
        'fixture_detector': 'available',
        'capture_detector': detector,
        'lab_gateway': 'configured' if os.getenv('IDS_LAB_GATEWAY_URL') else 'not configured',
        'embedded_worker': WORKERS is not None,
    })


@app.get('/api/evaluation/experiments')
async def experiments():
    return {'experiments': await asyncio.to_thread(RUNS.experiments)}


@app.post('/api/evaluation/experiments')
async def evaluate(request: Request, repeats: int = Query(1, ge=1, le=10)):
    cases = [{'scenario': key, 'source_mode': 'fixture'} for _ in range(repeats) for key in ('low', 'medium', 'high')]
    snapshot = [c.model_dump(mode='json') for c in MemoryAgent().cases]
    async def execute(case, profile, seed):
        req = RunRequest(**case, fixture_seed=seed, evaluation_profile=profile, evaluation_memory_snapshot=snapshot, faults={'llmDown': True}, speed=20)
        accepted = await create_run(req, request, None)
        deadline = time.monotonic() + 180
        while RUNS.get(accepted['run_id'])['status'] not in ('completed', 'failed', 'cancelled', 'safe_hold', 'escalated', 'interrupted'):
            if time.monotonic() > deadline:
                raise HTTPException(504, 'Evaluation run deadline exceeded')
            await asyncio.sleep(.1)
        return RUNS.events_after(accepted['run_id'], 0, 5000)
    experiment_id = 'EXP-' + uuid.uuid4().hex[:12]
    async def persist_manifest(manifest):
        await asyncio.to_thread(RUNS.save_experiment, experiment_id, manifest)
    report = await run_paired(cases, execute, model={'source': 'synthetic fixture'},
                              config={'thresholds': settings.thresholds.__dict__, 'code': CODE_HASH}, case_snapshot=snapshot, on_manifest=persist_manifest)
    RUNS.save_experiment(experiment_id, report['manifest'], report)
    RUNS.audit(request.state.principal.key_id, 'evaluation.create', experiment_id)
    return {'experiment_id': experiment_id, **report}
