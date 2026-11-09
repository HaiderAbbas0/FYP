# IoMT PCAP Resource-Exhaustion Detector — Handoff Guide

**Notebook:** `FYP_IoMT_PCAP_Detector.ipynb`
**Project:** Adaptive Autonomous Cyber Defense for IoMT Networks, Detection and Confidence Module
**Team:** Mohammad Haider Abbas (23i-2558), Hamd Ul Haq (23i-0081), Ayesha Ikram (23i-0109)

This document explains what the notebook does, how to run it, every setting you can change, what it writes to disk, how
to deploy the result, and where the known limits are. You should be able to take over the project from this file plus
the notebook alone.

---

## Contents

1. [What this is, in one page](#1-what-this-is-in-one-page)
2. [Quick start](#2-quick-start)
3. [Design decisions and the reasons for them](#3-design-decisions-and-the-reasons-for-them)
4. [Pipeline walkthrough, section by section](#4-pipeline-walkthrough-section-by-section)
5. [Features reference](#5-features-reference)
6. [Configuration reference (§3)](#6-configuration-reference-3)
7. [Models and search spaces](#7-models-and-search-spaces)
8. [Model selection (composite score and manual override)](#8-model-selection-composite-score-and-manual-override)
9. [Outputs: every file the notebook writes](#9-outputs-every-file-the-notebook-writes)
10. [Deployment: the bundle and the live engine](#10-deployment-the-bundle-and-the-live-engine)
11. [Resuming, caching and run hashes](#11-resuming-caching-and-run-hashes)
12. [Memory and hardware safety](#12-memory-and-hardware-safety)
13. [How it was tested](#13-how-it-was-tested)
14. [Known limitations and deviations from the original spec](#14-known-limitations-and-deviations-from-the-original-spec)
15. [Troubleshooting](#15-troubleshooting)
16. [How to extend it](#16-how-to-extend-it)
17. [Glossary](#17-glossary)

---

## 1. What this is, in one page

The notebook trains and evaluates a detector for **resource-exhaustion attacks** on IoMT networks, directly from the raw
**CICIoMT2024 Wi-Fi/MQTT PCAP captures**. It replaces an earlier pipeline that used CIC's pre-extracted CSV features.

* **Input:** every `*_train.pcap` and `*_test.pcap` (or `.pcapng`) under the `CICIoMT2024` folder.
* **Prediction unit:** one prediction **per packet**. The packet is described by its own header fields plus statistics
  over the **previous 20 packets** in the same capture (rates, flag ratios, number of distinct sources, and so on). Only
  past packets are used, so the same features exist in live traffic.
* **Labels (from the file name):** 13 variants → 7 subtypes → 4 families → Benign/Attack.

  | Level | Classes |
  |---|---|
  | Variant (13) | Benign, DoS-SYN, DoS-TCP, DoS-UDP, DoS-ICMP, DDoS-SYN, DDoS-TCP, DDoS-UDP, DDoS-ICMP, MQTT-DoS-Connect, MQTT-DoS-Publish, MQTT-DDoS-Connect, MQTT-DDoS-Publish |
  | Subtype (7) | Benign, SYN, TCP, UDP, ICMP, MQTT-Connect, MQTT-Publish |
  | Family (4) | Benign, DoS, DDoS, MQTT-Flood |
  | Binary (2) | Benign, Attack |

  One model is trained at the variant level. The coarser levels are computed by multiplying its probabilities by fixed
  0/1 matrices, so no extra models are needed.
* **Models compared:** Dummy (prior), Logistic Regression, Decision Tree, Random Forest, AdaBoost, XGBoost (GPU),
  LightGBM, a bidirectional LSTM/GRU, and a packet-sequence Transformer.
* **Selection:** a composite score of **0.6 × VAL macro-F1 + 0.2 × latency + 0.2 × memory**, with a manual override.
* **Output:** a deployment bundle plus a standalone script that streams a PCAP and prints one incident JSON per packet
  for the SOC / Controller.

```
CICIoMT2024/**/*.pcap(ng)        §4  find files, fingerprint them, read labels and split from file names
        │
        ▼  §5  index each capture, read up to 1M packets as 50 evenly spaced 20k-packet blocks, decode with dpkt
cache/<file>.<fingerprint>-<hash>.parquet      raw header fields per packet (addresses only as hashes)
        │
        ▼  §6  per-packet + 20-packet context features; roles FIT / gap / VAL / TEST; background packets dropped
X matrices (66 features)  +  memory-mapped per-packet store → 20-packet windows for the neural networks
        │
        ▼  §7–§9  FIT-only preprocessing · collapse matrices · leakage checks and data audit
§10–§13  train 9 models (resumable)
        │
        ▼  §14  benchmark latency/RAM in clean subprocesses → composite score → selected model
§15 calibrate on VAL → §16 one TEST pass → §17 robustness → §18 bundle → §19 live engine → §20 summary table
```

---

## 2. Quick start

### On Google Colab (intended setup)

1. Upload the CICIoMT2024 PCAPs, **train and test**, into one Drive folder. The default is
   `/content/drive/MyDrive/CICIoMT2024`. Subfolders are fine.
2. Open the notebook in Colab, then *Runtime → Change runtime type → T4 GPU*.
3. If your folder is elsewhere, edit `DATA_DIR` in §3.
4. *Runtime → Run all*. Accept the Drive mount prompt.
5. If Colab disconnects, reconnect and **Run all again**. Finished work is reloaded, not repeated (see §11 of this guide).

Expected time on Colab, as **estimates, not measured on the real data**:

* extraction: roughly 30–60 minutes for all captures at 1M packets each;
* training and evaluation: several hours in total, dominated by Random Forest, XGBoost/LightGBM searches and the two
  neural networks.

### Locally or on another machine

Set paths with environment variables instead of editing the notebook:

```bash
export IOMT_DATA_DIR=/path/to/CICIoMT2024
export IOMT_OUTPUT_DIR=/path/to/output
export IOMT_LOCAL_DIR=/fast/local/disk        # for the ~7 GB sequence store
jupyter lab FYP_IoMT_PCAP_Detector.ipynb
```

### Smoke test (minutes, for checking the code, not for results)

```bash
export IOMT_SMOKE=1
```

This shrinks every budget: 12k packets per capture, a few thousand rows per class, 1–2 trials per model and 1–2
epochs. The results are meaningless; use it only to confirm the notebook runs.

### Requirements

Python 3.10+ with `numpy`, `pandas`, `scikit-learn`, `xgboost`, `lightgbm`, `torch`, `dpkt`, `pyarrow`, `psutil`,
`nvidia-ml-py`, `joblib` and `matplotlib`. §2 installs whatever is missing; Colab already has everything except `dpkt` and
`nvidia-ml-py`.

---

## 3. Design decisions and the reasons for them

These four decisions were confirmed before the build. They shape everything else.

| Decision | Setting | Reason |
|---|---|---|
| **Prediction unit** | Per packet, with a causal context of the previous 20 packets (`CONTEXT_N = 20`) | Gives per-packet incidents for the Controller while still capturing flood behaviour (rate, flags, number of sources). Using only the past means the same features are available live. |
| **Packets per capture** | 1,000,000, as 50 evenly spaced blocks of 20,000 contiguous packets | Full captures total over a billion packets: hours of parsing and tens of GB of cache. Blocks cover the start, middle and end of each capture, and each block is contiguous, so the 20-packet context is real. |
| **Background packets in attack captures** | Dropped as training/evaluation targets and counted per file (`OFF_PROTOCOL_POLICY = "drop"`) | Attack captures contain ordinary traffic. For example, `DDoS-ICMP1` starts with TCP:443 web packets. Labelling those as the attack would teach the model wrong labels. |
| **Selection weights** | 0.6 F1 / 0.2 latency / 0.2 memory, with a manual override | The detector must be accurate *and* fit an edge gateway. The override lets the team choose differently without retraining. |

Other rules carried over from the CSV pipeline:

* **The official train/test split is respected.** Test captures are never used for training, scaling, tuning,
  calibration or selection.
* **Validation is the chronological tail of each training capture, after a purge gap.** It is not a random split:
  neighbouring flood packets are near-copies, so a random split would inflate every score.
* **Shortcut columns are excluded.** The capture timestamp, packet number and MAC/IP addresses identify the *capture*
  rather than the attack. §17 proves this with an ablation.
* **Every learned transform is fitted on FIT only.**
* **No class is ever dropped silently.** Out-of-scope files, rejected files and dropped packets are all listed with
  reasons.

---

## 4. Pipeline walkthrough, section by section

### §1 Title, abstract, architecture and requirements tracing

Markdown only: the overview, the architecture diagram, the confirmed decisions, and a table linking each requirement to
the code that implements it.

### §2 Environment setup, GPU detection and library audit

* Installs missing packages and prints all library versions. These are saved in every model's metadata and the bundle.
* `seed_everything(42)` fixes the seeds for Python, NumPy and PyTorch/CUDA, and sets cuDNN to deterministic mode.
* Detects the GPU (PyTorch, `nvidia-smi`, NVML) and sets `XGB_DEVICE` and `TORCH_DEVICE`.
* Defines the memory tools used throughout:
  * `ram_mb()` and `vram_mb()` report current usage.
  * `mem_status(tag)` prints a one-line summary.
  * `free_memory()` runs `gc.collect()` and `torch.cuda.empty_cache()`.
  * `mem_guard(stage, need_mb)` stops a step with a clear message before it would exceed 85 % of the 12.7 GB RAM
    ceiling.
  * `PeakMemory()` is a context manager that samples peak RAM and VRAM in a background thread.

### §3 Global configuration, paths and run hashes

All settings live here; see [section 6 of this guide](#6-configuration-reference-3). Settings that affect results are
hashed into `SETTINGS_HASH`. Selection-only settings are deliberately **not** hashed, so changing them never triggers
retraining.

### §4 PCAP discovery, fingerprinting and label parsing

* Walks `DATA_DIR` recursively for `.pcap`, `.pcapng` and `.cap` files, skipping the output folders.
* **Label rules:** one explicit regex per in-scope class on the lower-cased file name, for example
  `^tcp_ip-ddos-icmp → DDoS-ICMP`. The rule order fixes the class index order everywhere.
* **Out-of-scope rules:** Recon (ping sweep, port/OS scan, vulnerability scan), ARP spoofing, MQTT malformed data and
  BLE/Bluetooth. These are listed under "Files NOT used (and why)".
* **Split:** taken from a `_train` / `_test` suffix before the extension, or else from a parent folder named
  `train`/`test`.
* **Fingerprint:** SHA-256 over the file size, the first 4 MB and the last 4 MB. It is fast on Drive and still changes
  when a file is replaced. Duplicate copies of the same file are rejected.
* **Coverage check:** stops if a class lacks a train or test capture, unless `ALLOW_MISSING_CLASSES = True`.
* Builds `CONFIG_HASH = hash(settings + data fingerprints)` and creates `runs/run_<CONFIG_HASH>/`.

### §5 Streaming PCAP extraction and shortcut removal

A `%%writefile` cell writes the module **`iomt_runtime.py`**. Training and deployment use this same file, which is why
training features and live features cannot drift apart.

For each capture:

1. **Header-only index** (`PcapSource.index`): reads only the 16-byte record headers, counts packets and records the byte
   offset of every 20,000th packet.
2. **Block plan** (`plan_blocks`): if the capture has more than `PACKETS_PER_CAPTURE` packets, it picks 50 grid
   positions evenly from start to end. Otherwise it takes everything.
3. **Block reads** (`read_blocks`): seeks to each block and decodes 20,000 packets with `dpkt` (`decode_records`).
   pcapng files cannot be seeked, so they are read once sequentially and only the planned blocks are kept.
4. Writes each block to a Parquet file as it goes, so peak memory is one block. The file is written under a temporary
   name and renamed at the end, so an interrupted run never leaves a half-written cache.

It also stores bookkeeping columns `__pkt__` (packet index in the capture), `__bpos__` (position inside the block) and
`__block__`. An assertion confirms that no identifier or shortcut column is in the model feature list.

### §6 Feature assembly, sequence windowing and temporal batching

* **Pass 1** reads five small columns per capture. It works out each packet's role, whether its protocol matches the
  capture's attack, and whether it is eligible as a target. It counts targets per (file, role, label) and builds the
  per-capture **assembly report**.
* **Sampling fractions:**
  * FIT: per class, up to `FIT_ROWS_PER_CLASS`.
  * VAL and TEST: **one fraction for all classes**, so their class proportions are not rebalanced.
* **Pass 2**, per capture and per block:
  * `rt.build_features` computes 66 features (see [section 5](#5-features-reference)).
  * The 39 per-packet features of every packet are written to a **memory-mapped `float32` file** on local disk
    (`SEQ_STORE`).
  * The sampled target packets are kept in RAM as tabular rows.
* **Roles** (`assign_roles`):

  | Role | Packets |
  |---|---|
  | FIT | first 80 % of each training capture, by packet index |
  | gap | the next 1 % (at least `CONTEXT_N + 1` packets, at most 5,000), never used |
  | VAL | the rest of each training capture |
  | TEST | all packets of test captures |
* **Eligible target:**
  * position in its block ≥ `CONTEXT_N`, so the whole 20-packet window is inside the block;
  * not in the gap;
  * under the `drop` policy, protocol-matching. The protocol rules are SYN/TCP → TCP, UDP → UDP, ICMP → ICMP/ICMPv6,
    and MQTT → TCP on port 1883/8883. Benign captures keep every packet.

  Tabular and sequence models are scored on **exactly the same packets**.
* **Windows without copies:** `SEQ_VIEW = sliding_window_view(SEQ_STORE, …)` is a strided *view*.
  `get_windows(rows)` reads only the rows asked for. An assertion checks that the last step of each window equals the
  tabular features of the same packet.
* **`WindowDataset` / `make_loader`:** the PyTorch DataLoader receives a whole batch of indices at once (via
  `BatchSampler`), so only one batch of windows ever exists in RAM.

### §7 Preprocessing

* Drops features that are constant on FIT, or exact copies of another feature on FIT. Both decisions use FIT only.
* `PREP` is a `ColumnTransformer` with a median imputer, fitted on FIT. It is saved inside every tabular model pipeline.
* Scaling is applied only where needed:
  * Logistic regression gets `arcsinh` followed by `StandardScaler`, inside its own pipeline.
  * The neural networks get `arcsinh` followed by standardisation with FIT statistics, stored inside the network (§13).
  * Tree models need no scaling.

### §8 Labels and collapse matrices

* `y` is the class index in `LABEL_RULES` order.
* `EVAL_LEVELS` holds the 0/1 matrices M₁₃→₇, M₁₃→₄ and M₁₃→₂; `P_coarse = P_variant @ M`. They are displayed in the
  notebook and saved to `label_mapping.json`.
* `PARTS["fit" | "val" | "test"]` holds `X`, `y`, `w` (all 1) and `meta`. The meta columns are file, capture, packet
  index, timestamp and the row in the sequence store.

### §9 Leakage-safe splitting and data audit

* **Assertions:**
  * no test file appears in FIT or VAL;
  * in every training capture, FIT packets come before VAL packets with a gap of at least `CONTEXT_N`, so no VAL window
    contains a FIT packet.
* **Reports:**
  * a split table per class;
  * the per-capture assembly report (packets dropped as background, warm-up and gap, plus TCP/UDP/ICMP/non-IP shares);
  * a class distribution plot;
  * **shortcut evidence**: each capture occupies its own time range, so the timestamp alone identifies the capture;
  * **label conflicts**: identical feature vectors with different labels. Their share is a floor on any per-packet
    model's error;
  * the share of TEST feature vectors that also occur in FIT.

### §10 Training framework and baselines

* **Class weighting** (`none`, `sqrt_balanced` or `balanced`) is tuned as a hyper-parameter. For neural networks it
  becomes per-class loss weights. SMOTE is not used, and VAL/TEST are never reweighted.
* **Tuning set:** a class-stratified draw of `TUNE_ROWS_PER_CLASS` FIT packets per class. Each trial is scored on the
  **full VAL** set.
* **`run_search(name)`:** random search with `ParameterSampler`. Every finished trial is appended to `tuning/trials.csv`
  straight away, and trials already in the file are skipped.
* **`final_fit(name)`:**
  * takes the best trial, ranked by VAL macro-F1, then worst-class recall, then benign false-alarm rate;
  * refits it on all FIT packets and saves it immediately with a `meta.json`;
  * on a re-run, reloads the saved model if its configuration key matches.
* **`evaluate()`** computes accuracy, balanced accuracy, macro and weighted P/R/F1, per-class P/R/F1 and one-vs-rest
  FPR, the confusion matrix, OvR ROC-AUC, log-loss, multiclass Brier score, top-label ECE, the benign false-alarm rate
  and the rate of attacks missed as benign. Classes absent from a partition are reported as undefined (NaN).
* Fits the baselines: Dummy (class prior), Logistic Regression and Decision Tree.

### §11 Random Forest and AdaBoost

Search, then a final fit, for each. AdaBoost boosts depth-1 to depth-3 trees and uses `SAMME` (see
[section 14](#14-known-limitations-and-deviations-from-the-original-spec)).

### §12 XGBoost and LightGBM

* **XGBoost:** `multi:softprob` with `tree_method="hist"` on CUDA when available, early stopping on VAL, then switched to
  CPU for portable inference. Also saved as native `model.json`.
* **LightGBM:** multiclass with early stopping on VAL. Also saved as native `model.txt`.

### §13 Deep sequence models (PyTorch)

A `%%writefile` cell writes **`iomt_torch_models.py`**.

* **`BiRNNClassifier`:**
  * input normalisation buffers;
  * a 2-layer bidirectional LSTM or GRU (the cell type is a hyper-parameter);
  * the final forward and backward states, concatenated;
  * dropout, a linear head, and softmax.
* **`PacketTransformer`:**
  * input normalisation;
  * a linear projection to `d_model`;
  * sinusoidal positional encoding;
  * 2–3 pre-norm encoder blocks (multi-head attention plus a GELU feed-forward layer);
  * a final LayerNorm;
  * average pooling over the 20 steps;
  * dropout, a linear head, and softmax.
* Each window ends at the current packet, so the bidirectional RNN still uses only the present and the past.
* **Training (`train_sequence_model`):**
  * batched DataLoader over the strided windows;
  * AdamW with a per-step cosine-annealing learning rate;
  * AMP (fp16 autocast with GradScaler) on CUDA;
  * gradient clipping at 1.0 and class-weighted cross-entropy;
  * early stopping on VAL loss over a fixed 200k-packet VAL subset;
  * batch tensors deleted after every step, and `empty_cache()` after every epoch;
  * a resumable checkpoint (`ckpt_last.pt`) written after every epoch.
* Each epoch draws `SEQ_SAMPLES_PER_EPOCH` random FIT windows.
* **`TorchSequencePredictor`** is the portable wrapper. It can be pickled (it saves a CPU state dict plus a spec), runs on
  CPU by default, provides `predict_proba(windows)` and saves to `.pt`.

### §14 Multi-criteria model selection

* Writes `bench/bench_model.py` and runs it **in a fresh subprocess for each model**, plus one imports-only baseline
  subprocess per model type. Each subprocess loads the saved model file and measures:
  * single-packet latency p50/p95 (ms) over `BENCH_REPEATS` calls;
  * 1,000-packet batch latency p50/p95 (ms);
  * throughput (packets/s) on `BENCH_ROWS` packets;
  * peak RAM, minus the imports-only baseline;
  * for neural networks on a GPU machine, a second run that records GPU latency and peak inference VRAM.
* All benchmarks run on **CPU**, the portable deployment target, with the same thread count for every model.
* Results are cached per model in `bench.json`.
* Builds the selection table, computes the composite score, picks `SELECTED` and plots the score breakdown and the
  accuracy/latency trade-off. See [section 8](#8-model-selection-composite-score-and-manual-override).

### §15 Probability calibration

* Uses Platt scaling: `CalibratedClassifierCV(method="sigmoid")`, fitted on **VAL only**.
* It works on **any** model's probabilities. `rt.ProbaPassthrough` takes the probability matrix as input and exposes
  log-probabilities as its decision function, and a sigmoid is fitted per class and then renormalised.
* **Honest VAL estimate:** the calibrator is cross-fitted on the two halves of each capture's VAL block and evaluated on
  the other half. A reliability diagram compares raw and cross-fitted probabilities.
* The final calibrator is fitted on all of VAL and saved as `calibrator_sigmoid.joblib`.

### §16 Final evaluation on TEST (run once)

* Scores **every** model on TEST at all four levels; the headline is the selected, calibrated model.
* **Tables:** all metrics per model and level, plus per-class reports for the selected model.
* **Plots:**
  * the 13×13 row-normalised confusion matrix;
  * 7/4/2-class confusion matrices;
  * per-class precision–recall curves with AP;
  * per-class F1 across models;
  * macro-F1 by level;
  * the TEST reliability diagram (raw vs calibrated).

### §17 Robustness

1. **Gap table:** FIT vs VAL vs TEST macro-F1. FIT→VAL shows how the model holds up on later traffic of the same
   captures; VAL→TEST shows how it transfers to unseen capture sessions.
2. **Error analysis:**
   * the top confusions;
   * error compared with the label-conflict floor;
   * classes ordered by training support.
3. **Permutation importance on VAL:** the drop in macro-F1 when one feature is shuffled. For neural networks the feature
   is shuffled across windows at every time step. Tree models also get their native importance. The top 5 features go
   into the bundle.
4. **Shortcut ablation:** the same configuration retrained on three feature sets, using the same stratified sample:
   * (a) clean features;
   * (b) clean features plus `timestamp` and `packet_no`;
   * (c) `timestamp` and `packet_no` only.

   Expected pattern: (b) and (c) look perfect on VAL and collapse on TEST.
5. **Leave-capture-out:** for classes with two or more training sessions (e.g. DDoS-UDP1/2, DDoS-ICMP1/2), the last
   session is held out, the model is retrained without it, and recall on the unseen session is compared with in-capture
   VAL recall.

Parts 4 and 5 use the selected model if it is tabular. Otherwise they use the best-scoring tabular model, because
retraining a neural network several times costs far more and adds little information about the *features*.

### §18 Bundle export and best-model pointer

* Writes `models/detector_bundle.joblib` and the supporting files (see [section 10](#10-deployment-the-bundle-and-the-live-engine)).
* Updates `OUTPUT_DIR/experiment_log.csv`, a project-wide log across runs.
* **Best-model pointer** (`OUTPUT_DIR/best_model/`): replaced only when a run has a higher **VAL macro-F1** under the
  **same protocol**. The protocol is a hash of the data, extraction settings, split, context, label level and
  off-protocol policy. The same run always updates its own entry. `FORCE_UPDATE_BEST = True` overrides this.

### §19 Live PCAP inference engine

* A `%%writefile` cell writes **`iomt_inference.py`** and copies it next to the bundle.
* Demo: loads the bundle from disk, streams the first `DEMO_PACKETS_PER_FILE` packets of one TEST capture per family and
  reports the share of packets predicted as attack, as the true family and as the true variant. It also reports
  end-to-end packets/s and prints example incidents.

### §20 Final summary

* `FINAL_TABLE` shows **every statistic for every model**, in four groups: selection (VAL), latency, resources, and TEST
  (for reporting only). It is saved as `final_model_comparison.csv`.
* Prints instructions for changing the selection by hand, followed by the headline result block.

---

## 5. Features reference

The 22 raw decoded fields per packet (`rt.RAW_COLUMNS`) are timestamp, frame length, IP version, ARP flag, IP header
length, TTL/hop limit, L4 protocol, DF/MF/fragment bits, source/destination port, TCP flags, TCP window, TCP header
length, L4 payload length, ICMP type/code, MQTT control type, 32-bit hashes of the source and destination address, and a
malformed flag. **None of the identifiers are model features.**

### 39 per-packet features (`BASE_FEATURES`; also the sequence-model input per time step)

| Group | Features |
|---|---|
| Size | `frame_len`, `ip_hdr_len`, `payload_len` |
| IP | `ttl`, `is_ipv4`, `is_ipv6`, `is_arp`, `ip_df`, `ip_mf`, `ip_frag` |
| Protocol | `is_tcp`, `is_udp`, `is_icmp`, `is_other_l4` |
| TCP | `tcp_fin`, `tcp_syn`, `tcp_rst`, `tcp_psh`, `tcp_ack`, `tcp_urg`, `tcp_ece`, `tcp_cwr`, `tcp_win`, `tcp_hdr_len` |
| ICMP | `icmp_type`, `icmp_code` (−1 when not ICMP) |
| Ports, as flags only | `sport_mqtt`, `dport_mqtt` (1883/8883), `sport_wellknown`, `dport_wellknown` (<1024) |
| MQTT | `mqtt_connect`, `mqtt_publish`, `mqtt_other` (from the first payload byte on MQTT ports) |
| Timing | `log_iat_prev` = log₁₀(time since previous packet + 1e-7) |
| Relational | `same_src_prev`, `same_dst_prev`, `same_sport_prev`, `same_dport_prev` (equal to the previous packet's value?) |
| Quality | `malformed` |

### 27 context features (`CONTEXT_FEATURES`, over packets *i−19 … i*)

| Group | Features |
|---|---|
| Length | `ctx_len_mean`, `ctx_len_std`, `ctx_len_min`, `ctx_len_max`, `ctx_len_sum`, `ctx_payload_mean` |
| TTL | `ctx_ttl_mean`, `ctx_ttl_std` |
| Timing / rate | `ctx_log_iat_mean`, `ctx_iat_cv` (std/mean of gaps), `ctx_log_pkt_rate`, `ctx_log_byte_rate` |
| TCP flag ratios | `ctx_syn_ratio`, `ctx_ack_ratio`, `ctx_fin_ratio`, `ctx_rst_ratio`, `ctx_psh_ratio` |
| Protocol mix | `ctx_tcp_ratio`, `ctx_udp_ratio`, `ctx_icmp_ratio`, `ctx_other_ratio` |
| MQTT mix | `ctx_mqtt_connect_ratio`, `ctx_mqtt_publish_ratio` |
| Distinct counts | `ctx_n_src`, `ctx_n_dst`, `ctx_n_sport`, `ctx_n_dport` (computed from hashes, so no identity is used) |

* **Tabular models** use base + context, i.e. 66 features. §7 removes any that are constant or duplicated on FIT; the
  final list is saved in `feature_schema.json`.
* **Sequence models** use a 20 × 39 window.
* **`ctx_n_src` is the main DoS-vs-DDoS signal.** A DDoS has many attacking sources, a DoS has one.
* **Never features:** `timestamp`, `packet_no`, MAC/IP addresses, raw ports, hashes. `timestamp` and `packet_no` appear
  only in the §17 ablation.

---

## 6. Configuration reference (§3)

Settings marked **H** are hashed. Changing one starts a new run folder and retrains everything that depends on it.
Unmarked settings can be changed freely.

### Paths

| Setting | Default | Notes |
|---|---|---|
| `DATA_DIR` | `/content/drive/MyDrive/CICIoMT2024` (env `IOMT_DATA_DIR`) | Searched recursively |
| `OUTPUT_DIR` | `/content/drive/MyDrive/FYP_IoMT_Detector` (env `IOMT_OUTPUT_DIR`) | Caches, runs, best model |
| `LOCAL_DIR` | `/content/iomt_local` on Colab (env `IOMT_LOCAL_DIR`) | Fast disk for the sequence store; wiped on disconnect, rebuilt automatically |

### Labels and extraction

| Setting | Default | H | Notes |
|---|---|---|---|
| `TRAIN_LEVEL` | `"variant"` | H | Also `"subtype"` or `"family"`; only levels derivable from it are reported |
| `ALLOW_MISSING_CLASSES` | `False` | | `True` continues when a class lacks a train or test capture |
| `PACKETS_PER_CAPTURE` | `1_000_000` | H | Packets extracted per capture |
| `BLOCK_PACKETS` | `20_000` | H | Block length, which is also the streaming batch size |
| `CONTEXT_N` | `20` | H | Window length for features and sequence models |
| `OFF_PROTOCOL_POLICY` | `"drop"` | H | `"drop"`, `"keep_label"` (label every packet by file name) or `"relabel_benign"` |

### Split and row budgets

| Setting | Default | H | Notes |
|---|---|---|---|
| `VAL_FRACTION` | `0.20` | H | Tail of each training capture |
| `GAP_FRACTION`, `GAP_MIN_ROWS`, `GAP_MAX_ROWS` | `0.01`, `50`, `5_000` | H | The gap is also forced to at least `CONTEXT_N + 1` |
| `FIT_ROWS_PER_CLASS` | `200_000` | H | FIT packets in RAM per class |
| `VAL_MAX_ROWS`, `TEST_MAX_ROWS` | `650_000`, `1_300_000` | H | Totals; one fraction applies to all classes |
| `TUNE_ROWS_PER_CLASS` | `40_000` | H | Size of the search set |

### Models

| Setting | Default | H | Notes |
|---|---|---|---|
| `MODELS_TO_RUN` | all 8 (+ dummy) | | Remove a name to skip that model |
| `N_ITER` | LR 4, DT 8, RF 6, Ada 6, XGB 10, LGBM 10, BiRNN 3, Transformer 3 | | Random-search trials per model |
| `EARLY_STOPPING_ROUNDS`, `MAX_BOOST_ROUNDS` | `30`, `1_500` | H | |
| `SEQ_BATCH` | `1024` | H | |
| `SEQ_TUNE_EPOCHS`, `SEQ_TUNE_SAMPLES_PER_EPOCH` | `4`, `150_000` | H | Neural-network search trials |
| `SEQ_EPOCHS`, `SEQ_SAMPLES_PER_EPOCH`, `SEQ_PATIENCE` | `12`, `400_000`, `3` | H | Final neural-network fit |
| `USE_AMP` | `True` | H | Mixed precision on CUDA |
| `CALIBRATION_METHOD` | `"sigmoid"` | | Platt scaling |

### Selection (never hashed: changing these never retrains)

| Setting | Default | Notes |
|---|---|---|
| `SCORE_WEIGHTS` | `{"macro_f1": 0.6, "latency": 0.2, "memory": 0.2}` | Must sum to 1 |
| `LATENCY_METRIC` | `"batch1k_p95_ms"` | Or `single_p95_ms`, `single_p50_ms`, `batch1k_p50_ms` |
| `MEMORY_METRIC` | `"peak_ram_mb"` | Model RAM above the imports-only baseline |
| `MANUAL_SELECTION` | `None` | Set to a model name to override the composite winner |
| `BENCH_REPEATS`, `BENCH_ROWS` | `200`, `10_000` | Benchmark size |

### Robustness and demo

| Setting | Default | Notes |
|---|---|---|
| `RUN_SHORTCUT_ABLATION`, `ABLATION_ROWS_PER_CLASS` | `True`, `20_000` | |
| `RUN_LEAVE_CAPTURE_OUT` | `True` | |
| `PERMUTATION_ROWS` | `20_000` | |
| `DEMO_PACKETS_PER_FILE` | `5_000` | §19 demo length |
| `SEVERITY_THRESHOLDS` | `{"high": 0.90, "medium": 0.60}` | Applied to calibrated confidence; stored in the bundle |

### Hardware ceilings (set in §2)

`RAM_LIMIT_GB = 12.7`, `VRAM_LIMIT_GB = 15.0` and `RAM_SAFETY_FRACTION = 0.85`.

---

## 7. Models and search spaces

| Model | Kind | Search space | Notes |
|---|---|---|---|
| `dummy` | tabular | n/a | Class-prior baseline; benchmarked but never selected |
| `logreg` | tabular | `C` ∈ {0.01, 0.1, 1, 10} | Pipeline of arcsinh, StandardScaler and LogisticRegression |
| `decision_tree` | tabular | depth {8, 12, 16, 24, None}, min leaf {1, 5, 20, 50}, gini/entropy | |
| `random_forest` | tabular | trees {100, 200}, depth {16, 24, 32}, min leaf {2, 5, 10}, max_features {sqrt, 0.3, 0.5}, max_samples {0.05, 0.1, 0.25} | Capped to keep RAM bounded on raw packets |
| `adaboost` | tabular | estimators {50, 100, 200}, lr {0.1, 0.5, 1.0}, base depth {1, 2, 3} | `SAMME` (or `SAMME.R` if still available) |
| `xgboost` | tabular | depth {4, 6, 8, 10}, lr {0.05, 0.1, 0.2}, subsample, colsample, min_child_weight, λ, α, γ | CUDA training, CPU inference |
| `lightgbm` | tabular | leaves {31, 63, 127}, lr, colsample, subsample, min_child_samples, λ | |
| `birnn` | sequence | cell {lstm, gru}, hidden {64, 128}, layers 2, dropout {0.1, 0.2, 0.3}, lr {1e-3, 2e-3}, wd {1e-4, 1e-2} | |
| `transformer` | sequence | d_model {64, 96}, heads 4, layers {2, 3}, ff_mult {2, 4}, dropout {0.1, 0.2}, lr {5e-4, 1e-3}, wd {1e-4, 1e-2} | |

Every model also searches `class_weighting` ∈ {none, sqrt_balanced, balanced}.

---

## 8. Model selection (composite score and manual override)

$$\text{Score}=0.6\cdot\text{MacroF1}_{\text{VAL}}+0.2\left(1-\frac{\text{Latency}}{\text{Latency}_{\max}}\right)+0.2\left(1-\frac{\text{Memory}}{\text{Memory}_{\max}}\right)$$

* The maxima are taken over the candidate models in the current run, excluding the dummy. A score is therefore
  **relative to the other models in that run** and cannot be compared across runs.
* Ties are broken by macro-F1, then worst-class recall.
* **To choose a different model:**
  1. Read the §20 table.
  2. Set `MANUAL_SELECTION = "lightgbm"` (or another model name) in §3.
  3. Run §3 again, then §14 through §20, or simply *Run all*. Nothing is retrained; calibration, the TEST headline, the
     bundle and the pointer all follow your choice, and the bundle records `selection.mode = "manual"`.
* **Make the choice from the VAL and cost columns.** The TEST columns are for reporting. Choosing by TEST score turns
  TEST into a selection set and makes the reported TEST numbers optimistic.
* **Caveat on latency and memory:** these are measured on the machine running the notebook (Colab CPU, 2 cores). Measure
  again on the real gateway before quoting deployment numbers.

---

## 9. Outputs: every file the notebook writes

```
OUTPUT_DIR/
├── cache/                                   shared by all runs, keyed by file fingerprint + extraction settings
│   ├── <file>.<fingerprint>-<extracthash>.parquet     raw decoded packets (sampled blocks)
│   └── <file>.<fingerprint>-<extracthash>.json        packets total/extracted, blocks, malformed, timing
├── experiment_log.csv                       one row per (run, model), across all runs
├── best_model/
│   ├── best_model.json                      pointer: run, model, protocol hash, VAL macro-F1, selection mode
│   ├── detector_bundle.joblib               copy of the best run's bundle
│   └── iomt_runtime.py, iomt_torch_models.py, iomt_inference.py
└── runs/run_<CONFIG_HASH>/
    ├── run_config.json                      all hashed settings, data fingerprints, versions, hardware
    ├── experiment_summary.csv               this run, one row per model
    ├── final_model_comparison.csv           the full §20 table
    ├── tuning/trials.csv                    every search trial (resumable)
    ├── bench/                               bench_model.py + the fixed benchmark inputs
    ├── figures/                             every plot (PNG)
    ├── reports/
    │   ├── file_manifest.csv                every file found, status and reason
    │   ├── extraction_report.csv            per capture: format, packets, blocks, malformed, timing
    │   ├── assembly_report.csv              per capture: background packets dropped, warm-up, gap, protocol mix
    │   ├── label_mapping.json               classes, rules, hierarchy, collapse matrices
    │   ├── label_conflicts.csv              conflict share and error floor per level
    │   ├── model_selection_multicriteria.csv
    │   ├── test_metrics_all_models.csv, test_results_full.json, test_per_class_<level>_<model>.csv
    │   ├── generalization_gaps.csv, top_confusions.csv, error_vs_floor.csv
    │   ├── feature_importance_<model>.csv
    │   ├── shortcut_ablation.csv, leave_capture_out.csv
    └── models/
        ├── detector_bundle.joblib           THE deployment artifact
        ├── detector_model.{json|txt|pt|pipeline.joblib}   native copy of the selected model
        ├── iomt_runtime.py, iomt_torch_models.py, iomt_inference.py
        ├── model_card.json                  the bundle's metadata as readable JSON
        ├── feature_schema.json              feature order, raw fields, everything excluded and why
        └── <model>/
            ├── pipeline.joblib | model.pt   (+ model.json for XGBoost, model.txt for LightGBM)
            ├── meta.json                    params, fit/VAL metrics, fit time, peak RAM/VRAM, disk size, curves
            ├── val_per_class.csv, bench.json
            ├── calibrator_sigmoid.joblib    selected model only
            └── ckpt_last.pt                 only while a neural network is training (deleted when it finishes)

LOCAL_DIR/seq_store_<key>.npy (+ .complete)   memory-mapped per-packet features, ~7 GB, rebuilt if missing
```

---

## 10. Deployment: the bundle and the live engine

### What is in `detector_bundle.joblib`

| Key | Content |
|---|---|
| `predictor` | Tabular: a `Pipeline(prep → classifier)` that takes a DataFrame with the feature columns. Sequence: a `TorchSequencePredictor` that takes `(n, 20, 39)` windows. |
| `model_kind`, `model_name` | `"tabular"` or `"sequence"`; the model's name |
| `calibrator` | The Platt calibrator; takes a probability matrix and returns calibrated probabilities |
| `classes`, `train_level`, `eval_levels`, `hierarchy` | Label space and collapse matrices |
| `features`, `tab_features_all`, `seq_features`, `context_n`, `extract_config`, `runtime_version` | Feature schema |
| `selection` | Mode (composite or manual), the composite winner, weights, metrics, and the full selection table |
| `benchmarks`, `hardware`, `val_metrics`, `test_metrics`, `test_metrics_uncalibrated` | Evidence |
| `top_features`, `params`, `adaboost_algorithm`, `severity_thresholds`, `off_protocol_policy` | |
| `run_config`, `config_hash`, `versions`, `random_state`, `data_manifest`, `created_utc` | Reproducibility |

### Running the live engine

From the command line, on a machine with the bundle folder:

```bash
python models/iomt_inference.py models/detector_bundle.joblib capture.pcap --emit attacks > incidents.jsonl
#   --emit all            every packet, not only attacks
#   --max-packets N       stop after N packets
#   --batch-size 1000
```

From Python:

```python
import sys; sys.path.insert(0, "models")
import iomt_inference as inf
det = inf.load_detector("models/detector_bundle.joblib")
for incident in inf.predict_pcap_stream("capture.pcap", det, batch_size=1000, emit="attacks"):
    route_to_controller(incident)
```

The steps inside are: read packets → decode with dpkt → build causal features, carrying the last 20 packets between
batches (`StreamFeaturizer`) → model → calibrator → probabilities at 4 levels → incident.

### Incident schema

```json
{
  "timestamp": "2023-10-13T15:06:40.014Z",
  "src_ip": "192.168.137.156",
  "dst_ip": "192.168.137.250",
  "attack_variant": "MQTT-DDoS-Publish",
  "attack_subtype": "MQTT-Publish",
  "attack_family": "MQTT-Flood",
  "attack_binary": "Attack",
  "confidence": 0.9989,
  "top3_predictions": [["MQTT-DDoS-Publish", 0.9989], ["DDoS-UDP", 0.0001], ["DDoS-ICMP", 0.0001]],
  "initial_severity": "high",
  "inference_latency_ms": 0.005,
  "model_version": "run_e75d9cdc3b",
  "packet_index": 1500,
  "context_warmup": false
}
```

*(This example is from the synthetic test run.)*

* `confidence` is the calibrated probability of the top variant.
* `initial_severity` is `none` for Benign. For attacks it is `high` at confidence ≥ 0.90, `medium` at ≥ 0.60, otherwise
  `low`. The Controller is expected to combine it with device criticality.
* `inference_latency_ms` is the model and calibration time per packet within its batch, **excluding parsing**.
* `packet_index` and `context_warmup` are additions to the original spec. `context_warmup: true` marks the first 20
  packets of a stream, whose window is incomplete.
* IP addresses are filled in **for the report only**. They are never model inputs.
* Every packet is classified, including background traffic. The protocol filter applied only to training labels.

### Loading requirements

The three `.py` files must sit next to the bundle, because the pickled objects reference `iomt_runtime` and
`iomt_torch_models`; `load_detector` adds the bundle folder to `sys.path`. The tabular pipelines are pickled with
scikit-learn, so load them with the same version (recorded in `versions`; a mismatch prints a warning). XGBoost and
LightGBM boosters are also saved in their native formats, which load across library versions.

---

## 11. Resuming, caching and run hashes

| Layer | Where | Skipped on re-run when |
|---|---|---|
| Captures | `cache/*.parquet` + `.json` | The file fingerprint and extraction settings are unchanged |
| Sequence store | `LOCAL_DIR/seq_store_<key>.npy` + `.complete` | It exists and is complete; otherwise it is rebuilt from the cache |
| Search trials | `tuning/trials.csv` | The trial key (model + params) is already in the file |
| Final models | `models/<m>/meta.json` + artifact | The best trial's key matches the saved one |
| Neural-network epochs | `models/<m>/ckpt_last.pt` | The key matches; training resumes from the next epoch |
| Benchmarks | `models/<m>/bench.json` | Same model key, benchmark settings and hardware |
| Calibrator | `calibrator_sigmoid.joblib` | Same model key and method |
| Ablation / leave-capture-out | `reports/*.csv` | Same model key |

* **Run folder:** `CONFIG_HASH` is a hash of all hashed settings plus the sorted data fingerprints. Changing a hashed
  setting or the data starts a new folder, so old checkpoints are never mixed with new ones.
* **Measured on synthetic data:**
  * a full re-run took **51 s**, against **204 s** for the first run;
  * after a simulated disconnect (local disk wiped) with a manual-selection change, it took **61 s** and retrained
    nothing.
* **Deliberately not cached:** feature assembly in §6 is recomputed each run from the Parquet caches. It is
  deterministic and takes about 1 µs per packet, so about a minute for 45M packets plus Drive read time.

---

## 12. Memory and hardware safety

* **Bounded extraction:** one 20,000-packet block in memory at a time, and features computed block by block.
* **dtypes:** features are `float32` and labels `int64`. Timestamps stay `float64`, because epoch values lose precision
  in `float32`; they are never model features.
* **Bounded RAM:** only sampled targets are held in RAM. At the defaults this is about 1.2 GB of feature matrices. The
  sequence windows stay on disk (memory-mapped) and only one batch is read at a time.
* **Explicit cleanup:** `gc.collect()` and `torch.cuda.empty_cache()` run after each capture, trial, refit, epoch and
  TEST pass. Large intermediate arrays are deleted as soon as they are used.
* **`mem_guard` before every heavy step:** it stops with an actionable message instead of letting Colab crash. If it
  triggers, lower the row budgets in §3 and re-run; caches make that cheap.
* **Model size:** Random Forest depth and leaf limits keep model size bounded (see [section 14](#14-known-limitations-and-deviations-from-the-original-spec)).
* **Disk needed:**
  * Drive: about 20 MB of Parquet per 1M extracted packets on the synthetic data (zstd-compressed). Real traffic is
    more varied, so allow 20–60 MB per capture and check the first few.
  * Local: about 7 GB for the sequence store at the defaults. §6 checks free space first.

---

## 13. How it was tested

The real CICIoMT2024 captures were not available while building, so testing used **synthetic CICIoMT-style captures**
(`make_synthetic.py`, not part of the deliverable):

* all 13 classes, train and test;
* two sessions each for DDoS-UDP and DDoS-ICMP (for leave-capture-out);
* about 4 % background traffic inside attack captures;
* Recon and ARP files (to test exclusion);
* one `.pcapng` file (to test the sequential-read path).

**Checks performed:**

* A full run in smoke mode completed: all 20 sections, all 9 models, with no errors or warnings.
* The leakage assertions passed (capture isolation, and a purge gap of at least `CONTEXT_N`).
* **Streaming features equal block features exactly** (maximum difference 0.0), so live and training features cannot
  drift apart.
* Sequence windows equal the tabular per-packet rows.
* PyTorch training resumes from a checkpoint, and the predictor survives pickling and `.save`/`.load` with identical
  outputs.
* Resume, disconnect, and manual selection (a tabular model and the Transformer) all worked without retraining.
* The sequence-model deployment path works end to end: calibration, window-level permutation importance, `.pt` bundle,
  live engine.
* The standalone CLI ran in a separate process from another folder, using only the `best_model/` files: 2,999/3,000
  packets of an MQTT-DDoS-Publish capture were flagged, with 3/3,000 false alarms on Benign.
* The notebook passes `nbformat` validation and contains no machine-specific paths.

**Not tested:**

* real data;
* the GPU code paths (XGBoost on CUDA, AMP, the NVML VRAM readings);
* full-size budgets.

Synthetic scores (≈0.999 macro-F1) say **nothing** about real performance. The first real run is the real test.

---

## 14. Known limitations and deviations from the original spec

1. **AdaBoost runs SAMME, not SAMME.R.** scikit-learn deprecated `SAMME.R` in 1.4 and removed it in 1.6; current Colab
   ships 1.6 or later. The notebook uses `SAMME.R` only if your version still accepts it, and logs which one ran (also
   stored in the bundle).
2. **Random Forest search space is tighter than the CSV pipeline's.** The CSV pipeline compressed duplicate rows; raw
   packets are not compressed. Fully grown trees on about a million packets each could exceed the 12.7 GB RAM ceiling.
3. **The best-model pointer compares VAL macro-F1, not the composite score.** Latency and memory depend on the machine
   and on the other models in a run, so composite scores cannot be compared across runs.
4. **Packet sampling.** At most 1M packets per capture, and then sampled targets (200k FIT per class, 650k VAL and 1.3M
   TEST in total). VAL and TEST keep the class proportions *of the extracted packets*. Because large captures are capped
   at 1M, those proportions are not those of the full captures.
5. **TTL may be an environment cue.** In this lab, attackers and benign internet hosts sit at different hop distances,
   so TTL partly encodes where traffic comes from. Check its permutation importance before trusting the model on
   another network.
6. **Stream context is global, not per flow.** The 20-packet window is "the last 20 packets on the link", not per host
   or per flow. This suits floods. On a busy real network, mixed traffic would dilute the context, so per-flow context
   is a possible extension.
7. **Background packets are scored at deployment, but were never training targets.** At inference, a benign web packet
   in the middle of a flood sees flood context and may be flagged as attack. This is arguably correct (the link *is*
   under attack), but is worth explaining in the report.
8. **Neural networks are benchmarked on CPU for the score.** GPU latency and VRAM are recorded separately. If the target
   gateway has a GPU or NPU, re-weight or re-benchmark.
9. **Shortcut ablation and leave-capture-out use a tabular model** when the selected model is a neural network.
10. **pcapng files are read sequentially** (no seeking), so they are slower to extract than classic pcap.
11. **MQTT type is read from the first payload byte of each TCP segment.** Segments carrying several MQTT messages, or
    continuation data, are only approximated.

---

## 15. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `FileNotFoundError: DATA_DIR does not exist` | Wrong path | Copy the folder path from the Colab Files pane into `DATA_DIR` |
| `RuntimeError: These classes lack a train or test capture` | A file is missing or misnamed | Add it, check its name against the label regexes in §4, or set `ALLOW_MISSING_CLASSES = True` |
| A file listed as "rejected: cannot infer train/test split" | No `_train`/`_test` suffix and no `train`/`test` folder | Rename it or move it into a `train`/`test` folder |
| `MemoryError: … needs ~X MB` from `mem_guard` | Row budgets too large for this runtime | Lower `FIT_ROWS_PER_CLASS`, `VAL_MAX_ROWS` or `TEST_MAX_ROWS`; re-run (caches are reused) |
| `OSError: Not enough local disk for the sequence store` | Local disk full | Lower `PACKETS_PER_CAPTURE`, remove `birnn`/`transformer` from `MODELS_TO_RUN`, or point `IOMT_LOCAL_DIR` elsewhere |
| `MANUAL_SELECTION='x' is not a trained model` | Typo, or the model was skipped | Use one of the names printed in the error |
| `benchmark failed for …` | The subprocess could not import the modules or load the model | Check that `iomt_runtime.py` / `iomt_torch_models.py` exist in the notebook's working folder; read the stderr shown |
| "Global best kept: different evaluation protocol" | This run's data or settings differ from the best run's | Expected; set `FORCE_UPDATE_BEST = True` to replace it deliberately |
| "Note: bundle saved with scikit-learn X, running Y" | Version mismatch at load time | Install version X, or use the native `.json`/`.txt` booster |
| Extraction is very slow | Drive I/O | Copy the PCAPs to local disk and point `DATA_DIR` there |
| You changed a setting and everything retrains | It is a hashed setting | Expected: it starts a new run folder. Selection settings are not hashed |

---

## 16. How to extend it

* **Add a tabular model:**
  1. Add its name to `MODELS_TO_RUN` and `N_ITER`.
  2. Add a search space to `SPACES` and a branch in `fit_model()` (§10).
  3. Call `run_search("name"); final_fit("name")` in a new cell.

  Benchmarking, selection, TEST evaluation and the bundle pick it up automatically.
* **Add a sequence model:**
  1. Add a class to `ARCHS` in `iomt_torch_models.py`.
  2. Add the name to `SEQ_MODELS`, `SPACES` and `MODELS_TO_RUN`.

  `fit_seq_model` builds it with `tm.build_model(name, …)`.
* **Add a feature:**
  1. Edit `build_features` in `iomt_runtime.py` and add the name to `BASE_FEATURES` or `CONTEXT_FEATURES`.
  2. Bump `RUNTIME_VERSION`.
  3. If you also change decoding (`decode_records` / `RAW_SPEC`), bump `PARSE_VERSION`, which invalidates the Parquet
     caches.

  Feature-only changes reuse the caches, because features are recomputed from raw fields each run.
* **Add an attack class:** add a rule to `LABEL_RULES` (§4) with its subtype and family, and a protocol rule in
  `protocol_match` (§6).
* **Different context length:** change `CONTEXT_N`. Extraction caches are reused; features and the sequence store are
  rebuilt.
* **Per-flow context:** compute `build_features` per flow key (for example, the destination host) instead of per block,
  and mirror the change in `StreamFeaturizer`.

---

## 17. Glossary

| Term | Meaning |
|---|---|
| **FIT / gap / VAL / TEST** | Training data / purged buffer / validation (tail of training captures) / held-out test captures |
| **Capture** | One PCAP file. Numbered files (`…ICMP1`, `…ICMP2`) are separate sessions of the same class |
| **Block** | 20,000 contiguous packets read from one position in a capture |
| **Context window** | The current packet plus the previous 19 in the same block or stream |
| **Warm-up** | Packets whose window is incomplete (the start of a block or stream); never training targets |
| **Off-protocol packet** | A packet in an attack capture whose protocol cannot belong to that attack (background traffic) |
| **Collapse matrix** | A 0/1 matrix mapping 13-class probabilities to 7, 4 or 2 classes |
| **Composite score** | 0.6·F1 + 0.2·latency term + 0.2·memory term, relative to the other models in the run |
| **Label-conflict floor** | The minimum error any per-packet model must make, because identical feature vectors carry different labels |
| **Shortcut** | A column that identifies the capture rather than the attack (timestamp, packet number, addresses) |
| **ECE** | Expected calibration error: the gap between confidence and accuracy, averaged over confidence bins |
| **CONFIG_HASH** | A hash of result-affecting settings plus the data fingerprints; names the run folder |
| **Protocol hash** | A hash of the data and evaluation protocol; guards the best-model pointer |
