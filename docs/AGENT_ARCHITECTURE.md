# Agent Architecture — MediSOC

> **Architecture status:** This file records the existing PoC design and implementation. The current target architecture, orchestration contracts, and outcome-validation requirements are in [Agent Orchestration Architecture](AGENT_ORCHESTRATION_ARCHITECTURE.md). Where this PoC note describes stub-based recovery or prior outcomes as successful, treat that as demo behavior, not validated research evidence.

Adaptive autonomous cyber defence for IoMT networks.
This document covers the agent layer: what each agent does, how the Planner
routes, how memory makes the system adaptive, where the safety boundary sits,
and what happens when each component fails.

The detection track (Edge Gateway + Detector) is owned separately, but its
trained model is now wired into this runtime: see §2.1.

---

## 1. The design thesis

> The system should not run the full agent chain for every alert. It should
> detect first, route by risk, reuse validated prior work when safe,
> investigate only what is uncertain, enforce deterministic response policies,
> and store the resulting case and outcome for future incidents.

Two consequences shape everything below:

1. **Depth is a decision, not a constant.** A known UDP flood on a lab sensor
   and a novel publish flood on a patient-monitor gateway must not cost the same
   number of reasoning steps.
2. **Recommendation and execution are different privileges.** An agent may
   propose an action. Only a deterministic policy gate may authorise one.

---

## 2. Agent inventory

| Agent | LLM | Owns | Never does |
|---|---|---|---|
| **Edge Gateway** | none | PCAP capture, flow/window construction, feature vector, device attribution | any decision |
| **Detector** | none | Normal/Attack + subtype, per-flow attack probability, feature attribution | routing, response |
| **Planner (Controller)** | optional | routing, memory usage, specialist selection, explanation depth, case lifecycle, supervision | packet parsing, ML inference, similarity computation, XAI, firewall actions, outcome measurement |
| **Memory Agent** | none | case representation, retrieval, reuse gating, write-back, reliability accounting | deciding the response |
| **Investigator** | primary | evidence fusion into one structured investigation object | executing anything |
| ├ **LOG-1** Log Analysis Agent | optional | auth/firewall/MQTT logs, connection failures, resource use | — |
| ├ **TIA-1** Threat Intelligence Agent | optional | IOC/CVE/reputation context (advisory only) | — |
| ├ **DCX-1** Device Context Agent | optional | clinical role, criticality, allowed/denied action set | — |
| ├ **TRF-1** Traffic Analysis Agent | optional | rate profile, source cardinality, legitimate throughput | — |
| └ **HIS-1** History Analysis Agent | optional | recurrence over the incident log: repeat source, escalation | — |
| **Explainer** | primary | audit narrative at the depth the Planner selected | recommending actions |
| **Response** | primary | recommends ONE bounded action from a fixed set | executing |
| **Policy Gate** | none | PASS / DOWNGRADE / ESCALATE — the only execution authority | reasoning |
| **Execute + Validate** | none | applies the action, measures suppression + availability, labels the outcome | choosing the action |

### 2.1 The Detector is real

`backend/app/detector.py` loads the trained artefacts from `agents/detector/artifacts/legacy/` and
scores real CICIoMT2024 capture rows. Nothing about detection is simulated.

| | |
|---|---|
| Model | RandomForestClassifier, 200 trees, 45 features |
| Scope | binary: `Benign` vs `TCP_Flood` |
| Dataset | CICIoMT2024 per-capture CSVs, dataset-provided train/test split |
| Held-out ROC-AUC | 1.0 |
| Top importances | Magnitue, Tot size, Max, AVG, Header_Length |

A run replays **12 windows x 40 flows** at 2s per window: four benign baseline
windows, then attack onset. Each window is scored with `predict_proba`, and the
**mean per-flow attack probability** is the confidence the Planner routes on.

That quantity is deliberately not dressed up as a calibrated posterior over the
window - it is the proportion of flows in the window the detector believes are
attack traffic, and the UI says so. It is also the honest lever on confidence: a
window contaminated with legitimate telemetry genuinely scores lower than a
saturated flood, which is exactly what produces the HIGH scenario's 0.85.

**Measured detector output across the three scenarios:**

