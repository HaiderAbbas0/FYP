# Detector — Handoff Notes

**Project:** Adaptive Autonomous Cyber Defense for IoMT Networks (FYP 2026-27)
**Team:** Mohammad Haider Abbas (23i-2558), Hamd Ul Haq (23i-0081), Ayesha Ikram (23i-0109)
**Component:** Detection and Confidence Module, the first stage of the runtime pipeline
**Notebook:** `FYP_IoMT_Multiclass_Detector.ipynb` (replaces `FYP_IoMT_TCP_Flood_Detector_PoC_drive (1).ipynb`)
**Last updated:** 12 Oct 2026 (real results from run `643ad137db` added)

---

## 1. TL;DR and current status

**What exists now.** A Colab notebook that trains and evaluates a **13-class intrusion detector** on all in-scope
CICIoMT2024 Wi-Fi/MQTT CSVs. Classes are Benign plus 12 DoS/DDoS/MQTT flood variants. The notebook does five things:

- Uses **every training row**. Identical rows are stored once with a count, which makes this feasible on Colab free.
- Avoids the leakage that produced the old PoC's **1.0000** score.
- Compares five models (logistic regression, decision tree, Random Forest, XGBoost, LightGBM) under one protocol.
- Selects the best model on validation data, calibrates its confidence, and evaluates it once on the official test captures.
- Saves everything needed for inference to Google Drive and resumes after a Colab disconnect.

**Status:**

| Item | State |
|---|---|
| Notebook code | Done. 43 cells, 20 sections |
| Run end-to-end on synthetic CSVs (same file names and 45 columns as the real data) | ✅ Passed, including a resume run |
| Run on older library versions (scikit-learn 1.6, pandas 2.2, XGBoost 2.1, LightGBM 4.5) | ✅ Passed |
| Compressed (weighted) rows give the same metrics and XGBoost model as raw rows | ✅ Verified |
| **Run on the real CICIoMT2024 data** | ✅ **Done.** Run `643ad137db`: 60/60 captures, 8,618,943 rows, Colab T4 GPU |
| Real numbers in this document | Yes. Section 13 holds the real results |
| Selected model | **LightGBM** (best VAL macro-F1 0.8637) |

**Headline (TEST, selected model, calibrated, 1,583,015 rows):**

| Level | Macro-F1 | Balanced acc. | Accuracy |
|---|---|---|---|
| variant (13) | 0.7448 | 0.7580 | 0.7800 |
| subtype (7) | 0.9992 | 0.9992 | 0.9991 |
| family (4) | 0.8555 | 0.8537 | 0.7855 |
| binary (2) | 0.9999 | 1.0000 | 1.0000 |

Benign false-alarm rate 0.0000 and attacks missed as benign 0.0000. Nearly all 13-class errors are DoS-X ↔ DDoS-X
swaps within the same protocol (§13.5). Quote these numbers, not the synthetic smoke-test ones.

> **Action needed:** sigmoid calibration made TEST calibration *worse* (ECE 0.037 → 0.062). Until it is refitted,
> call `predict_incidents(..., use_calibrated=False)`. See §11.

---

## 2. Where this fits in the project

The FYP pipeline (Revised Pipeline doc) is:

```
IoMT traffic -> Edge gateway (Zeek/Scapy features) -> DETECTOR -> Controller (risk routing)
            -> Memory / Investigation / Explanation -> Response + deterministic policy -> outcome -> case memory
```

The detector must output more than a label. The Controller routes on:

- **attack class**, at several levels of detail;
- **calibrated confidence**, so a "0.9" means about 90% right;
- **evidence**, such as the top features.

The notebook's `predict_incidents()` produces exactly this structured incident object (Pipeline doc Fig. 3).

This notebook covers **Experiment A, the in-domain CICIoMT2024 benchmark** (Dataset Strategy §18). It does **not** cover:

- cross-dataset validation on UL-ECE;
- the own-lab dataset;
- response, outcome or case-memory data.

See §12.

### Source documents (read these for the "why")

| Document | What it defines |
|---|---|
| `IoMT_Dataset_Analysis_and_Final_Data_Strategy.pdf` | Dataset stack, in-scope attacks (§5), leakage rules (§6.3, §14), imbalance policy (§15), preprocessing audit (§16), model plan (§17) |
| `IoMT_Revised_Pipeline_Technical_Architecture_and_Examples.pdf` | Where the detector sits; the incident object it must emit (§4) |
| `IoMT_Project_Metrics_Framework_and_Evaluation_Protocol.pdf` | Detection metrics (§3), calibration and generalization metrics (§4), reporting rules (§17) |
| `CSV_README.md` | The CSV files, the 45 columns, and 5 sample rows per file |

---

## 3. Dataset

### 3.1 What we use

**CICIoMT2024** (University of New Brunswick, Canadian Institute for Cybersecurity; Dadkhah et al., *Internet of Things*
28, 2024). The testbed has 40 IoMT devices (25 real, 15 simulated) and covers Wi-Fi, MQTT and BLE. We use the
**Wi-Fi/MQTT per-capture CSV files** that CIC extracted from the PCAPs.

### 3.2 In-scope classes (Dataset Strategy §5.1)

The model trains on 13 **variants**. Every result is also reported at the proposal's coarser levels:

| Variant (13, training level) | Subtype (7) | Family (4) | Binary |
|---|---|---|---|
| Benign | Benign | Benign | Benign |
| DoS-SYN | SYN | DoS | Attack |
| DoS-TCP | TCP | DoS | Attack |
| DoS-UDP | UDP | DoS | Attack |
| DoS-ICMP | ICMP | DoS | Attack |
| DDoS-SYN | SYN | DDoS | Attack |
| DDoS-TCP | TCP | DDoS | Attack |
| DDoS-UDP | UDP | DDoS | Attack |
| DDoS-ICMP | ICMP | DDoS | Attack |
| MQTT-DoS-Connect | MQTT-Connect | MQTT-Flood | Attack |
| MQTT-DoS-Publish | MQTT-Publish | MQTT-Flood | Attack |
| MQTT-DDoS-Connect | MQTT-Connect | MQTT-Flood | Attack |
| MQTT-DDoS-Publish | MQTT-Publish | MQTT-Flood | Attack |

