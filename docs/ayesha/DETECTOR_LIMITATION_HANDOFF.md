# Known limitation ? DoS and DDoS cannot be separated (handoff to detector owner)

**To:** Hamd Ul Haq (23i-0081)
**From:** Ayesha Ikram (23i-0109) ? runtime integration and evaluation
**Date:** 12 October 2026
**Re:** The staged 13-class bundle cannot distinguish a DoS from a DDoS of the
same protocol. This is a property of the capture schema, not a training defect.
**Action:** detector-side decision needed ? see "Options" below.

---

## 1. What was measured

The staged bundle was scored over the **complete** CICIoMT2024 official `*_test`
split now present in `data/` ? **1,583,015 rows across all 13 classes**, 15 capture
files. Nothing was sampled or truncated.

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Benign | 0.9995 | 1.0000 | 0.9997 | 37,607 |
| DoS-SYN | 0.8526 | 0.9417 | 0.8950 | 98,595 |
| DoS-TCP | 0.8158 | 0.5347 | 0.6460 | 82,096 |
| DoS-UDP | 0.4080 | 0.4870 | 0.4440 | 137,553 |
| DoS-ICMP | 0.4718 | 0.3097 | 0.3739 | 98,432 |
| DDoS-SYN | 0.9643 | 0.9021 | 0.9322 | 172,397 |
| DDoS-TCP | 0.8161 | 0.9453 | 0.8759 | 182,598 |
| DDoS-UDP | 0.7887 | 0.7314 | 0.7590 | 362,070 |
| DDoS-ICMP | 0.8230 | 0.9022 | 0.8608 | 349,699 |
| MQTT-DoS-Connect | 0.9948 | 0.9818 | 0.9883 | 3,131 |
| MQTT-DoS-Publish | 0.5343 | 0.9998 | 0.6964 | 8,505 |
| MQTT-DDoS-Connect | 0.9987 | 0.9996 | 0.9992 | 41,916 |
| MQTT-DDoS-Publish | 0.9862 | 0.1185 | 0.2115 | 8,416 |

Macro-F1 0.7448, accuracy 0.7800, **benign false-alarm rate 0.0000** (one row in
37,607 called an attack), top-label ECE 0.0563.

Reproduce with `cd backend && .venv\Scripts\python.exe evaluate_multiclass.py`.
Full output: `docs/ayesha/evidence/multiclass-evaluation/`.

**Binary detection is not the problem.** Benign is separated essentially perfectly,
and every attack family is detected as an attack. The failure is confined to
telling a single attacker from many at the same protocol.

## 2. The exact failure

Same-protocol DoS/DDoS pairs are mixed together. Rates are computed from the
recorded confusion matrix as `1 - (correct / total)` over the two-class block:

| Pair | A predicted as B | B predicted as A | Swap rate |
|---|---|---|---|
| MQTT-DoS-Connect / MQTT-DDoS-Connect | 54 | 13 | **0.16 %** |
| DoS-SYN / DDoS-SYN | 5,743 | 15,928 | **8.35 %** |
| DoS-TCP / DDoS-TCP | 38,199 | 9,860 | **18.20 %** |
| DoS-ICMP / DDoS-ICMP | 67,823 | 34,106 | **22.80 %** |
| DoS-UDP / DDoS-UDP | 70,536 | 97,097 | **33.59 %** |
| MQTT-DoS-Publish / MQTT-DDoS-Publish | 0 | 7,407 | **43.86 %** |

The MQTT-Publish confusion is one-sided: 7,407 of 8,416 genuinely-DDoS rows are
read as DoS, and the reverse never happens.

## 3. Root cause ? measured, not inferred

The feature distributions of a DoS and a DDoS capture are numerically almost
identical. Mean over the first 20,000 rows of each official test capture:

| | `DoS-UDP` | `DDoS-UDP` | ratio |
|---|---|---|---|
| `Rate` | 32,834.11 | 32,794.29 | **1.001** |
| `Srate` | 32,834.11 | 32,794.29 | **1.001** |
| `Drate` | 0.00 | 0.00 | 1.000 |

| | `DoS-TCP` | `DDoS-TCP` | ratio |
|---|---|---|---|
| `Rate` | 8,591.17 | 12,509.65 | 0.687 |

A DoS and a DDoS of the same protocol differ by roughly **0.1 %** in flow rate.

**The reason is structural.** The captures are post-extraction flow features.
All 45 columns were inspected for anything identifying *how many* distinct hosts
sent the traffic. There is none:

```
Header_Length, Protocol Type, Duration, Rate, Srate, Drate,
fin/syn/rst/psh/ack/ece/cwr_flag_number, ack/syn/fin/rst_count,
HTTP, HTTPS, DNS, Telnet, SMTP, SSH, IRC,
TCP, UDP, DHCP, ARP, ICMP, IGMP, IPv, LLC,
Tot sum, Min, Max, AVG, Std, Tot size,
IAT, Number, Magnitue, Radius, Covariance, Variance, Weight
```