| Scenario | Attack flows in window | Confidence | Route driver |
|---|---|---|---|
| LOW · sensor | 40/40 | **0.9996** | clears the 0.95 fast-path floor |
| MEDIUM · broker | 39/40 | **0.9679** | clears the floor, but device is High-criticality |
| HIGH · gateway | 34/40 | **0.8502** | below the floor **and** life-critical device |

**Scope limits, stated plainly:**

- Binary model. Other attack families in this architecture are not yet covered
  by this detector, so all three scenarios run the same real family against
  three device classes. That isolates criticality and prior-case availability as
  the variables driving routing, rather than confounding them.
- The capture CSVs are post-feature-extraction and carry no addresses. Device
  attribution comes from the registry in `app/incidents.py`; in deployment the
  Edge Gateway supplies it.
- Attack suppression is not measured: it needs a gateway traffic counter this
  PoC has no source for, so it is reported as `-1` ("not measured") rather than
  estimated. Availability and recovery **are** measured - see §2.3.

### 2.3 Availability monitor

An independent probe runs for the life of every incident, sending **2 HTTP
requests per second** to the edge gateway's health endpoint:

```
200            -> service answering, legitimate traffic flowing
anything else  -> outage (5xx, 4xx, timeout, connection refused)
```

This is the component that answers §18's outcome question — *did legitimate IoMT
communication continue or recover?* — with a measurement rather than an
assumption. It shares no code and no signal with the detector: the detector says
an attack is happening, the probe says whether the service came back.

Availability is reported per phase, because a whole-run average mostly measures
how long the observation lasted:

| Phase | Typical live run |
|---|---|
| Baseline (before attack) | **100%** · 12 probes |
| Under attack | **0%** · 45 probes |
| After recovery | **100%** · 17 probes |
| Time to recovery | **0.53s** after the action was applied |

The outcome label is derived from this and nothing else: no recovery observed →
`FAILURE`; recovery but a degraded run → `PARTIAL`; clean recovery → `SUCCESS`.
No probe samples at all → `UNVALIDATED`, and an unvalidated outcome is never
written to memory.

`GATEWAY_HEALTH_URL` selects the target. It defaults to a built-in stub that
genuinely returns 503 while saturated and 200 once contained; the probing is
real either way, and pointing it at the testbed gateway changes nothing in the
monitor.

### 2.2 Evidence provenance

Every specialist finding carries a `provenance` tag, and a worker that cannot
compute something from a real source declares itself `unavailable` rather than
producing a plausible number.

| Worker | Provenance | What it actually reports |
|---|---|---|
| **LOG-1** Log Analysis | `capture` | `rst_count`, `syn_count`, `ack_count`, `fin_count`, flag ratios — each against the benign baseline |
| **TIA-1** Threat Intel | `unavailable` | nothing: no feed is configured and the feature schema has no addresses to look up |
| **DCX-1** Device Context | `registry` | device class, criticality, allowed/denied action set — testbed metadata, not data |
| **TRF-1** Traffic Analysis | `capture` | flow rate, packet size, header length, protocol mix vs baseline; **source cardinality = unknown** |
| **HIS-1** History Analysis | `case-store` | prior cases for this device class and attack subtype, counted from the real store |

Two consequences worth understanding, because both are the design working:

**Log Analysis reports the direction the data actually shows.** During this
flood `rst_count` sits at **0.17x** the benign baseline — *below* normal, not
above. The intuitive "connection failures spike" story is wrong here: with
zero SYN/ACK/FIN counts, the flood never reaches connection state at all. An
invented finding would have said the opposite.

**Source cardinality is unknown, and that changes the response.** The feature
schema has no addresses, so Traffic Analysis cannot say whether the flood is
single-source or distributed. It says so; `agents._constraints` then adds
*"single-source blocking disallowed"*; and the deterministic table selects
upstream rate limiting instead of a source block. A fabricated fan-out would
have silently unlocked an action we cannot justify.

The Memory Agent handles the same gap by **renormalising** its similarity
weights over the fields that exist rather than scoring the missing one as a
mismatch — otherwise an identical incident would drop below the reuse floor for
a reason unrelated to how similar it is. `compared_fields` records which terms
were used.

Advisory workers (currently just Threat Intel) record an evidence gap when
absent but do **not** degrade the measured outcome, because no decision was
allowed to depend on them.

### Why the sub-agents are separate processes

