# Multiclass evaluation — 11 Oct 2026

Produced by `backend/evaluate_multiclass.py` (which calls
`agents.detector.evaluate.run_evaluation`). Re-generate with:

```powershell
cd backend
.\.venv\Scripts\python.exe evaluate_multiclass.py
```

**This is not a full CICIoMT2024 TEST result.** It scores only the official
`*_test` captures present in this workspace — 6 of the 13 training classes.
Seven classes (`DoS-SYN`, `DoS-UDP`, `DoS-ICMP`, `DDoS-SYN`, `DDoS-TCP`,
`DDoS-UDP`, `DDoS-ICMP`) have no local test capture and are therefore untested,
not failing. Do not quote the macro-F1 as the model's accuracy.

## Files

| File | What it is |
|---|---|
| `summary.json` | Scope, per-file prediction breakdown, metrics, confusion, calibration, latency, narrative notes |
| `per_class_metrics.csv` | Precision / recall / F1 / support per class |
| `confusion_matrix.csv` | True label (rows) x predicted label (columns) |
| `per_file.csv` | Per-capture row counts and predicted-label distribution |

## Headline numbers (6 of 13 classes, 181,671 rows, 188 s wall time)

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Benign | 0.9999 | 1.0000 | 0.9999 | 37,607 |
| DoS-TCP | 0.9999 | 0.5347 | 0.6968 | 82,096 |
| MQTT-DoS-Connect | 0.9958 | 0.9818 | 0.9887 | 3,131 |
| MQTT-DoS-Publish | 0.5344 | 0.9998 | 0.6965 | 8,505 |
| MQTT-DDoS-Connect | 0.9987 | 0.9996 | 0.9992 | 41,916 |
| MQTT-DDoS-Publish | 0.9990 | 0.1185 | 0.2118 | 8,416 |

Macro-F1 0.7655 over classes present; accuracy 0.7485. Benign false-alarm rate
0.0000. Top-label ECE 0.15 (mean variant confidence 0.8985 vs mean attack
probability 0.8069).

## What these numbers actually show

**The family/subtype levels are sound; the 13-class variant level is not yet
distinguishable at this granularity.** Every genuine attack is caught. Two
pairs of classes account for nearly all the error:

1. **`DoS-TCP` vs `DDoS-TCP` — 46.53 % swap rate** (38,199 of 82,096). The
   model splits this capture almost exactly in half. This is the same variant
   confusion already visible in Hamd's live validation, so it is a model
   property, not an adapter bug. Per the capture schema, these CSVs are
   post-feature-extraction and carry no source addresses, so the feature set
   contains no evidence of attacker count. The adapter correctly reports
   `source_cardinality: unknown` rather than inferring it.
2. **`MQTT-DoS-Publish` vs `MQTT-DDoS-Publish` — asymmetric collapse.** The
   8,505-row `MQTT-DoS-Publish` capture is called `MQTT-DDoS-Publish` 997 times
   and correctly 8,503 times (recall 0.9998). The 8,416-row
   `MQTT-DDoS-Publish` capture is called `MQTT-DoS-Publish` 7,407 times and
   correctly only 997 times (recall 0.1185). Precision stays high (0.999) but
   recall collapses. One direction of this pair is effectively unusable at the
   variant level today.

**Benign traffic is not the risk.** 0.0000 false-alarm rate across 37,607 rows,
with exactly one benign row predicted as an attack.

**Calibration is usable but loose.** ECE 0.15 is consistent with the runtime's
"calibrated" label and with routing on confidence, but 0.15 is loose enough
that the Planner's `min_action_confidence: 0.80` floor should not be read as a
0.80 posterior.

## Bearing on the "make multiclass the default" decision

The binary and family levels justify activating multiclass for **binary attack
vs benign** and for **family/subtype routing**. They do **not** justify
activating it as a **13-class variant labeller**. If the default is switched,
the variant field must be surfaced in the UI and evidence as *uncertain within
the DoS/DDoS pair*, not presented as a settled label.

Unchanged by this evaluation: the legacy binary RF remains the runtime default
(`IDS_DETECTOR=legacy`), and nothing here is evidence of live containment,
suppression or clinical safety.