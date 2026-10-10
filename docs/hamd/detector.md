# Detector — Handoff Notes

**Project:** Adaptive Autonomous Cyber Defense for IoMT Networks (FYP 2026-27)
**Team:** Mohammad Haider Abbas (23i-2558), Hamd Ul Haq (23i-0081), Ayesha Ikram (23i-0109)
**Component:** Detection and Confidence Module, the first stage of the runtime pipeline
**Notebook:** `FYP_IoMT_Multiclass_Detector.ipynb` (replaces `FYP_IoMT_TCP_Flood_Detector_PoC_drive (1).ipynb`)
**Last updated:** 10 Oct 2026

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
| **Run on the real CICIoMT2024 data** | ❌ **Not done yet.** No real results exist |
| Real numbers in this document | None. Section 13 is an empty template to fill after the real run |

> Do not quote any metric in the report until the notebook has been run on the real data. The synthetic smoke-test
> numbers are meaningless and are deliberately not recorded here.

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
| `IAT` | About 8.4e7–1.7e8 and **rising row by row inside each file** | A capture clock. It identifies *which capture* a row came from, not attack behaviour |
| `Number` | Every attack row = 9.5; benign rows = 5.5 or 13.5 | A constant tied to the capture type (window size) |
| `Weight` | Every attack row = 141.55; benign rows = 38.5 or 244.6 | Same as `Number` |

These three columns are **excluded** from the model. §17 of the notebook has an ablation that retrains with them, and
with only them, to measure their effect. Note that `IAT` is kept in float64 internally: float32 at about 1e8 has a
resolution of 8, which would erase the clock pattern.

**Residual risk.** The 0.1 vs 0.01 value granularity also differs between benign and attack captures. A tree model can
partly pick up on it, and it can't be removed without distorting the features. Mention it as a limitation.

### 4.2 Heavy exact duplication
Flood captures are mostly **identical windows**. For example, many TCP-flood rows are exactly
`54, 6, 64, 0, …, 567, 54, …`. That has three consequences:

1. A random row split would put copies of the same row in train and test, so scores would be inflated.
2. Storing each identical row once with a count makes full-data training feasible.
3. Some identical windows also appear in both the training and test captures. That is genuine for floods and is
   reported (§5b), not hidden.

### 4.3 DoS vs DDoS are often indistinguishable per window
Many rows of DoS-X and DDoS-X (same protocol) have **identical features**. DoS vs DDoS differs in the number of
attackers, and without source IPs a single window can't show that. The notebook measures a **label-conflict floor**:
the share of rows whose identical feature vector appears under several labels, which sets the minimum possible error.
**Expect 13-class scores well below 7-class subtype scores.** That is a property of the data, not a tuning failure.

### 4.4 No timestamps
Raw timestamp aggregation (Dataset Strategy §12 "Profile B", Pipeline §3) can't be done on these CSVs. It belongs to
the team's own Zeek/Scapy extractor on PCAP or lab traffic. The notebook uses **row order inside a capture as time**.
The files are in capture order, which the rising `IAT` confirms.

### 4.5 Other audit items the notebook checks
- **Constant columns on the training data** are dropped. On the synthetic data these were `Drate`, the ECE/CWR flags,
  `HTTP`, `DNS`, `Telnet`, `SMTP`, `SSH`, `IRC`, `DHCP` and `IGMP`. The real list is recomputed from the data.
- **Exact duplicate columns** are dropped. `Srate` appears to equal `Rate` in the samples.
- **Non-numeric, missing and infinite cells** are rejected row by row, with counts per reason.
- **Class imbalance**: the class distribution is reported before any weighting.

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
| D11 | **Sigmoid (Platt) calibration fitted on VAL**; TEST reports raw and calibrated numbers | The Controller routes on confidence (Pipeline §4, Metrics §4) |
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
{"attack_variant": "MQTT-DDoS-Connect", "confidence": 0.98,          # calibrated, at the training level
 "attack_subtype": "MQTT-Connect", "attack_family": "MQTT-Flood", "attack_binary": "Attack",
 "attack_probability": 1.0,                                          # P(any attack)
 "top3": [("MQTT-DDoS-Connect", 0.98), ...],
 "device_type": "...", "src_ip": "...", "dst_ip": "...",            # passed in; never model features
 "initial_severity": "high|medium|none",                             # illustrative placeholder for the Controller
 "top_features": [...], "model": "xgboost", "model_version": "<config hash>"}