They are independent, individually-timeoutable evidence sources. Separating them
gives three things a single monolithic investigator cannot: concurrent execution
(latency), per-worker timeouts (one stalled log backend cannot stall
containment), and selective invocation (the Planner can call two of five when
the prior case already covers the rest).

**HIS-1 vs the Memory Agent** — these answer different questions and are easy to
confuse. Memory asks *"have we solved something like this before, and did it
work?"* HIS-1 asks *"is this the fourth time this source has hit this device
tonight?"* Memory changes **which action** is chosen; recurrence changes **how
long** it runs. A first occurrence and a repeat offender warrant the same
containment measure at different durations.

---

## 3. Routing

```
                         Detector event
                               │
                        ┌──────▼──────┐
                        │   PLANNER   │  risk assessment
                        └──────┬──────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
                  LOW       MEDIUM    HIGH / NOVEL
                    │          │          │
              memory check  memory     memory
                    │          │          │
              (skip inv.)  delta inv.  full inv. (5 specialists)
                    │          │          │
              (skip expl.)  1-line     detailed + XAI
                    │          │          │
                    └──────────┼──────────┘
                               ▼
                       Response (recommend)
                               ▼
                    Policy Gate (deterministic)
                       PASS │ DOWNGRADE │ ESCALATE
                               ▼
                     Execute → Validate outcome
                               ▼
                     Memory write-back (case + outcome)
```

**Path selection** (`Planner.route`):

| Condition | Path |
|---|---|
| device criticality = Critical, **or** real detector confidence < 0.95 | HIGH |
| similarity band = HIGH **and** criticality ∈ {Low, Medium} | LOW |
| otherwise | MEDIUM |

**Specialist selection** (`Planner.select_specialists`):

| Path / band | Specialists invoked |
|---|---|
| HIGH, or band = NONE | all 5 |
| band = PARTIAL | log + traffic + history (the delta) |
| band = HIGH, path = MEDIUM | traffic + history (the facts most likely to have changed) |
| band = HIGH, path = LOW | none — verify-and-adapt |

On the LOW path the Investigator makes **no LLM call at all**: a near-identical
validated case already carries the reasoning, and spending a generative call
there would defeat the purpose of a fast path. Measured cost per incident is
1 LLM call on LOW, 3 on MEDIUM and HIGH, 0 with the providers down.

**Explanation depth:** LOW → none, MEDIUM → one line, HIGH → detailed + XAI.
Explanation is never on the containment critical path.

> Risk routing and similarity routing are related but not identical. A 0.96-similar
> incident is still high-risk if the target device is more critical than the one in
> the prior case, or if the previous response is unsafe in the current context.

---

## 4. Memory Agent — where the adaptation actually is

### 4.0 Two tiers: primary store and secondary cache

| | Primary | Secondary |
|---|---|---|
| What | the full case store | a queue of copies of recently-useful cases |
| Size | unbounded | **10 entries** |
| Lifetime | permanent (until reliability decays) | **5 attacks**, refreshed on every hit |
| Cost | scores **every** case — grows with the store | scores at most 10 — constant |
| Authority | source of truth | copies only |

**How an entry gets in.** When primary confirms a match — incident B matched
stored case A — a *copy of A* is promoted into the cache. The next incident
checks those ≤10 entries first; only on a miss does it pay for the full scan.

**How an entry leaves.** Its lifetime is counted in attacks, not seconds. Each
incident that does not hit it costs one life; a hit refreshes it back to five.
Five attacks without a match and it is dropped. If the queue is full, the least
recently useful entry is evicted to make room.

```
incident 1  primary answers (488µs, 7 cases)  -> promote CASE-2025-104, ttl 5
incident 2  CACHE HIT (370µs, 1 entry)        -> primary not scanned, ttl back to 5
incident 3  miss                              -> ttl 4
incident 4  miss                              -> ttl 3
incident 5  miss                              -> ttl 2
incident 6  miss                              -> ttl 1
incident 7  miss                              -> aged out
```

**Measured cost, including where it does not pay.** `GET /api/memory/benchmark`
times the same incident against progressively larger stores:

| store size | primary | cache (10 entries) | speedup |
|---|---|---|---|
| 7 | 664µs | 1226µs | **0.5x — cache is slower** |
| 100 | 8.7ms | 1226µs | 7.1x |
| 1 000 | 153ms | 1226µs | 125x |
| 10 000 | 1.27s | 1226µs | 1038x |

