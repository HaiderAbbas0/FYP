# Pipeline evaluation ? 12 Oct 2026

Produced by `backend/pipeline_evaluation.py`. Re-generate with:

```powershell
cd backend
$env:IDS_DETECTOR = 'multiclass'
.\.venv\Scripts\python.exe pipeline_evaluation.py
```

This is the **pipeline** evaluation, not the detector evaluation. The detector
evaluation (in `../multiclass-evaluation/`) asks whether the model can name an
attack. This one asks what gates switching the default: given that prediction,
does every downstream layer handle it correctly and safely?

## Result

| | |
|---|---|
| Detector mode | `multiclass` |
| Policy version | `policy-v2` |
| Scenarios evaluated | 5 of 5 |
| Checks | **140 passed, 0 failed** |
| Exit code | 0 |

| Scenario | Variant detected | Shape | Response | Policy |
|---|---|---|---|---|
| `low` | `DoS-TCP` | bandwidth | `upstream_rate_limit(300s)` | PASS |
| `medium` | `DoS-TCP` | bandwidth | `upstream_rate_limit(300s)` | PASS |
| `high` | `DoS-TCP` | bandwidth | `upstream_rate_limit(300s)` | PASS |
| `mqtt-dos-connect` | `MQTT-DoS-Connect` | connection | `connection_cap(180s)` | PASS |
| `mqtt-ddos-publish` | `MQTT-DoS-Publish` | session | `upstream_prefix_ratelimit(180s)` | PASS |

Confidence was 0.8798?0.9327 across the five runs. The `high` scenario ? a
partially contaminated flood against a life-critical gateway ? correctly scored
lowest of the five, and its traffic evidence reported a 42.13x flow-rate surge.

## What each stage was checked for

| Stage | Check | Result |
|---|---|---|
| Detector | Produces windows; fires on the attack window | 5/5 |
| Detector | Labels fall inside the 13 declared classes | 5/5 |
| Detector | Confidence in range and its kind declared | 5/5 |
| Evidence | `connection_fanout` stays 0 ? no source address invented | 5/5 |
| Routing | Attack shape matches the scenario's expected shape | 5/5 |
| Routing | Routing confidence **is** the detector's confidence, not a second number | 5/5 |
| Evidence | Traffic and log workers report the same shape as routing | 5/5 |
| Evidence | A session flood is never narrated as a bandwidth flood | 1/1 |
| Evidence | Session attacks mark TCP counters non-diagnostic | 1/1 |
| Evidence | DoS/DDoS ambiguity recorded wherever it applies | 4/4 |
| Response | Recommendation matches the attack shape | 5/5 |
| Response | Action is in the bounded catalog | 5/5 |
| Response | Shape and cardinality recorded for the policy gate to read | 5/5 |
| Policy | Verdict is PASS or DOWNGRADE, never an unsafe execution | 5/5 |
| Policy | RULE-08 present on every decision | 5/5 |
| Policy | Executed action within shape permission | 5/5 |
| Safety | No irreversible action on a critical device | 5/5 |
| Safety | Action never taken against an allowlisted clinical source | 5/5 |
| Safety | Duration within the 300s unattended limit | 5/5 |
| Memory | Behavioural signature is variant-aware | 5/5 |
| Reproducibility | Manifest records the active detector, policy version and bundle hash | 5/5 |
| Failure modes | Unknown label, low confidence, allowlisted source, missing context all fail closed | 5/5 |

## The harness was checked against a broken system

140/140 on the first run is itself a risk: a suite that cannot fail proves
nothing. The response agent was temporarily mutated to ignore attack shape, and
the harness was re-run:

```
checks: 138/140 passed, 2 failed
  FAIL [mqtt-dos-connect] response.matches_attack_shape: upstream_rate_limit (expected connection_cap)
  FAIL [mqtt-ddos-publish] response.matches_attack_shape: upstream_rate_limit (expected upstream_prefix_ratelimit)
exit code: 1
```

The harness detects a broken system, names the exact failing check, and returns
a non-zero exit code. The originals were restored and the clean report above
re-generated.

## Coverage and what this does NOT establish

Exercised: **3 of 13** declared classes ? `DoS-TCP`, `MQTT-DoS-Connect`,
`MQTT-DoS-Publish`. Of the recorded verification, those three are the two
verified MQTT classes plus `DoS-TCP`, which is `not_separable` from
`DDoS-TCP` at a 0.4653 swap rate.

Not established by this run:

- **Live lab and the physical gateway** are not exercised. The actuator is a
  stub, so this proves authorisation and routing, **not containment**.
- **Attack suppression remains unmeasured** (`-1`). Without an independent
  traffic counter nothing here shows the attack actually stopped.
- **7 of 13 classes have no local capture** and were not exercised at all.
- **Live LLM reasoning was not used**; every agent took its deterministic path,
  so LLM-specific failure paths are untested here.

## Bearing on the activation decision

The pipeline handles every multiclass label it was given, in all three attack
shapes, without a safety violation. That is the evidence needed to say the
runtime can be switched to `multiclass` **for the binary and family/subtype
levels**.

It is not evidence for the 13-class variant level. `DoS-TCP` in this run is the
concrete reason: the detector reported it, the pipeline behaved correctly, and
the label is still not trustworthy ? the ambiguity is recorded on the evidence
rather than silently trusted.