**Excluded on purpose (§5.2):** Recon (ping sweep, port, OS and vulnerability scan), ARP spoofing, MQTT malformed data,
and BLE. If any of these files are in the folder, the notebook lists them as "excluded" with a reason. It never drops
them silently.

### 3.3 Files (per CSV_README)

There is no label column inside the CSVs. **The class comes from the file name.** `_train` and `_test` mark the
official CIC split. Numbered files are separate capture sessions of the same class.

| Class | Training captures | Test captures |
|---|---|---|
| Benign | `Benign_train` | `Benign_test` |
| DDoS-ICMP | `TCP_IP-DDoS-ICMP1..8_train` | `…ICMP1_test`, `…ICMP2_test` |
| DDoS-SYN | `TCP_IP-DDoS-SYN1..4_train` | `TCP_IP-DDoS-SYN_test` |
| DDoS-TCP | `TCP_IP-DDoS-TCP1..4_train` | `TCP_IP-DDoS-TCP_test` |
| DDoS-UDP | `TCP_IP-DDoS-UDP1..8_train` | `…UDP1_test`, `…UDP2_test` |
| DoS-ICMP / SYN / TCP / UDP | `TCP_IP-DoS-<X>1..4_train` | `TCP_IP-DoS-<X>_test` |
| MQTT (4 classes) | `MQTT-<DoS/DDoS>-<Connect/Publish>_Flood_train` | `…_test` |

All names end in `.pcap.csv`. Benign and the four MQTT classes have **only one** training capture each. That matters
for validation (§5.4).

### 3.4 Columns (45, all numeric)