At the current seven-case store the cache is a **net cost**: it scores ten
entries to avoid scoring seven. That is worth saying out loud rather than
hiding — the tier is an architectural bet on the store growing, and the
crossover is somewhere around 10–15 cases.

**The cache is a performance tier, never a safety one.** Entries are copies of
already-validated cases and they pass exactly the same reuse gate — similarity,
context compatibility, reliability — as a primary hit. A cached case can never
authorise something the primary store would refuse.

The Memory Agent does **not** retrain the detector and does **not** fine-tune a
model. It stores what happened and retrieves it when something comparable
arrives. That distinction matters: "improves over time" here means *less
duplicated reasoning and fewer repeated bad actions*, not silent model drift.

### Case representation

```
attack_family / attack_subtype     specialists_used
device_type / device_criticality   recommended_response
behavioral_signature               executed_response
source_cardinality                 outcome  (SUCCESS|PARTIAL|FAILURE|HARMFUL)
peak_rate                          containment_latency_s
investigation_summary              reuse_count, reliability, confidence
```

### Similarity

A weighted structured score, so a reviewer can see exactly *why* two cases
matched:

| Field | Weight |
|---|---|
| attack_subtype | 0.30 |
| device_type | 0.20 |
| attack_family | 0.15 |
| device_criticality | 0.15 |
| source_cardinality | 0.12 |
| rate band | 0.08 |

An optional embedding term over the behavioural signature is blended at 25%. It
is deliberately never dominant: an embedding must not outvote the structured
facts.

### The reuse gate

Similarity alone never authorises reuse. **All three** must hold:

```
similarity        ≥ 0.92 (HIGH) or ≥ 0.75 (PARTIAL)
prior reliability ≥ 0.80
context_compatible = true
```

Context compatibility fails when the prior outcome was FAILURE or HARMFUL, when
the target is life-critical and the prior case was not, or when the prior action
is irreversible and the target class forbids it.

The thresholds are high on purpose. In cybersecurity the same attack family
against a different device class can require a completely different response,
and in a hospital the cost of a wrong reuse is measured in patient care, not
downtime.

### Reliability accounting

New case starts at **0.5 — unproven.** One success does not make a case trusted;
it has to survive re-validation before it can drive a fast path.

| Result when reused | Δ reliability |
|---|---|
| SUCCESS | +0.02 |
| PARTIAL | −0.06 |
| FAILURE / HARMFUL | −0.25 |

Slow to build, fast to lose — the correct asymmetry when the downside is patient
harm. `CASE-2025-118` in the seed store is the worked example: VLAN quarantine
did suppress a publish flood, but dropped an infusion pump's clinical heartbeat
for 26 seconds. It sits at reliability 0.12 and is permanently blocked for
life-critical device classes. That is memory preventing a repeat, which a static
signature IDS cannot do.

### Behaviour with the API keys switched off

Because memory stores *actions and measured outcomes* rather than model weights,
it keeps working with no LLM. The system falls back to retrieval plus the
deterministic policy table: it still recognises attack families it has validated
before, still adapts the action to the device class, and still refuses actions
previously recorded as HARMFUL. It will **not** match a fully-online run on
genuinely novel incidents, and we do not claim it will — the honest claim is
better-than-static-IDS on known families, degraded on novel ones.

---

## 4.5 The Response Agent is hybrid — here are the deterministic rules

The Response Agent has two halves. The LLM half recommends; the rule half
constrains and, when the model is unavailable or returns something unusable,
replaces it. Neither half executes.

**Half 1 — constraint derivation** (`agents._constraints`), computed from
specialist output before the model is even called, and **appended** to whatever
the model returns rather than replaced by it:

| Condition | Constraint added |
|---|---|
| Device Context says life-critical | `device_isolate DENIED (life-critical class)` |
| Device Context unavailable | `device_isolate DENIED (device class unresolved — failing safe)` |
| Source cardinality unknown or missing | `single-source blocking disallowed, prefer upstream rate limiting` |
| Source cardinality ≠ single | `single-source blocking ineffective — prefer upstream rate limiting` |
| Always | `duration <= 300s without human approval` |
| Any evidence gap | `confidence reduced: incomplete evidence` |

**Half 2 — the deterministic action table** (`agents.FALLBACK_TABLE`), keyed on
(life-critical × source cardinality). Every entry is inside the pre-approved
safe action set, so it can never propose something the Policy Gate has not
already sanctioned:

| life-critical | cardinality | action | duration |
|---|---|---|---|
| yes | single | `upstream_rate_limit` | 120s |
| yes | few | `upstream_prefix_ratelimit` | 180s |
| yes | distributed | `upstream_rate_limit` | 300s |
| yes | **unknown** | `upstream_rate_limit` | 120s |
| no | single | `temp_source_block` | 300s |
| no | few | `upstream_prefix_ratelimit` | 180s |
| no | distributed | `upstream_rate_limit` | 300s |
| no | **unknown** | `upstream_rate_limit` | 300s |

`unknown` is a real row, not a fallback-of-a-fallback. With these captures it is
the row that actually fires.

**Output validation.** An LLM recommendation is accepted only if `action` is in
the allowed set — `upstream_rate_limit`, `upstream_prefix_ratelimit`,
`temp_source_block`, `connection_cap`, `device_isolate`, `alert_escalate`.
Anything else is treated exactly like a failure and the table takes over.
`device_isolate` is forced non-reversible regardless of what the model claims.

## 5. Safety boundary

```
Evidence
   │
   ▼
Response Agent (LLM or rule-assisted)   ← recommends
   │
   ▼
Deterministic policy checks             ← decides
   RULE-01 source not allowlisted
   RULE-02 detector confidence ≥ 0.80
   RULE-03 duration ≤ 300s unattended
   RULE-04 action permitted for device class
   RULE-05 action reversible on life-critical device
   │
   ├── PASS ─────────► execute
   ├── DOWNGRADE ────► execute nearest permitted action, log the rejection
   └── ESCALATE ─────► execute nothing, hand to a human with all evidence
```

The gate **fails closed**: an unevaluable rule is an ESCALATE. A blocked source
or an untrusted detector produces ESCALATE rather than a downgrade, because
there is nothing safe to downgrade *to*.

Downgrades are logged as rejections, which keeps the Response Agent's error rate
measurable rather than invisible.

---

## 6. Failure modes and fallbacks

| Component | Failure | Behaviour |
|---|---|---|
| Edge Gateway | capture stalls | Planner holds in CAPTURED, availability alert. No response on stale features. |
| Detector | model unavailable | rule/threshold detector at reduced precision; run marked degraded and **forced onto the HIGH path** — confidence is untrusted, so the fast path is withdrawn. |
| Memory | vector store down | treated as empty → full investigation. Slower and more LLM calls, but zero wrong-reuse. Write-back queued to a durable outbox and replayed. |
| Specialist worker | timeout / unavailable | returns `status=unavailable` with **no findings**. Never fabricates. Investigator records the evidence gap and lowers confidence. |
| History Analysis (HIS-1) specifically | incident log unavailable | recurrence treated as zero → shortest safe containment duration. Under-reacting on duration is recoverable; over-reacting on a life-critical device is not. |
| Device Context specifically | unavailable | Policy Gate assumes the **most restrictive** device class. Isolation denied; only reversible actions remain. |
| Traffic Analysis specifically | unavailable | source cardinality unknown → single-IP blocking disallowed (may be ineffective against a distributed source); prefer upstream rate limiting. |
| Investigator | LLM unavailable | deterministic evidence fusion; identical object shape, `confidence_source="rules"`. |
| Any agent | one provider key rate-limited | key parked 60s, next key in the pool serves the call. Pool exhausted → next provider. Chain exhausted → deterministic rules. |
| Explainer | LLM unavailable | slot-filled template. Never on the critical path — the run continues either way. |
| Response | LLM unavailable | deterministic table keyed on (device class × source cardinality). Narrower coverage, but every entry is inside the pre-approved safe action set. |
| Policy Gate | cannot evaluate | ESCALATE. This layer *is* the fallback. |
| Actuator | apply fails | rollback to pre-action state + ESCALATE. |
| Actuator | telemetry missing | outcome = UNVALIDATED and the case is **not** stored. Never learn from an unmeasured action. |

### If the Planner itself fails

**Target design:** persist each transition before invoking the next agent so a
supervisor can resume safely from a committed checkpoint. **Current PoC:** the
runtime journals transition events, but the executing controller remains
in-memory. A process restart marks the run interrupted and does not replay it;
any unresolved action intent is marked unknown and requires reconciliation.

