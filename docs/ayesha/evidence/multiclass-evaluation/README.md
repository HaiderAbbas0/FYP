# Multiclass evaluation ? 12 Oct 2026 (full 13-class run)

Produced by `backend/evaluate_multiclass.py`. Re-generate with:

```powershell
cd backend
.\.venv\Scripts\python.exe evaluate_multiclass.py
```

**All 13 declared classes are now covered.** The earlier run scored only 6
because the remaining test captures were not present in `data/`; they have since
been added. This run is the full CICIoMT2024 official `*_test` split held out
from training: **1,583,015 rows over 15 capture files, 1,078 s wall time.**

## Results

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

Macro-F1 **0.7448**, accuracy **0.7800**, benign false-alarm rate **0.0000**
(one benign row in 37,607 called an attack). Top-label ECE **0.0563** ? much
better calibration than the 0.15 measured on the 6-class subset. Local CPU
latency 20.8 ms p50 single row, 453 ms for a 512-row batch.

## What the wider dataset changed

**1. The DoS/DDoS confusion is broader than the TCP-only run suggested.** With
both sides of every pair now present, the confusion can be measured properly:

| Pair | A?B | B?A | Swap rate |
|---|---|---|---|
| MQTT-DoS-Connect / MQTT-DDoS-Connect | 54 | 13 | **0.15 %** |
| DoS-SYN / DDoS-SYN | 5,743 | 15,928 | **8.35 %** |
| DoS-TCP / DDoS-TCP | 38,199 | 9,860 | **18.20 %** |
| DoS-ICMP / DDoS-ICMP | 67,823 | 34,106 | **22.80 %** |
| DoS-UDP / DDoS-UDP | 70,536 | 97,097 | **33.59 %** |
| MQTT-DoS-Publish / MQTT-DDoS-Publish | 0 | 7,407 | **43.86 %** |

Only the MQTT Connect pair is cleanly separated. UDP is the worst case: the
model calls 97,097 genuinely-DDoS rows `DoS-UDP`, which is why its recall is
0.7314 despite a precision of 0.7887.

The cause is structural, not a training defect. These CSVs are post-extraction
flow features with no source addresses, so **nothing in the feature set encodes
attacker count**. Any classifier working from this schema faces the same ceiling.
`agents/detector/verification.py` reports this per pair from the confusion matrix
rather than asserting it, and `label_uncertainty()` carries the caveat into the
incident evidence at runtime.

**2. UDP is the weakest family overall**, not just at the DoS/DDoS split.
`DoS-UDP` (F1 0.444) and `DoS-ICMP` (F1 0.374) are the two lowest scores in the
table. A UDP flood and an ICMP flood both produce high-rate, low-packet-size
traffic that looks like the benign volumetric profile far more than TCP does.

**3. MQTT Connect is genuinely excellent** ? 0.15 % swap, F1 0.9992. The MQTT
pair confusion is one-sided: the model systematically reads `MQTT-DDoS-Publish` as
`MQTT-DoS-Publish` (7,407 of 8,416 rows) and never the reverse.

## Bearing on the activation decision

The binary and family levels are now measured across the full dataset and hold
up: **zero false alarms on 37,607 benign rows**, and every attack family is
detected as an attack. What does not hold up is the **13-class variant level**,
where 9 of 13 classes sit in a DoS/DDoS pair the model cannot separate.

`GET /api/detector/multiclass/info` reports this directly: 13 declared,
4 verified, 0 unevaluated, 9 not separable.

Nothing here is evidence of live containment, attack suppression or clinical
safety.

**This evaluation is the basis on which multiclass became the default
capture-replay detector** (12 Oct 2026). The legacy binary RandomForest remains
reachable as an explicit `IDS_DETECTOR=legacy` fallback.