```
(The values above are illustrative.) Input rows may have all 45 columns in any order. The pipeline selects and imputes
its own features, and missing columns are imputed.

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
incidents = predict_incidents(df_rows, bundle)          # function defined in notebook §19
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

**Not done / unknown until the real run:**
- Any real metric, class count, duplicate rate, conflict floor or importance ranking.
- Real runtime and peak RAM on Colab free. Expect the first run to take hours, dominated by reading the CSVs from
  Drive and by the RF/XGBoost refits. A GPU helps XGBoost a lot.
- Whether `Srate` duplicates `Rate` exactly on the full data. The notebook decides from the data.
- LightGBM's `min_child_samples` counts unique rows, not weighted rows. This is a small mismatch with compression;
  the other models are unaffected.

---

## 11. Open issues, limitations and next steps

**Limitations to state in the report:**
1. DoS vs DDoS of the same protocol is partly inseparable per window. Report the conflict floor, and lean on the
   subtype and family levels for the detector's real ability.
2. The 0.1 vs 0.01 value granularity between benign and attack captures is a residual capture artifact.
3. Validation is a within-capture tail block. Benign and the MQTT classes have only one training capture, so the
   leave-capture-out check can't cover them.
4. Calibration is fitted on the same VAL data used for early stopping and selection. TEST shows whether it holds up.
5. These are in-domain CICIoMT2024 results only.

**Next steps (Dataset Strategy §22 phases):**
1. **Run on the real data** and fill in §13. Check the §4 file table, §5b shortcut and conflict tables, and the §17
   ablation first.
2. If 13-class performance is limited by the conflict floor, decide with the supervisor whether the Controller should
   consume the subtype or family output (both are already in the incident object).
3. **Cross-dataset (Experiment B/C):** build the harmonized "Profile B" feature set (rates, counts, sizes, IAT
   statistics) that can be computed from both CIC PCAPs and UL-ECE. Retrain on CIC with that set and test on UL-ECE
   MQTT/UDP without re-tuning.
4. **Own-lab extractor (Zeek/Scapy):** real timestamp windows. Then a temporal model (TCN) becomes justified, and
   per-source features can separate DoS from DDoS.
5. Wire `predict_incidents()` into the Controller and FastAPI service; measure latency on the gateway hardware.
6. Feed validated lab incidents into the case-memory schema (Dataset Strategy §11).

---

## 12. Out of scope for this notebook
UL-ECE external validation, IHS (the ICU MQTT dataset), BLE, raw-PCAP feature extraction, response/outcome
experiments, case memory, LLM agents.

---

## 13. Results template (fill after the real run)

**Run ID:** `run_________` · **Date:** ________ · **Runtime:** CPU / T4 GPU · **Run by:** ________
**Data:** ___ captures · FIT ______ rows · VAL ______ rows · TEST ______ rows · ___ features after drops

### 13.1 Data audit (§4–§5b)
| Item | Value |
|---|---|
| Files loaded / rejected / excluded | |
| Rows rejected (non-numeric / missing / inf) | |
| Duplicate share (overall) | |
| Constant columns dropped | |
| Duplicate columns dropped | |
| Imbalance ratio (largest/smallest, FIT) | |
| TEST rows whose vector also occurs in FIT | |

### 13.2 Label-conflict floor (TEST, minimum possible error)
| Level | Conflicting row share | Error floor |
|---|---|---|
| variant (13) | | |
| subtype (7) | | |
| family (4) | | |
| binary (2) | | |

### 13.3 Model selection on VAL (variant level)
| Model | VAL macro-F1 | Bal. acc | Worst-class recall (class) | Benign false alarm | FIT−VAL gap | Fit time | ms / 1k rows | Size MB |
|---|---|---|---|---|---|---|---|---|
| Frequency baseline | | | | | | | | |
| Logistic regression | | | | | | | | |
| Decision tree | | | | | | | | |
| Random Forest | | | | | | | | |
| XGBoost | | | | | | | | |
| LightGBM | | | | | | | | |

**Selected:** ________ · **Params:** ________

### 13.4 TEST — selected model (calibrated)
| Level | Accuracy | Bal. acc | Macro-F1 | Weighted F1 | Worst-class recall (class) | ROC-AUC macro | Benign false alarm | Attack missed as benign | ECE (raw → cal.) |
|---|---|---|---|---|---|---|---|---|---|
| variant | | | | | | | | | |
| subtype | | | | | | | | | |
| family | | | | | | | | | |
| binary | | | | | | | | | |

### 13.5 Generalization
| Check | Result |
|---|---|
| VAL → TEST macro-F1 drop (selected) | |
| Shortcut ablation, TEST macro-F1: without / with / only shortcuts | |
| Leave-capture-out: unseen-session recall vs in-capture recall (list per class) | |
| Top 3 confusions | |
| Top 5 features (permutation) | |
| Latency p50 / p95 (single row), throughput | |

### 13.6 Interpretation notes
- 
- 

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