No source address, no destination address, no distinct-source count. (`IPv` is a
protocol-presence ratio ? observed values 0.96, 0.98, 0.99, 1.0 ? not an
address.)

**So the label is not derivable from the features.** A DoS is one source and a
DDoS is many, but both present the same 45 numbers to the classifier. No model
trained on these columns can recover the distinction, because the information
was discarded when the dataset was built.

This is not a hyper-parameter problem, a class-balance problem, or a calibration
problem. It is the ceiling of the input representation.

## 4. Why UDP and TCP differ

TCP retains handshake counters (`syn_count`, `ack_count`), and distributed TCP
attackers behave slightly differently at that layer ? a faint but real signal,
hence 18 % rather than 50 %.

UDP has no handshake at all, so there is not even that hint. ICMP sits in between
at 22.8 %. MQTT-Connect is the outlier at 0.16 %, most likely because broker
connect bursts have their own signature that happens to track source count in
these particular captures.

## 5. What will not fix this

Each of these was considered and rejected:

| Idea | Why it fails |
|---|---|
| More training rows for these classes | The signal is absent, not rare |
| Different model or hyperparameters | Same input, same ceiling |
| SMOTE / oversampling the DoS half | Manufactures rows the capture cannot justify |
| Class weighting | Shifts which errors occur, cannot create the missing signal |
| Threshold tuning on the 13 classes | Trading one pair's errors for another's |
| Ensembling / longer training | Capacity is not the constraint |

**Any fix that uses these capture files alone cannot succeed.** This is worth
stating plainly, because it means the work is not "try harder on training".

## 6. Options

### Option A ? Collapse to the levels the data supports (recommended)

Train and ship a **6-class variant model** over exactly:

```
Benign, DoS-TCP, DoS-SYN, DoS-UDP, DoS-ICMP, MQTT-Flood
```

Every one of these is currently reliable. The existing 13-class bundle already
computes these levels by summing class probabilities, so the collapse matrix
exists and is exercised ? it just needs to become the shipped label set.

This aligns the model with what the runtime routes on. The pipeline already keys
off family/subtype (`backend/app/attack_class.py`), and the detector's family
level is sound across the whole dataset.

*Effort: small. The level-collapse matrices are already in the bundle.*

### Option B ? Add source-derived features and retrain

If a capture set that retains addresses is obtainable, add features that carry
attacker count ? distinct sources, unique source prefix count, source entropy.
Then DoS/DDoS becomes separable and the 13 classes become defensible.

*Effort: dataset acquisition, feature engineering, full retrain and
re-evaluation. A project rather than a task, and dependent on data availability.*

### Option C ? Keep 13 classes, ship the uncertainty (current runtime behaviour)

This is what the system does today. `agents/detector/verification.py` reports
each class against a stated standard, and `label_uncertainty()` writes the
caveat into every affected incident record so no downstream consumer can present
the label as settled.

*Effort: none. Already implemented and covered by tests.*

## 7. What the runtime needs from the detector side

1. **A decision on Option A or B.** The runtime already behaves correctly for all
   three, but the shipped label set should match what the evidence supports.
2. **If Option A:** confirmation that the family/subtype level is the intended
   contract, and the bundle re-saved with those 6 classes primary.
3. **If Option C is retained:** no detector change needed. The runtime reports
   13 declared / 4 verified / 0 unevaluated / 9 not separable from
   `GET /api/detector/multiclass/info`, and marks each DoS/DDoS incident at
   runtime.
4. **If Option B:** the feature schema identity changes, so
   `agents/detector/multiclass.py` needs the new column list and
   `agents/detector/verification.py` should gain the new pairs.

## 8. Current runtime position

`IDS_DETECTOR` now defaults to `multiclass` on the strength of the measurements
above: zero benign false alarms over 37,607 rows and every attack family
correctly identified as an attack. The binary and family/subtype levels are what
the response, policy and memory layers route on, and all of them work.

What is **not** claimed anywhere in the system is 13-class variant accuracy.

## 9. Related files

| Path | What |
|---|---|
| `docs/ayesha/evidence/multiclass-evaluation/` | Full metrics, confusion matrix, per-file breakdown, this analysis |
| `agents/detector/verification.py` | `VERIFICATION_STANDARD` and per-class status |
| `backend/evaluate_multiclass.py` | Reproduces the evaluation |
| `agents/detector/multiclass.py` | Adapter; `label_uncertainty()` |
| `docs/hamd/detector.md` | Your design record (read, not modified) |

Teammate documents were not edited.