| Group | Columns |
|---|---|
| Header / flow / rate | `Header_Length`, `Protocol Type`, `Duration`, `Rate`, `Srate`, `Drate` |
| TCP flag ratios | `fin/syn/rst/psh/ack/ece/cwr_flag_number` |
| Flag counts | `ack_count`, `syn_count`, `fin_count`, `rst_count` |
| Protocol indicators | `HTTP`, `HTTPS`, `DNS`, `Telnet`, `SMTP`, `SSH`, `IRC`, `TCP`, `UDP`, `DHCP`, `ARP`, `ICMP`, `IGMP`, `IPv`, `LLC` |
| Packet-size statistics | `Tot sum`, `Min`, `Max`, `AVG`, `Std`, `Tot size` |
| Timing / derived | `IAT`, `Number`, `Magnitue` (CIC's spelling), `Radius`, `Covariance`, `Variance`, `Weight` |

There is **no timestamp, IP, port or flow-ID column.** Each row is already an aggregate over a window of consecutive
packets, made by CIC's extractor. You can see this in the values: benign values move in steps of 0.1 and attack values
in steps of 0.01.

---

## 4. Key data findings (these drive the design)

### 4.1 Why the old PoC scored 1.0000: capture-artifact shortcuts
| Column | Behaviour seen in the README samples | Problem |
|---|---|---|
| `IAT` | Mixes small real inter-arrival times with large values (≈0.85e8, 1.02e8, 1.69e8) that form **flat, capture-specific bands** | A per-session offset. It identifies *which capture* a row came from, not attack behaviour |
| `Number` | Every attack row = 9.5; benign rows = 5.5 or 13.5 | A constant tied to the capture type (window size) |
| `Weight` | Every attack row = 141.55; benign rows = 38.5 or 244.6 | Same as `Number` |

These three columns are **excluded** from the model. §17 of the notebook has an ablation that retrains with them, and
with only them, to measure their effect. Note that `IAT` is kept in float64 internally: float32 at about 1e8 has a
resolution of 8, which would erase the pattern.

**Confirmed on the real data (run `643ad137db`).**
- **Number and Weight:** every attack row in all 12 attack classes is exactly 9.5 / 141.55. Benign rows split 50/50
  between 5.5/38.5 and 13.5/244.6.
- **IAT is not a rising clock.** The earlier description in these notes was wrong: the within-file Spearman correlation
  of IAT with row position is about 0 for 12 of 13 classes (−0.07 to 0.06; MQTT-DoS-Connect 0.38). It forms
  capture-specific bands instead. The conclusion is the same: IAT identifies the session.
- **Ablation:** the three columns *alone* reach VAL macro-F1 0.9977 and TEST 0.8659, higher than all 39 legitimate
  features (VAL 0.8686, TEST 0.7418). This is the clearest evidence that they are shortcuts (§13.5).

**Residual risk.** The 0.1 vs 0.01 value granularity also differs between benign and attack captures. A tree model can
partly pick up on it, and it can't be removed without distorting the features. Mention it as a limitation.

### 4.2 Heavy exact duplication
Flood captures are mostly **identical windows**. For example, many TCP-flood rows are exactly
`54, 6, 64, 0, …, 567, 54, …`. That has three consequences:

1. A random row split would put copies of the same row in train and test, so scores would be inflated.
2. Storing each identical row once with a count makes full-data training feasible.
3. Some identical windows also appear in both the training and test captures. That is genuine for floods and is
   reported (§5b), not hidden.

**Real data:** 8,548,587 used rows compress to **5,220,107 unique rows**. The duplicate share per class is 0% for
Benign, all UDP and all MQTT classes; DoS-SYN 17.9%, DDoS-SYN 31.7%, DoS-TCP 43.1%, DoS-ICMP 70.4%, DDoS-TCP 74.0% and
DDoS-ICMP 87.9%. **13.5%** of TEST rows have an exact feature vector that also occurs in FIT (13.1% with the same
label).

### 4.3 DoS vs DDoS are often indistinguishable per window
Many rows of DoS-X and DDoS-X (same protocol) have **identical features**. DoS vs DDoS differs in the number of
attackers, and without source IPs a single window can't show that. The notebook measures a **label-conflict floor**:
the share of rows whose identical feature vector appears under several labels, which sets the minimum possible error.
**Expect 13-class scores well below 7-class subtype scores.** That is a property of the data, not a tuning failure.

**Confirmed:** label conflicts affect 10.49% of TEST rows at the variant and family levels and 0% at the subtype and
binary levels. So every conflict is DoS-X vs DDoS-X of the same protocol. The exact-match floor is 1.72% on TEST, but
the real variant error is 22.0%: most DoS/DDoS windows are not identical, yet they come from overlapping distributions.

### 4.4 No timestamps
Raw timestamp aggregation (Dataset Strategy §12 "Profile B", Pipeline §3) can't be done on these CSVs. It belongs to
the team's own Zeek/Scapy extractor on PCAP or lab traffic. The notebook uses **row order inside a capture as time**.
The files are assumed to be in capture order; `IAT` does not confirm this on the real data (see §4.1).

### 4.5 Other audit items the notebook checks
- **Constant columns on the training data** are dropped. On the real data the only one is **`Drate`**. (The synthetic
  run also found the ECE/CWR flags and several protocol columns; those are not constant on the real data.)
- **Exact duplicate columns** are dropped. On the real data: **`Srate` = `Rate`** and **`LLC` = `IPv`**.
- Final feature count: 45 − 3 shortcuts − 1 constant − 2 duplicates = **39 features**.
- **Non-numeric, missing and infinite cells** are rejected row by row, with counts per reason. On the real data **0**
  rows were rejected. One negative cell in `Benign_train` was kept and flagged.
- **Class imbalance**: the class distribution is reported before any weighting. Largest/smallest FIT class =
  **128.1** (DDoS-UDP 1,308,763 vs MQTT-DoS-Connect 10,218).
- **Most correlated remaining pairs** (reported, not removed): ARP–IPv 1.000, Std–Radius 1.000, AVG–Tot size 0.984.

---

## 5. Design decisions and rationale

| # | Decision | Why |
|---|---|---|
| D1 | Train on **13 variants**; report 7, 4 and 2 classes by **adding up predicted probabilities** | One model serves every level the proposal defines (§5.3 Stages 1–3). A coarser level is reported only when it is a function of the training level |
| D2 | **Exclude `IAT`, `Number`, `Weight`** and run an ablation | They identify the capture, not the attack (§4.1; Dataset Strategy §6.3) |
| D3 | **Store duplicate rows once with a count** (`__w__`); every fit and metric uses the weights | Same results as raw rows (verified: identical metrics; XGBoost predictions differ by at most 1.2e-7). This is what makes full data fit on Colab free |
| D4 | **Respect the official train/test files**; TEST is used once | Dataset Strategy §14.1 |
| D5 | **Validation = last ~19% of every training capture**, after a purge gap (1% of rows, clamped to 50–5000) | No random row split (near-copies). Time order is kept. All classes appear in validation in their natural proportions. Works for the single-capture classes too |
| D6 | **Leave-capture-out** experiment for classes with several training captures | The strongest grouping the data allows; checks generalization to a new session |
| D7 | **Class weighting** (`none`, `sqrt_balanced`, `balanced`) is tuned like any other hyper-parameter; **no SMOTE**; validation and test are never re-weighted | Dataset Strategy §15. SMOTE between identical flood windows would create traffic that never happens |
| D8 | Search on a stratified **40k-row-per-class** sample; **refit the best settings on all FIT rows** | Search cost stays bounded on 2 CPU cores, while the final models still use the full data |
| D9 | Do **not** refit on FIT+VAL | VAL is needed for early stopping, selection and calibration. The final models train on about 80% of each training capture |
| D10 | Select by **VAL macro-F1**; tie-breaks: worst-class recall, then benign false-alarm rate | Macro-F1 weighs every attack class equally. False alarms on medical traffic are costly |
| D11 | **Sigmoid (Platt) calibration fitted on VAL**; TEST reports raw and calibrated numbers | The Controller routes on confidence (Pipeline §4, Metrics §4). **Result:** this did not transfer to TEST (ECE 0.037 raw → 0.062 calibrated). To be revised; see §11 |
| D12 | Models: logistic regression, decision tree, RF, XGBoost, LightGBM, plus a frequency-only baseline. **No TCN, SVM or k-NN** | Follows proposal §17. A TCN needs real sequences, which these rows aren't. SVM and k-NN don't scale to millions of rows on Colab free |
| D13 | Preprocessing = `ColumnTransformer` (median imputer) **fitted on FIT only**, shipped inside every saved pipeline. Scaling (`arcsinh` + standardisation) only inside logistic regression | Trees don't need scaling. Missing values at inference time are imputed consistently |
| D14 | Settings that change results, plus data fingerprints, are hashed into the **run folder name** | Changed settings or data never mix with old checkpoints |
| D15 | The global best model is replaced **only if better under the same evaluation protocol** | Prevents accidental overwrite |

---

## 6. Notebook walkthrough (section by section)

| § | Section | What it does | Key outputs |
|---|---|---|---|
| 1 | Overview | Scope, requirement-to-section map, how to run | — |
| 2 | Environment | Installs anything missing, records versions, detects GPU for XGBoost, sets the plot style | `VERSIONS`, `XGB_DEVICE`, `N_JOBS` |
| 3 | Config and Drive | All settings (see §9). Mounts Drive in Colab; outside Colab, paths come from environment variables | `DATA_DIR`, `OUTPUT_DIR` |
| 4 | Discovery and labels | Finds CSVs, applies the explicit `LABEL_RULES`, out-of-scope list, train/test from file name, fast fingerprint, duplicate-copy detection, class coverage check, run folder | `MANIFEST`, `FILES`, `HIERARCHY`, `RUN_DIR`, `file_manifest.csv` |
| 5 | Load and validate | Reads in chunks; checks the 45 columns (any order; extra columns ignored; missing columns reject the file); rejects bad rows by reason; caches to parquet; assigns roles (`fit`/`gap`/`val`/`test`); compresses duplicates; keeps a raw 45-column sample per file | `DATA` (compressed), `ABL` (raw sample), `load_report.csv` |
| 5b | EDA and validation | Class distribution, duplicate share, constant/duplicate columns, **shortcut evidence**, IAT-vs-row plot, **label-conflict floor**, train/test vector overlap | `class_distribution.csv`, `shortcut_evidence.csv`, `label_conflicts.csv` |
| 6 | Temporal handling | Explains the no-timestamp situation; asserts that VAL starts after FIT plus the gap in every training capture | `BOUNDS` |
| 7 | Features and preprocessing | Final feature list; fits the preprocessor on FIT; builds matrices; correlation snapshot | `FEATURES`, `PREP`, `X_fit/val/test`, `w_*` |
| 8 | Labels | Class order fixed by `LABEL_RULES`; builds the level-collapse matrices | `TRAIN_CLASSES`, `EVAL_LEVELS`, `label_mapping.json` |
| 9 | Split verification | Rows per class per partition; asserts that no test capture appears in FIT or VAL | `SPLIT_TABLE` |
| 10 | Framework and baselines | Weighting, tuning-set draw, `evaluate()`, search spaces, `fit_model()`, resumable `run_search()`; runs the frequency baseline, logistic regression and decision tree | `tuning/trials.csv` |
| 11–13 | RF, XGBoost, LightGBM | `run_search()` for each | appended trials |
| 14 | Tuning summary and refit | Trial plots, over-fitting check; refits each model's best settings on all FIT rows and saves a checkpoint per model | `models/<name>/pipeline.joblib`, `meta.json` |
| 15 | Selection and calibration | Selection table on VAL, picks `SELECTED`, fits and saves the calibrator | `model_selection_val.csv`, `CALIBRATOR` |
| 16 | Final TEST evaluation | Every model at every level; per-class reports; confusion matrices; per-class F1 chart; macro-F1-by-level chart; reliability diagram | `test_metrics_all_models.csv`, `test_per_class_<level>_<model>.csv`, figures |
| 17 | Generalization and errors | Gap table; top confusions; error vs label-conflict floor; minority classes; per-class PR curves; native and permutation importance; **shortcut ablation**; **leave-capture-out** | `generalization_gaps.csv`, `error_vs_floor.csv`, `shortcut_ablation.csv`, `leave_capture_out.csv`, `feature_importance_<model>.csv` |
| 18 | Artifacts | Detector bundle, model card, feature schema, experiment summary and log, protected global-best pointer | `detector_bundle.joblib`, `best_model/` |
| 19 | Inference | Reloads the bundle from disk; `predict_incidents()` turns raw 45-column rows into incident dictionaries; measures latency | `LATENCY` |
| 20 | Summary | Prints this run's headline numbers for the report | — |

### 6.1 Important internal names

| Name | Meaning |
|---|---|
| `__row__` | Row position in the original CSV (the time axis) |
| `__role__` | `fit` / `gap` (purged) / `val` / `test` |
| `__w__` | Number of raw rows this unique row stands for |
| `__h__` | 64-bit hash of the model features (used for compression and conflict analysis) |
| `DATA` | Compressed table of every loaded row |
| `ABL` | Raw (uncompressed) sample, up to 20k rows per file, all 45 columns |
| `FIT/VAL/TEST` | Partitions (see §7) |
| `TUNE_IDX` | Stratified draw of FIT rows used for the hyper-parameter search |
| `FINAL` | Dictionary of refit models with their metadata |
| `SELECTED` | Name of the chosen model |
| `CALIBRATOR` | Sigmoid calibrator wrapped around `SELECTED` |

### 6.2 Incident object (§19 output)
```python
{"attack_variant": "MQTT-DDoS-Connect", "confidence": 0.9329,        # calibrated, at the training level
 "attack_subtype": "MQTT-Connect", "attack_family": "MQTT-Flood", "attack_binary": "Attack",
 "attack_probability": 1.0,                                          # P(any attack)
 "top3": [("MQTT-DDoS-Connect", 0.9329), ("DoS-UDP", 0.0122), ("DDoS-ICMP", 0.0109)],
 "device_type": "patient-monitor-gateway", "src_ip": "10.0.0.45", "dst_ip": "10.0.0.10",  # never model features
 "initial_severity": "high",                                         # illustrative placeholder for the Controller
 "top_features": ["Rate", "Protocol Type", "syn_count", "ICMP", "Header_Length"],
 "model": "lightgbm", "model_version": "643ad137db"}
```
This is a real output from run `643ad137db` for an MQTT-DDoS-Connect test row. Input rows may have all 45 columns in
any order. The pipeline selects and imputes its own features, and missing columns are imputed.

Note that the calibrated confidence was about 0.93 for all four demo rows (Benign, MQTT-DDoS-Connect, MQTT-DoS-Connect,
and an MQTT-DDoS-Publish row predicted as MQTT-DoS-Publish). The sigmoid calibrator compresses confidences (§11).

---

## 7. Evaluation protocol and metrics

### 7.1 Partitions
| Partition | Source | Used for |
|---|---|---|
| FIT | First 80% of rows of every `_train` capture | Fitting the preprocessor and models |
| (gap) | Next 1% (50–5000 rows), discarded | Purge between FIT and VAL |
| VAL | Remaining ~19% of every `_train` capture | Early stopping, search, model selection, calibration |
| TEST | Every `_test` capture (official CIC split) | One final evaluation |

### 7.2 Metrics (all weighted by `__w__`, i.e. equal to raw-row metrics)
- **Per level** (variant, subtype, family, binary):
  - accuracy and balanced accuracy;
  - macro and weighted precision, recall and F1;
  - worst-class recall;
  - one-vs-rest ROC-AUC (macro and weighted);
  - log-loss, multiclass Brier score, top-label ECE;
  - benign false-alarm rate (benign predicted as any attack);
  - attack-missed-as-benign rate.
- **Per class:** precision, recall, F1, support, one-vs-rest FPR, number of predictions.
- **Undefined cases.** Classes with no true rows in a partition are reported as NaN and excluded from macro averages.
  Classes never predicted get precision 0 and are counted in `n_classes_never_predicted`.
- **Cost:** fit time, inference ms per 1k rows, pipeline size on disk, end-to-end single-row latency (p50 and p95),
  batch throughput.
- **Generalization:** FIT→VAL gap (over-fitting), VAL→TEST gap (capture shift), leave-capture-out recall vs in-capture
  recall, error above the label-conflict floor, shortcut-ablation delta.

### 7.3 Reading the results
- Headline = **selected model, calibrated, TEST**, at each level, with the VAL→TEST gap, the conflict floor and the
  ablation next to it.
- Don't lead with accuracy; the classes are imbalanced.
- Colab latency is **not** edge latency. Re-measure on the gateway hardware.

---

## 8. Outputs and Google Drive layout

```
MyDrive/FYP_IoMT_Detector/                      (OUTPUT_DIR)
├── cache/                                      cleaned per-file parquet + stats (reused across runs)
├── runs/run_<config_hash>/
│   ├── run_config.json                         settings + data fingerprints + versions
│   ├── experiment_summary.csv                  one row per model (VAL + TEST macro-F1 per level, cost, params)
│   ├── tuning/trials.csv                       every search trial, appended as it finishes
│   ├── models/
│   │   ├── <model>/pipeline.joblib             preprocessor + classifier
│   │   ├── <model>/meta.json, val_per_class.csv
│   │   ├── xgboost/model.json                  native XGBoost format (version-portable)
│   │   ├── lightgbm/model.txt                  native LightGBM format
│   │   ├── <selected>/calibrator_sigmoid.joblib
│   │   ├── detector_bundle.joblib              EVERYTHING needed for inference
│   │   ├── model_card.json                     bundle contents without the pickles
│   │   └── feature_schema.json                 feature order, accepted columns, exclusions
│   ├── reports/                                every CSV/JSON listed in §6
│   └── figures/                                every plot as PNG
├── best_model/
│   ├── detector_bundle.joblib                  copy of the best bundle
│   └── best_model.json                         pointer: run, model, protocol, VAL score
└── experiment_log.csv                          all runs, all models
```

**`detector_bundle.joblib` contains:**

- the pipeline and calibrator;
- the class list and level-collapse matrices, and the label hierarchy;
- the features, the expected input columns and the excluded shortcuts;
- the top features and the selected hyper-parameters;
- VAL metrics, and TEST metrics (calibrated and raw);
- the run configuration and config hash, library versions and seed;
- the data manifest with file fingerprints, and a creation time.

**Loading:**
```python
bundle = joblib.load(".../detector_bundle.joblib")    # use the same scikit-learn version as bundle["versions"]
incidents = predict_incidents(df_rows, bundle, use_calibrated=False)   # notebook §19; raw probs until §11 fix
```

---

## 9. How to run, resume and configure

### 9.1 First run
1. Put the in-scope CICIoMT2024 CSVs (the 60 files in CSV_README) in one Drive folder, e.g. `MyDrive/CICIoMT2024`.
2. Open the notebook in Colab. Choose *Runtime → Change runtime type → T4 GPU* (recommended; XGBoost uses it
   automatically, everything else runs on CPU).
3. In §3 set `DATA_DIR`, and `OUTPUT_DIR` if you want a different location.
4. *Runtime → Run all*. Check the §4 printout ("Files NOT used (and why)", files per class) before trusting the rest.

### 9.2 Resume after a disconnect
Just **Run all** again. These are reused automatically:

- parquet caches, so CSVs are not re-read;
- finished trials, which are skipped;
- refit models with unchanged settings, which are reloaded;
- the calibrator, ablation and leave-capture-out results.

### 9.3 Settings (§3)
| Setting | Default | Notes |
|---|---|---|
| `TRAIN_LEVEL` | `"variant"` | Can also be `"subtype"` or `"family"` |
| `SHORTCUT_FEATURES` | `["IAT","Number","Weight"]` | `[]` includes them; not recommended |
| `VAL_FRACTION`, `GAP_*` | 0.20; 1% (50–5000 rows) | Validation tail and purge gap |
| `COMPRESS_DUPLICATES` | `True` | Keep on for full data on Colab free |
| `TUNE_ROWS_PER_CLASS` | 40,000 | Search sample size; final refit always uses all FIT rows |
| `N_ITER` | LR 4, DT 8, RF 6, XGB 10, LGBM 10 | Search trials per model |
| `MODELS_TO_RUN` | all five | Remove a model to skip it |
| `MAX_BOOST_ROUNDS` / `EARLY_STOPPING_ROUNDS` | 1500 / 30 | For XGBoost and LightGBM |
| `CALIBRATION_METHOD` | `"sigmoid"` | `"isotonic"` needs more data per class |
| `RUN_SHORTCUT_ABLATION`, `RUN_LEAVE_CAPTURE_OUT` | `True` | Each adds one extra training run of the selected model |
| `ALLOW_MISSING_CLASSES` | `False` | Stops if a class lacks a train or test file |
| `FORCE_UPDATE_BEST` (§18) | `False` | Replace the global best even under a different protocol |

The search spaces are in `SPACES` (§10). Random Forest's `max_samples` is limited to 0.1–0.5 to bound refit time on
2 cores. Logistic regression uses `max_iter=300`; convergence warnings are expected and harmless.

### 9.4 Quick test without real data
Set the environment variable `IOMT_SMOKE=1`, plus `IOMT_DATA_DIR` and `IOMT_OUTPUT_DIR`. Everything shrinks so the
notebook runs in a few minutes. Smoke mode changes the run hash, so its results never mix with real runs.

---

## 10. Validation done (and not done)

**Done (synthetic data and code checks):**
- Built 60 CSVs with the real file names and the 45 columns, seeded from the README's sample rows. Added bad cases: a
  file with missing columns (rejected), a Recon file (excluded), an unlabeled CSV (rejected), shuffled column order plus
  an extra column (loaded), and non-numeric and infinite cells (rows rejected and counted).
- Ran the full notebook end-to-end on current libraries (scikit-learn 1.9, pandas 3.0, XGBoost 3.4, LightGBM 4.7) and
  on Colab-like older ones (scikit-learn 1.6.1, pandas 2.2.3, XGBoost 2.1.4, LightGBM 4.5.0). Both passed.
- Re-ran in the same output folder: everything was reused (26s vs 145s).
- Weighted metrics on compressed rows equal metrics on expanded raw rows (macro-F1, balanced accuracy, accuracy,
  ROC-AUC). XGBoost trained on compressed rows matches training on raw rows (largest probability difference 1.2e-7).
- Built-in assertions: no test capture in FIT or VAL; VAL starts after FIT plus the gap in every training capture.
- Checked the figures visually: confusion matrices and per-class F1 render legibly.

**Done on the real data (run `643ad137db`, 12 Oct 2026):**
- Full run on all 60 in-scope captures on Colab with a T4 GPU (2 CPU cores, 13.6 GB RAM). Library versions: Python
  3.13.15, NumPy 2.1.3, pandas 2.2.3, scikit-learn 1.6.1, XGBoost 3.4.1, LightGBM 4.6.0.
- All results are in §13. The resume logic worked on the real data: the saved notebook outputs come from a resumed
  pass, where the parquet cache, all 38 trials, the refit models, the calibrator, the ablation and the leave-capture-out
  results were reloaded. Loading from cache took 29 s.
- Both leakage assertions passed on the real data.
- RAM peaked at about 6.6 GB, which fits on Colab free.
- Model refit times on all FIT rows: logistic regression 691 s, decision tree 65 s, Random Forest 1,654 s,
  XGBoost 131 s (GPU), LightGBM 1,551 s.
- `Srate` = `Rate` exactly on the full data (dropped), and so does `LLC` = `IPv`.

**Still unknown / caveats:**
- Total wall-clock time of the *first* (uncached) run was not recorded in the saved outputs.
- Random Forest's TEST metrics in the final pass were **restored** from `test_results_full.json` written by the earlier
  complete pass. Its 474 MB checkpoint was too large to re-score within the RAM budget. The numbers are identical by
  construction but were not recomputed live.
- LightGBM's `min_child_samples` counts unique rows, not weighted rows. This is a small mismatch with compression;
  the other models are unaffected.
- Single seed (42): no confidence intervals yet. Differences below about 0.01 macro-F1 between models are not
  meaningful.

---

## 11. Open issues, limitations and next steps

**Limitations to state in the report:**
1. DoS vs DDoS of the same protocol is partly inseparable per window. Report the conflict floor, and lean on the
   subtype and family levels for the detector's real ability.
2. The 0.1 vs 0.01 value granularity between benign and attack captures is a residual capture artifact.
3. Validation is a within-capture tail block. Benign and the MQTT classes have only one training capture, so the
   leave-capture-out check can't cover them.
4. Calibration is fitted on the same VAL data used for early stopping and selection. **TEST showed that it does not
   hold up:** ECE rose from 0.037 (raw) to 0.062 (calibrated), log-loss from 0.551 to 0.645, and OvR ROC-AUC fell
   from 0.946 to 0.916. VAL shares sessions with FIT, where the model is more accurate (VAL macro-F1 0.864 vs TEST
   0.745), so the calibrator learned to be over-confident for new sessions. Calibrated top-class confidences also
   cluster around 0.93, which makes the 0.9 "high severity" threshold fire for almost everything.
5. These are in-domain CICIoMT2024 results only.
6. Leave-capture-out shows that the DoS/DDoS distinction is partly session-specific (e.g. DDoS-SYN recall 0.93 in
   familiar sessions vs 0.52 on an unseen one), while protocol (subtype) recall stays at 0.993–1.000 on unseen sessions.

**Open issue (fix first):**
- **Calibration.** Use raw probabilities for now (`use_calibrated=False`). Then refit the calibrator on predictions for
  *unseen sessions* (e.g. the leave-capture-out predictions), preferably with temperature scaling. Evaluate it at the
  level the Controller consumes, and re-derive the severity thresholds afterwards.

**Next steps (Dataset Strategy §22 phases):**
1. ~~Run on the real data and fill in §13.~~ Done (run `643ad137db`).
2. The 13-class score *is* limited by DoS/DDoS overlap (§13.5). Agree with the supervisor that the Controller routes on
   **`attack_binary` + `attack_subtype`** (near-perfect, stable on unseen sessions) and treats `attack_variant` as
   advisory. Both are already in the incident object.
3. **Deployment model choice.** XGBoost ties LightGBM on accuracy (TEST variant macro-F1 0.7460 vs 0.7448) and is
   smaller (6.4 MB vs 19.7 MB) and about 3× faster at inference. If you switch, justify it on cost, not on the TEST
   score.
4. Add 3–5 seeds and bootstrap-by-capture confidence intervals before comparing models in the report.
5. Optional: add an MLP baseline under the identical protocol to support the "no deep learning" decision with evidence.
6. **Cross-dataset (Experiment B/C):** build the harmonized "Profile B" feature set (rates, counts, sizes, IAT
   statistics) that can be computed from both CIC PCAPs and UL-ECE. Retrain on CIC with that set and test on UL-ECE
   MQTT/UDP without re-tuning.
7. **Own-lab extractor (Zeek/Scapy):** real timestamp windows. Then a temporal model (TCN) becomes justified, and
   per-source features (distinct sources, per-source rate, source entropy) can separate DoS from DDoS.
8. Wire `predict_incidents()` into the Controller and FastAPI service; measure latency on the gateway hardware
   (Colab: 7.9 ms p50 per row).
9. Feed validated lab incidents into the case-memory schema (Dataset Strategy §11).

---

## 12. Out of scope for this notebook
UL-ECE external validation, IHS (the ICU MQTT dataset), BLE, raw-PCAP feature extraction, response/outcome
experiments, case memory, LLM agents.

---

## 13. Results (run `643ad137db`)

**Run ID:** `run_643ad137db` · **Date:** results recorded 12 Oct 2026 · **Runtime:** Colab, T4 GPU (XGBoost on GPU,
everything else on 2 CPU cores, 13.6 GB RAM) · **Seed:** 42
**Data:** 60 captures (47 train, 15 test, incl. 2 test files each for DDoS-UDP and DDoS-ICMP) · FIT **5,628,723**
rows (3,519,240 unique) · VAL **1,336,849** rows (836,479 unique) · TEST **1,583,015** rows (864,388 unique) ·
purged gap 70,356 rows · **39 features** after drops
Raw split: 65.8% FIT / 15.6% VAL / 18.5% TEST (0.8% purged).

### 13.1 Data audit (§4–§5b)
| Item | Value |
|---|---|
| Files loaded / rejected / excluded | 60 / 0 / 0 |
| Rows read / kept | 8,618,943 / 8,618,943 |
| Rows rejected (non-numeric / missing / inf) | 0 / 0 / 0 (1 negative cell in `Benign_train`, kept and flagged) |
| Duplicate share (overall) | 8,548,587 rows → 5,220,107 unique (≈39% duplicates); 0% for Benign/UDP/MQTT, up to 87.9% for DDoS-ICMP |
| Constant columns dropped | `Drate` |
| Duplicate columns dropped | `Srate` (= `Rate`), `LLC` (= `IPv`) |
| Shortcut columns excluded | `IAT`, `Number`, `Weight` |
| Imbalance ratio (largest/smallest, FIT) | 128.1 (DDoS-UDP 1,308,763 / MQTT-DoS-Connect 10,218) |
| TEST rows whose vector also occurs in FIT | 13.5% (13.1% with the same label) |

**Class distribution (raw rows):**

| Class | FIT | VAL | TEST | Duplicate share |
|---|---|---|---|---|
| Benign | 154,185 | 36,620 | 37,607 | 0.0% |
| DoS-SYN | 353,521 | 83,964 | 98,595 | 17.9% |
| DoS-TCP | 304,305 | 72,275 | 82,096 | 43.1% |
| DoS-UDP | 453,557 | 107,724 | 137,553 | 0.0% |
| DoS-ICMP | 333,031 | 79,098 | 98,432 | 70.4% |
| DDoS-SYN | 641,569 | 152,373 | 172,397 | 31.7% |
| DDoS-TCP | 643,570 | 152,850 | 182,598 | 74.0% |
| DDoS-UDP | 1,308,763 | 310,834 | 362,070 | 0.0% |
| DDoS-ICMP | 1,229,978 | 292,125 | 349,699 | 87.9% |
| MQTT-DoS-Connect | 10,218 | 2,427 | 3,131 | 0.0% |
| MQTT-DoS-Publish | 35,500 | 8,432 | 8,505 | 0.0% |
| MQTT-DDoS-Connect | 138,428 | 32,878 | 41,916 | 0.0% |
| MQTT-DDoS-Publish | 22,098 | 5,249 | 8,416 | 0.0% |

### 13.2 Label-conflict floor (minimum possible error)
| Level | FIT conflicting share | FIT floor | TEST conflicting share | TEST floor |
|---|---|---|---|---|
| variant (13) | 8.83% | 1.03% | 10.49% | 1.72% |
| subtype (7) | 0.00% | 0.00% | 0.00% | 0.00% |
| family (4) | 8.83% | 1.03% | 10.49% | 1.72% |
| binary (2) | 0.00% | 0.00% | 0.00% | 0.00% |

All conflicts are DoS-X vs DDoS-X of the same protocol (variant = family, subtype = 0).

### 13.3 Model selection on VAL (variant level, refit models)
| Model | VAL macro-F1 | Bal. acc | Worst-class recall (class) | Benign false alarm | FIT−VAL gap | Fit time | ms / 1k rows | Size MB |
|---|---|---|---|---|---|---|---|---|
| Frequency baseline | 0.0290 | 0.0769 | 0.000 (Benign) | 1.0000 | −0.0016 | 0.3 s | 0.05 | 0.002 |
| Logistic regression | 0.7613 | 0.7657 | 0.078 (DoS-UDP) | 0.0152 | 0.0058 | 690.6 s | 0.7 | 0.007 |
| Decision tree | 0.8382 | 0.8276 | 0.338 (DoS-ICMP) | 0.0168 | 0.0134 | 64.7 s | 0.2 | 0.163 |
| Random Forest | 0.8612 | 0.8715 | 0.692 (DoS-UDP) | 0.0004 | 0.0286 | 1,654.4 s | 22.5 | 474.2 |
| XGBoost | 0.8534 | 0.8427 | 0.359 (DoS-ICMP) | 0.0004 | 0.0129 | 130.8 s (GPU) | 85.8 | 6.4 |
| **LightGBM** | **0.8637** | 0.8605 | 0.561 (DoS-ICMP) | 0.0005 | 0.0122 | 1,550.9 s | 282.7 | 19.7 |

Search: 38 random-search trials in total (LR 4, DT 8, RF 6, XGB 10, LGBM 10) on a 40k-per-class tuning set (361,555
unique rows = 467,816 raw-row equivalents), each scored on the full VAL partition. Best-trial early stopping: XGBoost
151 rounds, LightGBM 69 rounds (limit 1,500, patience 30).

**Selected:** LightGBM · **Params:** `num_leaves=127, learning_rate=0.1, colsample_bytree=0.6, subsample=1.0,
min_child_samples=30, reg_lambda=1, class_weighting=sqrt_balanced`

Other selected configurations: LR `C=10, none` · DT `entropy, max_depth=12, min_samples_leaf=20, none` · RF
`200 trees, max_depth=30, max_features=0.3, max_samples=0.5, min_samples_leaf=2, balanced` · XGB `max_depth=8, lr=0.2,
colsample=0.6, subsample=1.0, min_child_weight=5, λ=5, α=1, γ=0, none`.

### 13.4 TEST — selected model (calibrated)
| Level | Accuracy | Bal. acc | Macro-F1 | Weighted F1 | Worst-class recall (class) | ROC-AUC macro | Benign false alarm | Attack missed as benign | ECE (raw → cal.) |
|---|---|---|---|---|---|---|---|---|---|
| variant | 0.7800 | 0.7580 | 0.7448 | 0.7744 | 0.119 (MQTT-DDoS-Publish) | 0.9157 (raw 0.9464) | 0.0000 | 0.0000 | 0.0370 → 0.0621 |
| subtype | 0.9991 | 0.9992 | 0.9992 | 0.9991 | 0.997 (SYN) | – | 0.0000 | – | – |
| family | 0.7855 | 0.8537 | 0.8555 | 0.7834 | 0.562 (DoS) | – | 0.0000 | – | – |
| binary | 1.0000 | 1.0000 | 0.9999 | 1.0000 | 1.000 (Benign) | – | 0.0000 | – | – |

"–" = not printed by the notebook for that level (it is saved in `reports/test_metrics_all_models.csv`).

**All models, TEST macro-F1 by level:**

| Model | variant | subtype | family | binary | TEST log-loss (variant) |
|---|---|---|---|---|---|
| Frequency baseline | 0.0286 | 0.0685 | 0.2013 | 0.4940 | 2.1274 |
| Logistic regression | 0.6698 | 0.9961 | 0.8102 | 0.9914 | 0.5425 |
| Decision tree | 0.7362 | 0.9953 | 0.8507 | 0.9955 | 0.6729 |
| Random Forest | 0.7355 | 0.9984 | 0.8440 | 0.9992 | 0.6379 |
| XGBoost | 0.7460 | 0.9988 | 0.8604 | 0.9998 | 0.5352 |
| LightGBM (raw) | 0.7448 | 0.9992 | 0.8543 | 0.9999 | 0.5507 |
| LightGBM (calibrated) | 0.7448 | 0.9992 | 0.8555 | 0.9999 | 0.6454 |

**Per-class TEST, LightGBM raw (variant level):**

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Benign | 0.9994 | 1.0000 | 0.9997 | 37,607 |
| DoS-SYN | 0.8550 | 0.9413 | 0.8961 | 98,595 |
| DoS-TCP | 0.7428 | 0.5745 | 0.6479 | 82,096 |
| DoS-UDP | 0.3939 | 0.5195 | 0.4480 | 137,553 |
| DoS-ICMP | 0.4699 | 0.3488 | 0.4004 | 98,432 |
| DDoS-SYN | 0.9641 | 0.9040 | 0.9331 | 172,397 |
| DDoS-TCP | 0.8235 | 0.9102 | 0.8647 | 182,598 |
| DDoS-UDP | 0.7913 | 0.6961 | 0.7407 | 362,070 |
| DDoS-ICMP | 0.8293 | 0.8891 | 0.8581 | 349,699 |
| MQTT-DoS-Connect | 0.9942 | 0.9831 | 0.9886 | 3,131 |
| MQTT-DoS-Publish | 0.5341 | 0.9998 | 0.6962 | 8,505 |
| MQTT-DDoS-Connect | 0.9988 | 0.9996 | 0.9992 | 41,916 |
| MQTT-DDoS-Publish | 0.9812 | 0.1178 | 0.2103 | 8,416 |

Per-class average precision (calibrated): Benign 1.000, MQTT-DDoS-Connect 1.000, MQTT-DoS-Connect 0.991, DDoS-SYN
0.978, DoS-SYN 0.969, DDoS-ICMP 0.871, DDoS-TCP 0.827, DDoS-UDP 0.827, DoS-TCP 0.746, MQTT-DoS-Publish 0.550,
DoS-UDP 0.429, DoS-ICMP 0.371, MQTT-DDoS-Publish 0.136.

### 13.5 Generalization
| Check | Result |
|---|---|
| FIT → VAL → TEST macro-F1 (selected) | 0.8759 → 0.8637 → 0.7448 (FIT−VAL 0.0122; **VAL−TEST 0.1188**). Other models: VAL−TEST 0.09–0.13, largest for RF (0.1257) |
| Shortcut ablation, TEST macro-F1: without / with / only shortcuts | **0.7418 / 0.8454 / 0.8659** (VAL: 0.8686 / 0.9998 / 0.9977). Raw 20k-rows-per-file sample |
| Leave-capture-out: unseen-session recall vs in-capture VAL recall | DDoS-ICMP 0.942 vs 0.882 · DDoS-SYN **0.520 vs 0.931** · DDoS-TCP 0.755 vs 0.897 · DDoS-UDP 0.914 vs 0.895 · DoS-ICMP **0.387 vs 0.561** · DoS-SYN 0.656 vs 0.792 · DoS-TCP 0.637 vs 0.665 · DoS-UDP 0.557 vs 0.572. Subtype recall on unseen sessions: 0.993–1.000 for all 8 |
| Top 3 confusions (TEST, calibrated) | DDoS-UDP→DoS-UDP 97,096 (26.8%) · DoS-UDP→DDoS-UDP 70,536 (51.3%) · DoS-ICMP→DDoS-ICMP 67,823 (68.9%). Also MQTT-DDoS-Publish→MQTT-DoS-Publish 88.0% of its class |
| Error vs conflict floor (calibrated TEST) | variant 0.2200 vs floor 0.0172 · subtype 0.0009 vs 0 · family 0.2145 vs 0.0172 · binary 0.0000 vs 0 |
| Top 5 features (permutation, VAL) | Rate, Protocol Type, syn_count, ICMP, Header_Length (gain importance agrees on syn_count, Protocol Type, syn_flag_number, Rate, ICMP) |
| Latency p50 / p95 (single row), throughput | 7.88 ms / 16.61 ms end-to-end; 3,269 rows/s (10k-row batch). Colab, not gateway hardware |

### 13.6 Interpretation notes
- **Three tiers of difficulty.** Benign vs Attack is solved (0.9999, zero false alarms, zero misses). Protocol
  (subtype) is solved (0.9992) and transfers to unseen sessions. DoS vs DDoS is only partly solvable per window,
  which pulls the variant (0.745) and family (0.856) scores down. The nine largest confusions are all DoS↔DDoS swaps
  within the same protocol, covering over 99% of variant errors.
- **Class size is not the problem.** The smallest class (MQTT-DoS-Connect, 10k FIT rows) reaches F1 0.988, while the
  largest (DDoS-UDP) reaches 0.759. Difficulty follows DoS/DDoS overlap, not support, which also supports the
  no-SMOTE decision.
- **The shortcuts are real and large.** The three excluded columns alone beat all legitimate features on TEST (0.866
  vs 0.742), because CIC's test sessions share extractor settings with the training sessions. Excluding them costs
  about 10 points of in-benchmark macro-F1. That is the price of a detector that does not depend on CIC's extractor.
- **The tree models are effectively tied.** On TEST variant macro-F1, the four tree models sit within 0.011 of each
  other. LightGBM was selected on VAL as the protocol requires; XGBoost scored 0.0012 higher on TEST, which is within
  noise and is not grounds to re-select.
- **Session shift, not over-fitting.** The FIT−VAL gaps are small (≤0.029), but VAL−TEST is 0.09–0.13. The protocol's
  use of separate test sessions exposed this; a random split would have reported about 0.86.
- **Calibration needs rework** (§11): use raw probabilities until it is fixed.
- **Report wording:** quote macro-F1 and balanced accuracy at every level together with the conflict floor and the
  ablation. Don't lead with accuracy. The full write-up is in *IoMT_Detector_Technical_Guide.pdf*.

---

## 14. Glossary
| Term | Meaning here |
|---|---|
| Capture | One CSV file = one recording session of one class |
| Variant / subtype / family / binary | The four label levels (13 / 7 / 4 / 2 classes) |
| FIT / VAL / TEST | Training part / validation tail / official test captures |
| Purge gap | Rows discarded between FIT and VAL so overlapping windows don't straddle them |
| Compression / `__w__` | Identical rows stored once with a count; all fits and metrics use the count |
| Shortcut feature | A column that identifies the capture rather than the attack (`IAT`, `Number`, `Weight`) |
| Label-conflict floor | Minimum achievable error caused by identical feature rows with different labels |
| Macro-F1 | F1 averaged equally over classes (the selection metric) |
| ECE | Expected calibration error: the gap between confidence and actual accuracy |
| Leave-capture-out | Retraining without one whole session, then testing on that session |
| Bundle | `detector_bundle.joblib`, the single file needed for inference |
| Run hash | Hash of result-affecting settings + data fingerprints; names the run folder |
