# MediSOC Agent Runtime

FastAPI service implementing the Detector, Planner, Memory, Investigator (+ 5
specialist sub-agents), Explainer and Response agents, plus the deterministic
policy gate.

## Real detection, not a mock

The Detector Agent loads the trained model in `agents/detector/` and scores real
rows from the CICIoMT2024 capture CSVs:

```
agents/detector/tcp_flood_rf_model.joblib   RandomForest, 200 trees, 45 features
agents/detector/tcp_flood_scaler.joblib     StandardScaler
agents/detector/TCP_IP-DoS-TCP_test.pcap.csv   attack capture (82k rows)
data/Benign_test.pcap.csv                      benign capture (37k rows)
```

A run replays 12 windows x 40 flows: four benign baseline windows, then attack
onset. Every window is scored with `predict_proba`, and the mean per-flow attack
probability is what the Planner routes on. The three scenarios differ only in
device criticality and how much attack traffic contaminates the window, which is
why their confidences differ (0.9996 / 0.9679 / 0.8502) - those are model
outputs, not constants.

**Two scope limits worth stating up front:**

- The model is binary: `Benign` vs `TCP_Flood`. Other attack families in the
  architecture are not covered by this detector yet.
- The capture CSVs are post-feature-extraction and carry no addresses, so device
  attribution comes from the registry in `app/incidents.py`, not from the data.
  In the deployed pipeline the Edge Gateway supplies that mapping.

## Availability monitor - the outcome is measured, not assumed

`app/monitor.py` runs an independent probe for the life of every incident:

```
GET <GATEWAY_HEALTH_URL>   2 requests per second
  200            -> service answering, legitimate traffic flowing
  anything else  -> outage (5xx, 4xx, timeout, connection refused)
```

It is deliberately independent of the detection pipeline. The detector says an
attack is happening; only the probe says whether the service clinicians depend
on actually came back. Availability and time-to-recovery are computed from its
HTTP responses alone, split by phase (baseline / under attack / after recovery)
because a whole-run average mostly measures how long you watched.

A typical live run: **74 requests, 45 errors, recovery 0.53s after the action,
100% baseline, 0% under attack, 100% after recovery.**

`GATEWAY_HEALTH_URL` defaults to the built-in stub at `/gateway/health` in this
same service, which genuinely returns 503 while saturated and 200 once
contained. **The probing is real either way** - point the variable at the real
edge gateway and nothing in the monitor changes.

Still not measured: **attack suppression**. That needs a gateway traffic counter
this PoC has no source for, so it is reported as `-1` (the explicit "not
measured" sentinel) rather than estimated.

## Run

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # macOS/Linux: .venv/bin/python
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8099
```

## API keys

**The service runs with no API key at all.** Copy `.env.example` to `.env` and
fill in a key only when you want generative reasoning:

```
LLM_PROVIDER=anthropic     # anthropic | openai | none
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-sonnet-5
```

`GET /api/health` reports whether a key is configured, whether the circuit
breaker is open, and how many calls have been made. With no key every agent
takes its deterministic path — retrieval, rule-based fusion and the policy
action table. Reasoning quality drops on novel incidents; the safety properties
are unchanged, because they never depended on the model in the first place.

## Endpoints

| Method | Path                    | Purpose |
|--------|-------------------------|---------|
| GET    | `/api/health`           | service + LLM provider status |
| GET    | `/api/scenarios`        | the three demo incidents + device registry |
| GET    | `/api/detector/info`    | model card: type, trees, features, scope, ROC-AUC, importances |
| GET    | `/api/detector/replay`  | score a capture timeline without running the agent chain |
| GET    | `/api/memory/cases`     | the case store |
| GET    | `/api/memory/coverage`  | what the store knows (the adaptation surface) |
| GET    | `/api/memory/cache`     | secondary memory: entries, TTLs, hit rate |
| POST   | `/api/memory/cache/clear` | empty the cache without touching the store |
| GET    | `/api/memory/benchmark` | measured primary-vs-cache cost by store size |
| POST   | `/api/memory/reset`     | restore the pristine 7-case seed store |
| POST   | `/api/simulate`         | run one incident, return all events |
| GET    | `/api/simulate/stream`  | run one incident as Server-Sent Events |

Fault injection is available on both simulate endpoints:
`?llmDown=true&plannerCrash=true&memoryDown=true&subAgentTimeout=true&policyConflict=true`

## Wiring the UI to this service

The SSE stream emits exactly the `SimEvent` objects that
`src/agents/types.ts` already defines. To switch the Agent Simulation page from
the local mock engine to the live backend, replace the timer loop in
`src/agents/engine.ts` with an `EventSource` and feed each parsed event into the
same reducer — no component changes are required.

```ts
const es = new EventSource(`${API}/api/simulate/stream?scenario=${key}&llmDown=${f.llmDown}`);
es.onmessage = (m) => applyEvent(JSON.parse(m.data) as SimEvent);
```

## Two-tier memory

Primary is the full case store; secondary is a 10-entry queue of copies of
recently-useful cases, each living 5 attacks unless a hit refreshes it. Secondary
is checked first, so a repeat attack family answers without rescanning the store.

```bash
curl localhost:8099/api/memory/cache        # entries, TTLs, hit rate
curl localhost:8099/api/memory/benchmark    # measured cost vs store size
```

The benchmark is worth running before you claim the cache is faster: at the
seven-case seed store it is **slower** (664µs primary vs 1226µs cache), and only
pays off from roughly 10-15 cases upward — 7x at 100 cases, 1000x at 10 000.

## Regenerating the offline replay

Local mode in the UI replays **recorded real model output** rather than invented
numbers. After changing the model, the captures or a `ReplayProfile`, regenerate
it:

```bash
.venv/Scripts/python export_replays.py     # writes ../src/data/replays.json
```

That file carries the scored window series, detection confidence, feature
attribution and the real Memory Agent reuse verdicts for each scenario.

## Note on the case store

`data/cases.json` is a real store, not a fixture: completed runs append
validated cases to it and update the reliability of any case they reused. Reset
it with `cp ../src/data/cases.json data/cases.json`.