```
crash → mark run interrupted → mark unresolved effect unknown → human review
        └── no autonomous restart or action retry
```

When a future supervisor reaches **SAFE_HOLD**, detection and alerting may
continue, but no autonomous action executes without a human. The current PoC
instead ends the interrupted run and requires an operator to start a new one.
Containment authority is never inherited by a partially-working orchestrator.

The Planner also supervises the agents beneath it: an agent that fails, times
out, or returns a malformed object is retried once, then routed around, with the
evidence gap recorded rather than hidden.

### The invariants

Whatever fails, three things never change:

1. No action executes without passing the deterministic policy gate.
2. No case is written to memory without a measured outcome.
3. Every degradation is recorded on the incident, so the run can be
   reconstructed afterwards.

---

## 7. LLM handling

`app/llm.py` never raises. `complete_json` returns `None`, and the calling agent
takes its deterministic path. `None` is a normal outcome, not an error.

Four layers, innermost first:

1. **Key rotation** — each provider holds a pool of keys. A 429/401 parks that
   key for 60s and the next one serves the call. Free-tier inference limits
   per key, and one incident fires up to three agent calls.
2. **Provider failover** — when a whole pool is spent, the next provider in the
   chain gets the same prompt.
3. **Circuit breaker** — after 4 consecutive whole-chain failures the circuit
   opens for 30s, so an outage runs deterministically at full speed instead of
   paying the timeout on every call. A half-open probe reopens it.
4. **Schema validation** — a malformed or hallucinated response is treated
   exactly like a failure. Downstream agents see a valid object or nothing.

```
groq key 1 → groq key 2 → gemini key 1..5 → deterministic rules
```

Pool state is process-wide: a key exhausted by one incident stays parked for the
next. `/api/health` exposes chain, per-provider key availability, cumulative
calls, rotations, failovers and latency; the Agent Simulation runtime bar renders
it live.

Policy-derived constraints are **appended** to whatever the model returns, never
replaced by it.

Where the LLM is *not* used at all: packet capture, feature extraction,
detection, risk thresholds, vector search, policy validation, action execution,
storage, alerts.

---

## 8. Service and integration

FastAPI (`backend/app/main.py`). Fault injection is a first-class query
parameter, so the same code path serves the demo, the panel and the evaluation
harness.

```
GET  /api/health                  provider status, circuit state, thresholds
GET  /api/scenarios
GET  /api/memory/cases
GET  /api/memory/coverage         attack families × device classes known
POST /api/memory/reset            restore the pristine 7-case seed store
POST /api/simulate                full event list
GET  /api/simulate/stream         Server-Sent Events
     ?scenario=low|medium|high&llmDown=&plannerCrash=&memoryDown=
     &subAgentTimeout=&policyConflict=&speed=
```

The SSE payload is the `SimEvent` union, defined identically in
`backend/app/schemas.py` and `src/agents/types.ts`:

```
run.start · state · node.enter · node.exit · edge · log
artifact · decision · fallback · metric · run.end
```

The Agent Simulation page has a **Local / Live** switch. Local replays a
deterministic build of this stream in the browser (no backend, no keys, cannot
fail mid-demo); Live opens an `EventSource` against the runtime. Both feed the
same `reduce()` in `src/agents/engine.ts`, so every derived value on screen —
route, similarity band, memory rows, fallbacks — comes from the stream rather
than from either producer.

---

## 9. Observability

Every run writes one auditable incident record: detector output and confidence,
risk inputs and the chosen route, the memory query and retrieved case IDs with
scores, which specialists were invoked and why, the structured investigation
result, explanation mode, response recommendation, every policy check with its
pass/fail reason, the executed action identifier, outcome measurements, and LLM
calls/tokens/latency.

This is what makes it possible to separate a **detector error** from a
**routing error** from a **response-policy error** — and to replay the same
incident through full-investigation, similarity-only and adaptive variants for
the evaluation.

---

## 10. Implementation order

1. Edge pipeline → 2. Detector → 3. Controller state machine (deterministic
tests, no LLM) → 4. Case schema + memory → 5. Similarity-path logic →
6. Investigator + specialists → 7. Explanation → 8. Response policy →
9. Outcome validation → 10. Memory write-back → 11. Event-driven parallelism →
12. Evaluation.

Deterministic workflow behaviour first; LLM reasoning inserted only into the
stages that benefit from it.
