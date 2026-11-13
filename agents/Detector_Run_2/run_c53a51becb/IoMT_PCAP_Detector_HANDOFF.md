# IoMT PCAP Resource-Exhaustion Detector — Handoff Guide

**Notebook:** `FYP_IoMT_PCAP_Detector_dos_ddos_fix_scalerfix.ipynb`: the current version, with the DoS vs DDoS fix and the
GradScaler resume fix. It **has been run on the real captures**; its saved outputs are the evidence in section 21.
**Current recorded run:** `run_c53a51becb` on Colab (Tesla T4, 2 CPU cores, 13.6 GB RAM), 60 CICIoMT2024 captures. Selected
model: Decision Tree, Platt-calibrated. TEST macro-F1 0.858 (variant) / 0.995 (subtype) / 0.951 (family). Full accuracy,
precision and recall at every level are in section 21.
**Previous notebook:** `FYP_IoMT_PCAP_Detector_fixed.ipynb`: the executed pre-fix copy. Its saved outputs are the evidence
in section 18.
**Previous recorded run:** `run_0c8497aa2f`, same hardware and captures. Selected model: Decision Tree, Platt-calibrated.
This is the baseline the fix is measured against.
**Project:** Adaptive Autonomous Cyber Defense for IoMT Networks, Detection and Confidence Module
**Team:** Mohammad Haider Abbas (23i-2558), Hamd Ul Haq (23i-0081), Ayesha Ikram (23i-0109)

This document explains what the notebook does, how to run it, every setting you can change, what it writes to disk, how
to deploy the result, what the previous recorded run found, what the DoS vs DDoS revision changed, and where the known
limits are. You should be able to take over the project from this file plus the notebook alone.

> **What changed in this revision.** The previous run solved attack vs benign and the attack protocol, but not DoS vs
> DDoS (variant TEST macro-F1 0.764 against 0.994 at subtype level). The revised notebook:
>
> * **diagnoses the cause** in a new section, **§5b**;
> * **adds 8 victim-centric long-horizon features** (`rt.LONG_FEATURES`) over the previous `LONG_CONTEXT_N = 1024`
>   packets, with matching eligibility, purge gap and live carry-over;
> * **measures the fix before and after** in **§17 item 6**, and reports a **DoS↔DDoS swap rate** in every results table.
>
> Section 20 of this guide covers the cause, the design and the verification; section 20.6 holds the before/after
> record. **Section 21 is the first real run of the revised notebook** (`run_c53a51becb`), with accuracy, precision and
> recall at the variant, subtype and family levels for every model. Section 18 keeps the previous run's evidence.
>
> **Result in one line.** Variant TEST macro-F1 rose from 0.764 to 0.858 and family from 0.873 to 0.951; subtype stayed
> at 0.995. DoS↔DDoS is now solved for SYN, TCP, UDP and MQTT-Connect, but **not** for DoS-ICMP (recall 0.44) or
> MQTT-DDoS-Publish (recall 0.12), which carry most of the remaining error (section 21.4).

**How this guide refers to the notebook.** `§N` means section N of the notebook (§1–§20 and the new §5b, the `##`
headings). "Section N of this guide" means a section of this file. `In [k]` is the Colab execution count of a code cell
in the **new** notebook after *Run all* (24 code cells). The one exception is **section 18**, which cites the **previous**
notebook (23 code cells). Section 21 cites the **revised** notebook. The new §5b cell is `In [6]`, so every cell from §6 onward is numbered one higher in the new
notebook than in section 18 (old `In [6]` = new `In [7]`, …, old `In [23]` = new `In [24]`). Section 19 maps every
notebook section to its cell.

"Previous run" in the notebook notes of section 4 means the recorded pre-fix run `run_0c8497aa2f`. Those values are
baselines; the new run will produce different numbers wherever the features matter.

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
18. [Recorded run: results and findings](#18-recorded-run-results-and-findings)
19. [Notebook map](#19-notebook-map)
20. [DoS vs DDoS revision: cause, fix and verification](#20-dos-vs-ddos-revision-cause-fix-and-verification)
21. [Recorded run of the revised notebook: accuracy, precision and recall at every level](#21-recorded-run-of-the-revised-notebook-accuracy-precision-and-recall-at-every-level)

---

## 1. What this is, in one page

The notebook trains and evaluates a detector for **resource-exhaustion attacks** on IoMT networks, directly from the raw
**CICIoMT2024 Wi-Fi/MQTT PCAP captures**. It replaces an earlier pipeline that used CIC's pre-extracted CSV features.

* **Input:** every `*_train.pcap` and `*_test.pcap` (or `.pcapng`) under the `CICIoMT2024` folder.
* **Prediction unit:** one prediction **per packet**. Each packet is described by three things, all from the past only,
  so the same features exist in live traffic:
  * its own header fields;
  * statistics over the **previous 20 packets** in the same capture (rates, flag ratios, number of distinct sources, and
    so on);
  * **victim-centric attacker counts over the previous 1,024 packets**: how many hosts send to this packet's
    destination, how many this source sends to, and the pair's share and rate. These are what separate DoS from DDoS.
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
        ▼  §5b DoS vs DDoS diagnosis on the training captures (attackers, bursts, separability ladder)
        ▼  §6  per-packet + 20-packet context + 1,024-packet victim-centric features; roles FIT / gap / VAL / TEST
X matrices (74 features)  +  memory-mapped per-packet store → 20-packet windows (47 values per step) for the networks
        │
        ▼  §7–§9  FIT-only preprocessing · collapse matrices · leakage checks and data audit
§10–§13  train 9 models (resumable)
        │
        ▼  §14  benchmark latency/RAM in clean subprocesses → composite score → selected model
§15 calibrate on VAL → §16 one TEST pass → §17 robustness → §18 bundle → §19 live engine → §20 summary table
```

**Where the project stands.** The current run (`run_c53a51becb`, revised notebook) is summarised here; full detail is in
section 21. The previous run is in section 18 and the revision itself in section 20.

* Both notebooks ran end to end on the real data: 60 captures, 13 variants, no errors in any saved output.
* **Attack vs benign and attack protocol are solved.** For the selected, calibrated model, TEST macro-F1 is 0.985 at the
  binary level and 0.995 at the 7-subtype level; the benign false-alarm rate is 0.0014.
* **DoS vs DDoS is now largely solved.** The fix (victim-centric attacker counts over 1,024 packets) raised the selected
  model's TEST macro-F1 from 0.764 to **0.858** at the variant level and from 0.873 to **0.951** at the family level. On
  one identical sample, the TEST swap rate fell from 0.210 (old features) to 0.108 (new features), and leave-capture-out
  recall for DDoS-SYN / DDoS-TCP rose from 0.377 / 0.528 to 0.887 / 0.988.
* **Two pairs still fail on TEST:** DoS-ICMP (recall 0.436; 56 % predicted as DDoS-ICMP) and MQTT-DDoS-Publish (recall
  0.116; 88 % predicted as MQTT-DoS-Publish). Both are near perfect on VAL, so this is a transfer problem to the test
  sessions, not a capacity problem (section 21.4).
* The composite score again selected the **Decision Tree** (score 0.9798). The six strong models (Decision Tree, Random
  Forest, XGBoost, LightGBM, BiRNN, Transformer) sit within 0.0025 of each other on VAL macro-F1 (0.9806–0.9831), so cost
  decides. **Platt calibration lowered its TEST variant macro-F1 from 0.8835
  to 0.8584** and did not improve ECE there (0.072 → 0.081); see section 21.4 before keeping it.
* `best_model/` was **not** updated by either run (different evaluation protocol). The current bundle is in
  `runs/run_c53a51becb/models/` (protocol hash `1373798b05`). Set `FORCE_UPDATE_BEST = True` to promote it.

---

## 2. Quick start

### On Google Colab (intended setup)

1. Upload the CICIoMT2024 PCAPs, **train and test**, into one Drive folder. The default is
   `/content/drive/MyDrive/CICIoMT2024`. Subfolders are fine.
2. Open the notebook in Colab, then *Runtime → Change runtime type → T4 GPU*.
3. If your folder is elsewhere, edit `DATA_DIR` in §3.
4. *Runtime → Run all*. Accept the Drive mount prompt.
5. If Colab disconnects, reconnect and **Run all again**. Finished work is reloaded, not repeated (see §11 of this guide).

**First run of the revised notebook.** The feature set is new, so `CONFIG_HASH` changes and a new run folder is
created. Expect:

* every model to be searched and refitted again;
* the sequence store to be rebuilt;
* the Parquet capture caches to be **reused**, so no PCAP is re-parsed.

Allow at least the previous run's time for feature assembly and final fits, plus the hyper-parameter search, which the
saved outputs never recorded. §5b reads only a few blocks per training capture. Its real-data runtime is not measured
yet; on the synthetic smoke data it took a few seconds.

Timings of the previous recorded run (T4 runtime, 2 cores; details in section 18.6):

* extraction (`In [5]`): 2,808 s in total (about 47 minutes) for the 60 captures, 5.6–63 s each;
* feature assembly (`In [7]`): 253 s. The new features add about 40 ms per 20k-packet block (about 2,900 blocks), so
  roughly 2 more minutes;
* final model fits (`In [11]`–`In [15]`): about 6,000 s (100 minutes) in total, dominated by the Transformer (1,582 s),
  AdaBoost (1,395 s), the BiRNN (1,058 s) and LightGBM (1,048 s). Hyper-parameter search time is **not** in the saved
  outputs, because they come from a run that reloaded finished trials (see section 11).

### Locally or on another machine

Set paths with environment variables instead of editing the notebook:

```bash
export IOMT_DATA_DIR=/path/to/CICIoMT2024
export IOMT_OUTPUT_DIR=/path/to/output
export IOMT_LOCAL_DIR=/fast/local/disk        # for the ~11 GB sequence store
jupyter lab FYP_IoMT_PCAP_Detector_dos_ddos_fix_scalerfix.ipynb
```

### Smoke test (minutes, for checking the code, not for results)

```bash
export IOMT_SMOKE=1
```

This shrinks every budget: 12k packets per capture, a few thousand rows per class, 1–2 trials per model and 1–2
epochs. It also sets `LONG_CONTEXT_N = 256`, because smoke blocks are only 2,000 packets, and shrinks the §5b sample. The
results are meaningless; use it only to confirm the notebook runs.

### Requirements

Python 3.10+ with `numpy`, `pandas`, `scikit-learn`, `xgboost`, `lightgbm`, `torch`, `dpkt`, `pyarrow`, `psutil`,
`nvidia-ml-py`, `joblib` and `matplotlib`. §2 installs whatever is missing; Colab already has everything except `dpkt` and
`nvidia-ml-py`.

---

## 3. Design decisions and the reasons for them

The first four decisions were confirmed before the build; the fifth was added by the DoS vs DDoS revision (the team
chose "new features + retrain" over a post-hoc vote). They shape everything else.

| Decision | Setting | Reason |
|---|---|---|
| **Prediction unit** | Per packet, with a causal context of the previous 20 packets (`CONTEXT_N = 20`) | Gives per-packet incidents for the Controller while still capturing flood behaviour (rate, flags, number of sources). Using only the past means the same features are available live. |
| **Packets per capture** | 1,000,000, as 50 evenly spaced blocks of 20,000 contiguous packets | Full captures total over a billion packets: hours of parsing and tens of GB of cache. Blocks cover the start, middle and end of each capture, and each block is contiguous, so the 20-packet context is real. |
| **Background packets in attack captures** | Dropped as training/evaluation targets and counted per file (`OFF_PROTOCOL_POLICY = "drop"`) | Attack captures contain ordinary traffic. For example, `DDoS-ICMP1` starts with TCP:443 web packets. Labelling those as the attack would teach the model wrong labels. |
| **Selection weights** | 0.6 F1 / 0.2 latency / 0.2 memory, with a manual override | The detector must be accurate *and* fit an edge gateway. The override lets the team choose differently without retraining. |
| **DoS vs DDoS signal** *(revision)* | Victim-centric attacker counts over the previous 1,024 packets (`LONG_CONTEXT_N`); a target needs that full history inside its block | Same-protocol DoS and DDoS send identical packets and differ only in how many hosts attack one victim. That is visible only over a horizon longer than an attacker's burst, and only when sources are counted per endpoint (section 20). |

Other rules carried over from the CSV pipeline:

* **The official train/test split is respected.** Test captures are never used for training, scaling, tuning,
  calibration or selection.
* **Validation is the chronological tail of each training capture, after a purge gap.** It is not a random split:
  neighbouring flood packets are near-copies, so a random split would inflate every score.
* **Shortcut columns are excluded.** The capture timestamp, packet number and MAC/IP addresses identify the *capture*
  rather than the attack. The §17 ablation confirms they identify the capture (a timestamp-only model scores 1.000 on VAL),
but on the real data it does **not** collapse on TEST. Read section 18.4, item 4, before quoting that ablation.
* **Every learned transform is fitted on FIT only.**
* **No class is ever dropped silently.** Out-of-scope files, rejected files and dropped packets are all listed with
  reasons.

---

## 4. Pipeline walkthrough, section by section

### §1 Title, abstract, architecture and requirements tracing

*Notebook: markdown cell 1 (abstract, diagram, design decisions, requirements-tracing table, "How to run").*

Markdown only: the overview, the architecture diagram, the confirmed decisions, and a table linking each requirement to
the code that implements it.

### §2 Environment setup, GPU detection and library audit

*Notebook: `In [1]`. Previous run: Python 3.13, scikit-learn 1.6.1, XGBoost 3.4.1, LightGBM 4.6.0, PyTorch 2.11.0+cu130, dpkt 1.9.8; Tesla T4 (15.6 GB VRAM), 2 cores, 13.6 GB RAM.*

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

*Notebook: `In [2]`. Previous run: `SETTINGS_HASH` e8f2d1e883, all paths at their defaults.*

All settings live here; see [section 6 of this guide](#6-configuration-reference-3). Settings that affect results are
hashed into `SETTINGS_HASH`. Selection-only settings are deliberately **not** hashed, so changing them never triggers
retraining.

### §4 PCAP discovery, fingerprinting and label parsing

*Notebook: `In [3]`. Previous run: 60 capture files found, none excluded ("Files NOT used: (none)"), `CONFIG_HASH` 0c8497aa2f. Capture counts per class are in section 18.1.*

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

*Notebook: `In [4]` writes `iomt_runtime.py` (now `RUNTIME_VERSION` 1.1.0); `In [5]` runs the extraction. Previous run: 840.8 M packets in the 60 captures, 57.85 M extracted (6.9 %). The new notebook builds 74 tabular features before pruning, up from 66. Extraction itself is unchanged (`PARSE_VERSION` raw-v1), so the existing caches are reused.*

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

**New in the module:**

* `window_group_stats(group, value, H)`: exact, vectorised sliding-window counts and distinct counts per group (for
  example, per destination host).
* `long_horizon_features(src_h, dst_h, ts, n_long)`: the 8 attacker-cardinality columns (section 5).
* `build_features(raw, n_ctx, n_long=1024)` now has an `n_long` argument.
* `StreamFeaturizer(n_ctx, n_long)` now carries `max(n_ctx, n_long)` packets between batches.

### §5b DoS vs DDoS diagnosis (new)

*Notebook: `In [6]`. Reads only `_train` captures; TEST is never touched. Current run: DoS median 1 attacker per block, DDoS 4; DDoS bursts median 4 packets (p90 37); 51.8 % of DDoS packets show a second attacker at 20 packets vs 95.8 % at 1,024; no NOTE printed. Ladder means: 0.641 / 0.847 / 0.948 / 0.954 (section 21.5).*

* **Shared helpers.** `VARIANT_CODE`, `SUBTYPE_OF` and `protocol_match` moved here from §6. They are also used later,
  so this cell must run even when the diagnosis is switched off. The flag only skips the analysis.
  * `dos_ddos_partner(name)` maps `DoS-SYN` → `DDoS-SYN`, `MQTT-DoS-Publish` → `MQTT-DDoS-Publish`, and `DoS` → `DDoS`.
  * `DOS_DDOS_PAIRS` lists the 6 same-protocol pairs.
* **Data.** `DIAG_BLOCKS_PER_CAPTURE` (6) evenly spaced blocks per DoS/DDoS training capture. Each block is one Parquet
  row group, read on its own.
* **(A) Per class:**
  * attackers per block: sources with ≥ 1 % of the victim's inbound attack packets; the victim is the most-targeted
    host;
  * median and p90 length of same-source bursts towards the victim;
  * for each history length in `DIAG_WINDOWS`, plus `CONTEXT_N` and `LONG_CONTEXT_N`, the share of attack packets whose
    victim fan-in shows ≥ 2 attackers;
  * the median old `ctx_n_src` against the new `lh_fanin_dst`, `lh_peer_max` and `lh_pair_share_min`.
* **(B) Separability ladder.** One binary DoS-vs-DDoS `HistGradientBoostingClassifier` per protocol, trained on four
  feature sets: header only → + 20-packet context (previous design) → + long-horizon features → long-horizon features
  alone. It is scored by balanced accuracy (0.5 = not separable) on **held-out capture sessions** (up to 4 folds; every
  fold holds out DoS and DDoS sessions). The MQTT classes have one training capture each, so they fall back to a
  chronological split inside the capture. The table labels those rows as optimistic.
* **Automatic reading.** Prints attackers per block (DoS vs DDoS), the DDoS burst length against `CONTEXT_N`, and the
  share of DDoS packets that show a second attacker at 20 packets vs at `LONG_CONTEXT_N`. If some DDoS class sees a
  second attacker in fewer than 80 % of its packets within `LONG_CONTEXT_N`, it prints a **NOTE** recommending a larger
  value.
* **Figure** `dos_ddos_diagnosis_history.png`: the share of attack packets whose victim fan-in shows ≥ 2 attackers,
  against history length, for DDoS and DoS captures, one line per protocol.
* Results are cached in `reports/dos_ddos_diagnosis_*.csv` and reloaded when the run hash and diagnosis settings are
  unchanged.

### §6 Feature assembly, sequence windowing and temporal batching

*Notebook: `In [7]`. Previous run: FIT 2,600,269 / VAL 651,009 / TEST 1,299,979 rows; sequence store 57,850,708 × 39 floats = 9.02 GB; assembled in 253 s. New: the store holds 47 values per packet (39 header + 8 long-horizon), about 10.9 GB for the same packets. Stale `seq_store_*.npy` files of an older feature set in `LOCAL_DIR` are deleted automatically, because they are rebuildable caches.*

* **Pass 1** reads five small columns per capture. It works out each packet's role, whether its protocol matches the
  capture's attack, and whether it is eligible as a target. It counts targets per (file, role, label) and builds the
  per-capture **assembly report**.
* **Sampling fractions:**
  * FIT: per class, up to `FIT_ROWS_PER_CLASS`.
  * VAL and TEST: **one fraction for all classes**, so their class proportions are not rebalanced.
* **Pass 2**, per capture and per block:
  * `rt.build_features(block, CONTEXT_N, LONG_CONTEXT_N)` computes 74 features (see [section 5](#5-features-reference)).
  * The 47 per-step features (`rt.SEQ_FEATURES` = 39 per-packet + 8 long-horizon) of every packet are written to a
    **memory-mapped `float32` file** on local disk (`SEQ_STORE`). The store key includes `LONG_CONTEXT_N`.
  * The sampled target packets are kept in RAM as tabular rows.
* **Roles** (`assign_roles`):

  | Role | Packets |
  |---|---|
  | FIT | first 80 % of each training capture, by packet index |
  | gap | the next 1 % (at least `HISTORY_N + 1` = 1,025 packets, at most 5,000), never used |
  | VAL | the rest of each training capture |
  | TEST | all packets of test captures |
* **Eligible target:**
  * position in its block ≥ `HISTORY_N = max(CONTEXT_N, LONG_CONTEXT_N)` = 1,024, so both the 20-packet window and the
    1,024-packet history lie inside the block. This makes the training features identical to the live ones, and excludes
    about 5 % of each block (the old rule excluded 0.1 %). The assembly report's `warmup_excluded` column counts these;
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

*Notebook: `In [8]`. Previous run: 61 of 66 features kept. Dropped as constant on FIT: `ip_mf`, `ip_frag`, `tcp_urg`, `malformed`. Dropped as a duplicate: `tcp_cwr` (identical to `tcp_ece`). The new run starts from 74; expect about 69 kept, unless a long-horizon column is also constant or duplicated on FIT, which §7 prints.*

* Drops features that are constant on FIT, or exact copies of another feature on FIT. Both decisions use FIT only.
* `PREP` is a `ColumnTransformer` with a median imputer, fitted on FIT. It is saved inside every tabular model pipeline.
* Scaling is applied only where needed:
  * Logistic regression gets `arcsinh` followed by `StandardScaler`, inside its own pipeline.
  * The neural networks get `arcsinh` followed by standardisation with FIT statistics, stored inside the network (§13).
  * Tree models need no scaling.

### §8 Labels and collapse matrices

*Notebook: `In [9]`. The three collapse matrices are printed there.*

* `y` is the class index in `LABEL_RULES` order.
* `EVAL_LEVELS` holds the 0/1 matrices M₁₃→₇, M₁₃→₄ and M₁₃→₂; `P_coarse = P_variant @ M`. They are displayed in the
  notebook and saved to `label_mapping.json`.
* `PARTS["fit" | "val" | "test"]` holds `X`, `y`, `w` (all 1) and `meta`. The meta columns are file, capture, packet
  index, timestamp and the row in the sequence store.

### §9 Leakage-safe splitting and data audit

*Notebook: `In [10]`. Previous run: both leakage assertions passed (minimum gap 5,000 packets, the cap); label-conflict floor at variant level 0.0063 (FIT) and 0.0051 (TEST); 8.0 % of TEST feature vectors also occur in FIT.*

* **Assertions:**
  * no test file appears in FIT or VAL;
  * in every training capture, FIT packets come before VAL packets with a gap of at least `HISTORY_N` (1,024), so no VAL
    packet's short **or long** history contains a FIT packet. Previous run: minimum gap 5,000 packets, which also
    satisfies the new rule.
* **Reports:**
  * a split table per class;
  * the per-capture assembly report (packets dropped as background, warm-up and gap, plus TCP/UDP/ICMP/non-IP shares);
  * a class distribution plot;
  * **shortcut evidence**: each capture occupies its own time range, so the timestamp alone identifies the capture;
  * **label conflicts**: identical feature vectors with different labels. Their share is a floor on any per-packet
    model's error;
  * the share of TEST feature vectors that also occur in FIT.

### §10 Training framework and baselines

*Notebook: `In [11]`. Previous run: tuning set of 520,000 packets; AdaBoost ran `SAMME` (scikit-learn 1.6.1); VAL macro-F1 Dummy 0.0033, Logistic Regression 0.8254, Decision Tree 0.8772. The best-trial scores in the trial tables are lower (0.8700 for the Decision Tree) because trials train on the tuning set, while the final fit uses all FIT rows.*

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
* **New: `dos_ddos_swap_rate`.** The share of true DoS/DDoS packets predicted as the *other scale of the same protocol*.
  It is computed whenever the label set contains DoS/DDoS pairs (variant and family level).
  * `dos_ddos_table(cm, names)` gives the same per pair: `dos_as_ddos`, `ddos_as_dos`, `swap_rate`.
  * Every search trial also records `val_dos_ddos_swap_rate` in `trials.csv`.
* Fits the baselines: Dummy (class prior), Logistic Regression and Decision Tree.

### §11 Random Forest and AdaBoost

*Notebook: `In [12]`. Previous run VAL macro-F1: Random Forest 0.8828, AdaBoost 0.7025.*

Search, then a final fit, for each. AdaBoost boosts depth-1 to depth-3 trees and uses `SAMME` (see
[section 14](#14-known-limitations-and-deviations-from-the-original-spec)).

### §12 XGBoost and LightGBM

*Notebook: `In [13]`. Previous run VAL macro-F1: XGBoost 0.8854 (trained on CUDA, then converted to a CPU pipeline), LightGBM 0.8861.*

* **XGBoost:** `multi:softprob` with `tree_method="hist"` on CUDA when available, early stopping on VAL, then switched to
  CPU for portable inference. Also saved as native `model.json`.
* **LightGBM:** multiclass with early stopping on VAL. Also saved as native `model.txt`.

### §13 Deep sequence models (PyTorch)

*Notebook: `In [14]` writes `iomt_torch_models.py` (one fix: the GradScaler resume fix below); `In [15]` runs the searches and final fits on the GPU with AMP. Previous run VAL macro-F1: BiRNN 0.8977 (the best search trial used a GRU), Transformer 0.8933. Input is now 20 × 47 per window: each step carries its 39 header features and its 8 long-horizon values, so the networks also see the attacker count.*

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
* **GradScaler resume fix (the "scalerfix" revision).** A checkpoint written with AMP off (CPU runtime, or no GPU
  attached) stores an empty scaler state, and an enabled `GradScaler` refuses to load it. `train_sequence_model` now
  restores the weights, optimiser and scheduler anyway and starts a fresh scaler, logging "checkpoint was saved with AMP
  off -> fresh GradScaler". In the current run the Transformer resumed from epoch 3 and finished its 12 epochs (1,866 s).
* Each epoch draws `SEQ_SAMPLES_PER_EPOCH` random FIT windows.
* **`TorchSequencePredictor`** is the portable wrapper. It can be pickled (it saves a CPU state dict plus a spec), runs on
  CPU by default, provides `predict_proba(windows)` and saves to `.pt`.

### §14 Multi-criteria model selection

*Notebook: `In [16]`. Previous run: composite winner Decision Tree, score 0.9193. The full table is in section 18.2.*

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
  accuracy/latency trade-off. See [section 8](#8-model-selection-composite-score-and-manual-override). The table now
  shows `val_dos_ddos_swap_rate` beside VAL macro-F1. It is informative only; it is not part of the composite score.

### §15 Probability calibration

*Notebook: `In [17]`. Previous run: calibrator fitted on 651,009 VAL packets; cross-fitted VAL ECE 0.0317 raw vs 0.0322 calibrated, log-loss 0.4444 → 0.3941.*

* Uses Platt scaling: `CalibratedClassifierCV(method="sigmoid")`, fitted on **VAL only**.
* It works on **any** model's probabilities. `rt.ProbaPassthrough` takes the probability matrix as input and exposes
  log-probabilities as its decision function, and a sigmoid is fitted per class and then renormalised.
* **Honest VAL estimate:** the calibrator is cross-fitted on the two halves of each capture's VAL block and evaluated on
  the other half. A reliability diagram compares raw and cross-fitted probabilities.
* The final calibrator is fitted on all of VAL and saved as `calibrator_sigmoid.joblib`.

### §16 Final evaluation on TEST (run once)

*Notebook: `In [18]`. Previous run: TEST tables at all four levels for every model, plus the calibrated Decision Tree as the headline (section 18.3).*

* Scores **every** model on TEST at all four levels; the headline is the selected, calibrated model.
* **Tables:** all metrics per model and level, including `dos_ddos_swap_rate`, plus per-class reports for the
  selected model. **New:** a per-protocol DoS vs DDoS table for the selected, calibrated model, saved as
  `reports/test_dos_ddos_<model>.csv`.
* **Plots:**
  * the 13×13 row-normalised confusion matrix;
  * 7/4/2-class confusion matrices;
  * per-class precision–recall curves with AP;
  * per-class F1 across models;
  * macro-F1 by level;
  * the TEST reliability diagram (raw vs calibrated).

### §17 Robustness

*Notebook: `In [19]` (gap table, confusions, error floor, permutation importance) and `In [20]` (shortcut ablation, leave-capture-out, DoS↔DDoS before/after). Previous run: top 5 permutation features `ctx_tcp_ratio`, `ctx_len_mean`, `is_icmp`, `ctx_n_src`, `ctx_syn_ratio`; ablation and leave-capture-out used the Decision Tree. If the fix works, expect `lh_*` features near the top of the new importance ranking.*

1. **Gap table:** FIT vs VAL vs TEST macro-F1. FIT→VAL shows how the model holds up on later traffic of the same
   captures; VAL→TEST shows how it transfers to unseen capture sessions.
2. **Error analysis:**
   * the top confusions, now with a `dos_ddos_pair` column and a printed count of how many of the top 10 are DoS↔DDoS
     pairs (previous run: all 10), plus the overall TEST swap rate;
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
   VAL recall. It now runs with the new features automatically, so its DDoS-SYN / DDoS-TCP rows (0.377 / 0.528 in the
   previous run) are a direct test of the fix on unseen sessions.
6. **DoS↔DDoS before / after (new):** the same model and hyper-parameters, retrained on one class-stratified sample
   (`ABLATION_ROWS_PER_CLASS` per class) with three feature sets:
   * (a) header only;
   * (b) + 20-packet context (the previous design);
   * (c) + long-horizon features (deployed).

   Each is scored on VAL and TEST: variant, subtype and family macro-F1 plus the swap rate, overall and per protocol
   pair. Only the feature set differs between (b) and (c), so their difference is the effect of the fix. Saved as
   `dos_ddos_before_after*.csv`, with the figure `dos_ddos_before_after.png` (TEST swap rate per pair, previous vs new).
   It needs `TRAIN_LEVEL = "variant"`.

Parts 4, 5 and 6 use the selected model if it is tabular. Otherwise they use the best-scoring tabular model, because
retraining a neural network several times costs far more and adds little information about the *features*.

### §18 Bundle export and best-model pointer

*Notebook: `In [21]`. Previous run: bundle written to `runs/run_0c8497aa2f/models/`; the best-model pointer was **not** replaced (protocol hash `a94af550bf` differs from the stored `9adf7f6222`). The new protocol hash also includes `long_context_n` and `feature_version`, so the revised run starts its own lineage.*

* Writes `models/detector_bundle.joblib` and the supporting files (see [section 10](#10-deployment-the-bundle-and-the-live-engine)).
* Updates `OUTPUT_DIR/experiment_log.csv`, a project-wide log across runs.
* **Best-model pointer** (`OUTPUT_DIR/best_model/`): replaced only when a run has a higher **VAL macro-F1** under the
  **same protocol**. The protocol is a hash of the data, extraction settings, split, short and long context, feature
  version, label level and off-protocol policy. The same run always updates its own entry. `FORCE_UPDATE_BEST = True`
  overrides this.

### §19 Live PCAP inference engine

*Notebook: `In [22]` writes `iomt_inference.py`; `In [23]` runs the check and the demo. Previous run: 4 demo captures at 1,722–10,099 packets/s end to end (section 18.4, item 8).*

* A `%%writefile` cell writes **`iomt_inference.py`** and copies it next to the bundle. `predict_pcap_stream` now
  builds `StreamFeaturizer(context_n, long_context_n)` from the bundle.
* **New streaming check.** It reads block 0 of a real TEST cache, computes features once as in training and once in
  1,000-packet streaming batches, and **asserts** they are identical, long-horizon columns included.
* Demo: loads the bundle from disk and streams the first `DEMO_PACKETS_PER_FILE` packets of one TEST capture per family.
  **New:** it also streams the DoS twin of every DDoS demo capture, and vice versa, so both scales of a protocol are
  shown. It reports the share of packets predicted as attack, as the true family and as the true variant, end-to-end
  packets/s, and example incidents. The first 1,024 packets of each stream are warm-up, so the true-variant share on
  5,000 packets is slightly below the steady state.

### §20 Final summary

*Notebook: `In [24]`. Prints the full comparison table and the headline block; writes `final_model_comparison.csv`.*

* `FINAL_TABLE` shows **every statistic for every model**, in four groups: selection (VAL), latency, resources, and TEST
  (for reporting only). It is saved as `final_model_comparison.csv`. Both the VAL and the TEST groups now include the
  DoS↔DDoS swap rate.
* Prints instructions for changing the selection by hand, followed by the headline result block. **New lines in the
  headline:** the TEST swap rate of the selected model, the §17 item 6 before → after figures (variant macro-F1 and swap
  rate per feature set), and the §5b mean balanced accuracy per feature set.

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

### 8 long-horizon features (`LONG_FEATURES`, new; over packets *i−1023 … i*, `LONG_CONTEXT_N = 1024`)

Each is counted per endpoint of the current packet, not over the whole stream.

| Feature | Meaning | One attacker (DoS) | k attackers (DDoS) |
|---|---|---|---|
| `lh_n_src` | distinct sources in the whole window | small | larger |
| `lh_fanin_dst` | distinct sources that sent to this packet's destination | 1 | k |
| `lh_fanout_src` | distinct destinations this packet's source sent to | 1 | k for the victim's replies |
| `lh_peer_max` | max(fan-in of dst, fan-out of src): the attacker count whatever the packet direction | 1 | k |
| `lh_pair_share_min` | min(pair packets / dst inbound, pair packets / src outbound) | ≈ 1 | ≈ 1/k |
| `lh_dst_share` | share of the window going to this destination (victim concentration) | high | high |
| `lh_log_dst_rate` | log₁₀ packets/s into this destination over the window | | |
| `lh_log_pair_rate` | log₁₀ packets/s of this (source, destination) pair | | |

*The DoS and DDoS columns show the expected pattern. Benign background hosts can add to the counts.*

* **Why two directions.** An attack packet (attacker → victim) shows the attacker count in the victim's fan-in. A
  victim reply (victim → attacker) shows it in the victim's fan-out. `lh_peer_max` and `lh_pair_share_min` give both
  directions the same value.
* **How it is computed.** `window_group_stats` resolves "distinct values per group over the last H packets" exactly, with
  no Python loop. A row is the first of its (group, value) inside a window exactly when its previous same-key row lies
  outside that window. Each row therefore adds +1 to one contiguous range of its group's rows, which a difference array
  and a cumsum resolve for all rows at once. Cost: about 40 ms per 20k-packet block.
* **Identity-free.** Addresses enter only as 32-bit hashes used for counting. The model learns *how many* hosts hit a
  victim, never *which* hosts.

### Feature sets per model

* **Tabular models** use base + context + long-horizon, i.e. 74 features (previously 66). §7 removes any that are
  constant or duplicated on FIT; the final list is saved in `feature_schema.json`. In the previous run 61 of 66 remained:
  `ip_mf`, `ip_frag`, `tcp_urg` and `malformed` were constant on FIT, and `tcp_cwr` duplicated `tcp_ece`.
* **Sequence models** use a 20 × 47 window (`SEQ_FEATURES` = `BASE_FEATURES` + `LONG_FEATURES`), previously 20 × 39.
* **`ctx_n_src` was the intended DoS-vs-DDoS signal and did not work.** It counts sources in the last 20 packets of the
  whole stream. Attackers send in bursts longer than 20 packets, and the victim's replies count as a second source, so
  it reads about the same for DoS and DDoS. In the previous run it ranked only 4th in permutation importance, and
  DoS↔DDoS confusion was the dominant error (section 18.4, item 2). It is kept, and the long-horizon features now carry
  this signal (section 20).
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
| `CONTEXT_N` | `20` | H | Window length for the short context and the sequence models |
| `LONG_CONTEXT_N` | `1_024` (smoke: `256`) | H | **New.** History for the long-horizon features. Must be < `BLOCK_PACKETS`. Raise it if the §5b NOTE says some DDoS class rarely shows a second attacker within this many packets. Larger values exclude more of each block as warm-up and lengthen the live carry-over |
| `HISTORY_N` | derived: `max(CONTEXT_N, LONG_CONTEXT_N)` | | **New.** Minimum block position of a target; the purge gap is at least `HISTORY_N + 1` |
| `FEATURE_VERSION` | `"v1.1-long-horizon"` | H | **New.** Feature-set label; also in the protocol hash and the bundle |
| `OFF_PROTOCOL_POLICY` | `"drop"` | H | `"drop"`, `"keep_label"` (label every packet by file name) or `"relabel_benign"` |

### Split and row budgets

| Setting | Default | H | Notes |
|---|---|---|---|
| `VAL_FRACTION` | `0.20` | H | Tail of each training capture |
| `GAP_FRACTION`, `GAP_MIN_ROWS`, `GAP_MAX_ROWS` | `0.01`, `50`, `5_000` | H | The gap is also forced to at least `HISTORY_N + 1` (1,025) |
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
| `RUN_DOS_DDOS_ABLATION` | `True` | **New.** §17 item 6, DoS↔DDoS before/after |
| `RUN_DOS_DDOS_DIAGNOSIS` | `True` | **New.** §5b analysis (the helper definitions in that cell always run) |
| `DIAG_BLOCKS_PER_CAPTURE`, `DIAG_ROWS_PER_BLOCK` | `6`, `1_000` (smoke `2`, `300`) | **New.** §5b sample size per training capture |
| `DIAG_WINDOWS` | `[20, 64, 256, 1_024, 4_096]` | **New.** History lengths compared in §5b (values ≥ `BLOCK_PACKETS` are dropped) |
| `PERMUTATION_ROWS` | `20_000` | |
| `DEMO_PACKETS_PER_FILE` | `5_000` | §19 demo length |
| `SEVERITY_THRESHOLDS` | `{"high": 0.90, "medium": 0.60}` | Applied to calibrated confidence; stored in the bundle |
| `FORCE_UPDATE_BEST` | `False` | Set in the §18 cell (`In [21]`), not in §3. `True` replaces `best_model/` even when the evaluation protocol differs |

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
* **What the score did in the recorded run (`In [16]`, `In [24]`).** The Decision Tree won with 0.9193, ahead of Logistic
  Regression (0.8858) and XGBoost (0.8106). Its F1 term (0.526) is about the same as every good model's (0.53–0.54), but its
  latency and memory terms are close to the maximum of 0.2 each, because the maxima are set by LightGBM (265 ms per
  1,000-packet batch) and Random Forest (1,151 MB). One point of VAL macro-F1 is worth 0.006 of composite score, while the
  cost terms spread over 0.2. With 0.6/0.2/0.2 and models this close in accuracy, cost decides the ranking. The BiRNN has
  the best VAL macro-F1 (0.8977) and the best VAL worst-class recall (0.743) but ranks 5th. If the team values
  variant-level accuracy over cost, choose from the VAL columns and set `MANUAL_SELECTION` as described above. Section 18.2
  has the full table.

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
    ├── figures/                             every plot (PNG), incl. dos_ddos_diagnosis_history.png and
    │                                        dos_ddos_before_after.png (new)
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
    │   ├── dos_ddos_diagnosis_attackers.csv      §5b (A): attackers, bursts, fan-in vs history, per block   (new)
    │   ├── dos_ddos_diagnosis_separability.csv   §5b (B): separability ladder per pair and feature set      (new)
    │   ├── dos_ddos_before_after.csv             §17 item 6: macro-F1 and swap rate per feature set          (new)
    │   ├── dos_ddos_before_after_pairs.csv       §17 item 6: per-pair swap rates                             (new)
    │   ├── test_dos_ddos_<model>.csv             §16: per-pair DoS/DDoS table, selected calibrated model     (new)
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

LOCAL_DIR/seq_store_<key>.npy (+ .complete)   memory-mapped per-step features (47 per packet), ~10.9 GB (9.02 GB with
                                              the previous 39), rebuilt if missing; stale stores are deleted
```

---

## 10. Deployment: the bundle and the live engine

### What is in `detector_bundle.joblib`

| Key | Content |
|---|---|
| `predictor` | Tabular: a `Pipeline(prep → classifier)` that takes a DataFrame with the feature columns. Sequence: a `TorchSequencePredictor` that takes `(n, 20, 47)` windows. |
| `model_kind`, `model_name` | `"tabular"` or `"sequence"`; the model's name |
| `calibrator` | The Platt calibrator; takes a probability matrix and returns calibrated probabilities |
| `classes`, `train_level`, `eval_levels`, `hierarchy` | Label space and collapse matrices |
| `features`, `tab_features_all`, `seq_features`, `context_n`, `extract_config`, `runtime_version` | Feature schema |
| `long_context_n`, `history_n`, `long_features`, `feature_version` | **New.** Long-horizon settings; the live engine reads `long_context_n` from here |
| `selection` | Mode (composite or manual), the composite winner, weights, metrics, and the full selection table |
| `benchmarks`, `hardware`, `val_metrics`, `test_metrics`, `test_metrics_uncalibrated` | Evidence |
| `top_features`, `params`, `adaboost_algorithm`, `severity_thresholds`, `off_protocol_policy`, `excluded_shortcuts` | |
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

The steps inside are: read packets → decode with dpkt → build causal features, carrying the last
`max(context_n, long_context_n)` = 1,024 packets between batches (`StreamFeaturizer`) → model → calibrator →
probabilities at 4 levels → incident. A bundle without `long_context_n`, from before the revision, falls back to
`rt.DEFAULT_LONG_CONTEXT_N`. Old bundles should be run with the `iomt_runtime.py` saved next to them.

### Incident schema

```json
{
  "timestamp": "2023-08-29T20:27:55.832Z",
  "src_ip": "192.168.137.180",
  "dst_ip": "192.168.137.250",
  "attack_variant": "MQTT-DDoS-Connect",
  "attack_subtype": "MQTT-Connect",
  "attack_family": "MQTT-Flood",
  "attack_binary": "Attack",
  "confidence": 0.7718,
  "top3_predictions": [["MQTT-DDoS-Connect", 0.7718], ["MQTT-DoS-Connect", 0.2282], ["DoS-SYN", 0.0]],
  "initial_severity": "medium",
  "inference_latency_ms": 0.0062,
  "model_version": "run_0c8497aa2f",
  "packet_index": 2510,
  "context_warmup": false
}
```

*(Real example from the previous run's §19 demo, its `In [22]`: the first 5,000 packets of `MQTT-DDoS-Connect_Flood_test.pcap`. The runner-up is the DoS twin of the same attack, which was the typical shape of the variant-level uncertainty before the fix. The schema is unchanged in the revision.)*

* `confidence` is the calibrated probability of the top variant.
* `initial_severity` is `none` for Benign. For attacks it is `high` at confidence ≥ 0.90, `medium` at ≥ 0.60, otherwise
  `low`. The Controller is expected to combine it with device criticality.
* `inference_latency_ms` is the model and calibration time per packet within its batch, **excluding parsing**.
* `packet_index` and `context_warmup` are additions to the original spec. `context_warmup: true` now marks the first
  **1,024** packets of a stream (previously 20), whose short or long history is incomplete. Their DoS/DDoS label is
  less reliable; the attack/benign and protocol decisions are not affected by the long history.
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
| Ablation / leave-capture-out / DoS↔DDoS before-after | `reports/*.csv` | Same model key (and sample size) |
| §5b diagnosis | `reports/dos_ddos_diagnosis_*.csv` | Same `CONFIG_HASH`, diagnosis settings and runtime version |

* **The previous notebook's saved outputs come from a resumed run.** In `In [5]` every capture shows the status "cache", in `In [11]`–`In [15]` every search trial shows "already done - skipped", and models print "reloaded checkpoint". The figures in those cells are valid results, but the extraction times printed there come from the cache metadata, not from a fresh pass.
* **Run folder:** `CONFIG_HASH` is a hash of all hashed settings plus the sorted data fingerprints. Changing a hashed
  setting or the data starts a new folder, so old checkpoints are never mixed with new ones. The revision adds
  `long_context_n` and `feature_version` to the hashed settings, so its first run gets a new folder and leaves
  `run_0c8497aa2f` untouched for comparison.
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
  sequence windows stay on disk (memory-mapped) and only one batch is read at a time. Previous run: FIT 655 MB + VAL
  164 MB + TEST 327 MB of matrices (`In [7]`). With 74 columns instead of 66, expect about 12 % more (roughly 735 + 185 +
  365 MB for the same row counts); process RAM 3.6 GB after preprocessing (`In [8]`) and 8.0 GB after the sequence models
  (`In [15]`), against the 12.7 GB ceiling. Peak RAM during final fits was highest for the BiRNN (8.1 GB) and the
  Transformer (7.8 GB).
* **Explicit cleanup:** `gc.collect()` and `torch.cuda.empty_cache()` run after each capture, trial, refit, epoch and
  TEST pass. Large intermediate arrays are deleted as soon as they are used.
* **`mem_guard` before every heavy step:** it stops with an actionable message instead of letting Colab crash. If it
  triggers, lower the row budgets in §3 and re-run; caches make that cheap.
* **Model size:** Random Forest depth and leaf limits keep model size bounded (see [section 14](#14-known-limitations-and-deviations-from-the-original-spec)).
* **Disk needed:**
  * Drive: about 20 MB of Parquet per 1M extracted packets on the synthetic data (zstd-compressed). Real traffic is
    more varied, so allow 20–60 MB per capture and check the first few.
  * Local: about 10.9 GB for the sequence store in the new run (57,850,708 packets × 47 float32 values; 9.02 GB with the
    previous 39). §6 checks free space first and deletes stale stores of an older feature set.

---

## 13. How it was tested

Testing happened in four stages: synthetic QA while building (stage 1), the recorded run of the previous notebook on
the real captures (stage 2, section 18), synthetic verification of the DoS vs DDoS revision (stage 3), and the real-data
run of the revised notebook (stage 4, section 21).

### Stage 1: synthetic QA

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

Synthetic scores (≈0.999 macro-F1) said **nothing** about real performance, and the real run confirmed it: the same
pipeline reached 0.764 variant-level TEST macro-F1 on the real captures.

### Stage 2: the recorded real-data run

The notebook's saved outputs are the record (section 18). They exercise what stage 1 could not: the real data at full-size
budgets, all 60 captures, and the GPU paths (XGBoost on CUDA, AMP training, NVML VRAM readings: 1,022 MB peak for XGBoost,
448–516 MB for the two networks).

### Stage 3: verification of the DoS vs DDoS revision (synthetic)

These tests were run in a separate environment. The test scripts are not part of the deliverable.

* **Exactness.** `long_horizon_features` matched a brute-force Python loop on 30 random cases with varying lengths and
  history sizes, for all 8 columns.
* **Consistency with the old feature.** With `n_long = 20`, `lh_n_src` reproduces `ctx_n_src` exactly.
* **Streaming equals training.** `StreamFeaturizer` in 1,000-packet batches equals one-block features for all 74
  columns with `n_long` = 64, 1,024 and 3,000. The warm-up count equals the history length.
* **Speed.** About 42 ms for `build_features` on a 20k-packet block.
* **Mechanism.** On synthetic DoS (1 attacker) vs DDoS (4 attackers in bursts of 60) with identical headers, scored by
  balanced accuracy on unseen captures:

  | Feature set | Balanced accuracy |
  |---|---|
  | header only | 0.502 |
  | + 20-packet context | 0.614 |
  | + long-horizon | 1.000 |

  Median `ctx_n_src` was 2 for both classes, while median `lh_peer_max` was 1 vs 4.
* **End-to-end smoke run.** The revised notebook ran with `IOMT_SMOKE=1` on 42 synthetic captures (all 13 classes, 3
  training sessions per TCP/IP class) with no errors: all 24 code cells, all 9 models including the BiRNN and the
  Transformer, benchmarks, calibration, bundle, live engine, and the real-cache streaming assertion.
  * §5b ladder: header only 0.49–0.55, 20-packet context 0.54–0.65, long-horizon 0.97–1.00.
  * §17 item 6, TEST swap rate: (a) 0.472 → (b) 0.370 → (c) 0.004.

  These are synthetic numbers that confirm the code path. They say nothing about real performance; stage 1's ≈ 0.999
  did not predict the real 0.764 either.
* **Format.** The notebook passes `nbformat` validation, and every cell has an id.

### Stage 4: the recorded real-data run of the revised notebook

`run_c53a51becb` ran all 24 code cells on the 60 real captures with no errors. It exercised what stage 3 could not: §5b
on the real training captures, the §19 streaming assertion on a real TEST cache ("Streaming check passed on
Benign_test.pcap block 0 … 74 features incl. 8 long-horizon"), and the GradScaler resume path (the Transformer resumed
from epoch 3). Like the previous run, it reloaded the Parquet caches and finished search trials, so its extraction
and search times come from the cache metadata. Results are in section 21.

**Still not done:**

* the standalone CLI (`iomt_inference.py`) on a real capture in a separate process. The §19 demo loads the bundle from
  disk but runs inside the notebook runtime;
* latency and memory on the real edge gateway (every number is from the Colab CPU);
* any evaluation on traffic from outside CICIoMT2024.

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
6. **The short context is global, not per flow.** The 20-packet window is "the last 20 packets on the link". The
   revision's long-horizon features *are* per endpoint (per destination, per source, per pair), but their window is
   still the last 1,024 packets on the link. On a busy real network with much unrelated traffic, 1,024 packets may cover
   too little time to see every attacker; a time-based or per-victim window is a possible extension (section 16).
7. **Background packets are scored at deployment, but were never training targets.** At inference, a benign web packet
   in the middle of a flood sees flood context and may be flagged as attack. This is arguably correct (the link *is*
   under attack), but is worth explaining in the report.
8. **Neural networks are benchmarked on CPU for the score.** GPU latency and VRAM are recorded separately. If the target
   gateway has a GPU or NPU, re-weight or re-benchmark.
9. **Shortcut ablation and leave-capture-out use a tabular model** when the selected model is a neural network.
10. **pcapng files are read sequentially** (no seeking), so they are slower to extract than classic pcap.
11. **MQTT type is read from the first payload byte of each TCP segment.** Segments carrying several MQTT messages, or
    continuation data, are only approximated.
12. **DoS vs DDoS: diagnosed, fixed, and confirmed on the real data for four of six protocol pairs.** In the previous
    run, variant-level TEST macro-F1 was 0.764 against 0.994 at subtype level, and the ten most frequent confusions were
    all DoS↔DDoS pairs of the same protocol (section 18.4, item 2). In the current run it is 0.858, and 7 of the top 10
    confusions are still DoS↔DDoS pairs.
    * **Diagnosis:** §5b; the cause is in section 20.1.
    * **Fix:** the long-horizon features.
    * **Verification:** synthetic (section 13, stage 3) and real (section 21).
    * **Still failing on TEST:** DoS-ICMP → DDoS-ICMP (56.4 % of DoS-ICMP) and MQTT-DDoS-Publish → MQTT-DoS-Publish
      (87.9 % of MQTT-DDoS-Publish). On the same sample, the MQTT-Publish swap rate *rose* with the new features (0.303 →
      0.438). See section 21.4.
    * **Remaining limits of the fix:**
      * the decision is still made per packet, so the first ~1,024 packets of a stream or a new attack, and an attacker
        that pauses, can get the wrong scale;
      * the attacker count reflects how many attacking hosts the lab used; a botnet of a different size, or many benign
        hosts talking to the victim, should be re-validated;
      * an attack that spoofs a fresh source address per packet would show a huge fan-in for DoS too (not the case in
        CICIoMT2024, whose attackers use their real addresses);
      * the §5b ladder for MQTT uses a chronological split inside a single capture, which is optimistic.
13. **The selected model is not the most accurate one.** The composite score picked the cheapest model. In the current
    run, Random Forest, XGBoost, LightGBM, BiRNN and Transformer have a higher VAL macro-F1 (by at most 0.0025), and
    Logistic Regression has the best TEST variant macro-F1 (0.8908) despite a lower VAL score (section 21.2).
14. **The shortcut ablation only partly shows the expected collapse on TEST.** In the previous run timestamp and packet
    number alone beat the clean features on TEST (section 18.4, item 4). In the current run the clean features win at the
    variant level (0.8831 vs 0.8562), but the shortcut columns still score 1.000 at the binary level on TEST.
15. **AdaBoost is unusable at the coarse levels.** In the current run its VAL macro-F1 is 0.9652 and its TEST variant
    macro-F1 0.8886, but at the subtype, family and binary levels it flags every benign packet as an attack (benign
    false-alarm rate 1.0; binary macro-F1 0.4928, the same as the Dummy) and its log-loss is 2.55, near the Dummy's 2.57.
    The likely reason, not tested, is that its `SAMME` probabilities are nearly flat, so summing them per group lets the
    largest group win. Do not present it as a fair representative of boosting, and never use it for coarse-level output.
16. **Variant-level confidence is only moderately calibrated, and calibration did not help on TEST.** Current run: TEST
    variant ECE 0.0722 raw → 0.0812 calibrated, and macro-F1 0.8835 → 0.8584 (previous run: ECE 0.098 → 0.066). At
    subtype and binary level ECE is 0.0025 and 0.0011, so the Controller can trust confidence for attack/benign and
    protocol decisions far more than for the DoS/DDoS split.
17. **Benign is thin.** There is one benign training capture and one benign test capture, and benign is 2.8 % of TEST rows
    (36,960 of 1,299,644 in the current run). Benign precision is 0.952 because attack packets are predicted as benign:
    38,770 packets were predicted benign against 36,960 true (section 21.3).
18. **More warm-up per block (revision).** A target needs 1,024 packets of history inside its 20k-packet block, so about
    5 % of each block is never a target (previously 0.1 %). Sampling fractions in §6 adjust automatically. Small test
    captures lose proportionally the same share.
19. **New models are not comparable with old checkpoints.** The revision changes the feature set, `RUNTIME_VERSION`
    (1.1.0) and the sequence input shape (47 per step). Old bundles must be run with the `iomt_runtime.py` saved beside
    them, and the old and new runs have different protocol hashes.

---

## 15. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `FileNotFoundError: DATA_DIR does not exist` | Wrong path | Copy the folder path from the Colab Files pane into `DATA_DIR` |
| `RuntimeError: These classes lack a train or test capture` | A file is missing or misnamed | Add it, check its name against the label regexes in §4, or set `ALLOW_MISSING_CLASSES = True` |
| A file listed as "rejected: cannot infer train/test split" | No `_train`/`_test` suffix and no `train`/`test` folder | Rename it or move it into a `train`/`test` folder |
| `MemoryError: … needs ~X MB` from `mem_guard` | Row budgets too large for this runtime | Lower `FIT_ROWS_PER_CLASS`, `VAL_MAX_ROWS` or `TEST_MAX_ROWS`; re-run (caches are reused) |
| `OSError: Not enough local disk for the sequence store` | Local disk full (the store is now ~10.9 GB) | Lower `PACKETS_PER_CAPTURE`, remove `birnn`/`transformer` from `MODELS_TO_RUN`, or point `IOMT_LOCAL_DIR` elsewhere. Stale stores of an older feature set are already deleted automatically |
| `AssertionError: LONG_CONTEXT_N must be smaller than BLOCK_PACKETS` (§3) | `LONG_CONTEXT_N` ≥ 20,000, or ≥ 2,000 in a custom smoke setup | Lower `LONG_CONTEXT_N` or raise `BLOCK_PACKETS` (which re-extracts) |
| `AssertionError: a VAL packet's history could reach a FIT packet` (§9) | The purge gap of a small capture is shorter than `HISTORY_N` | Lower `LONG_CONTEXT_N`, or raise `GAP_MAX_ROWS` / `GAP_FRACTION` |
| `AssertionError: streamed features differ from training features` (§19) | `iomt_runtime.py` was edited without re-running §5, or `StreamFeaturizer` and `build_features` disagree | Re-run from §5; if you changed a feature, check that `StreamFeaturizer.history` covers its window |
| §5b prints "NOTE: … fewer than 80 % of attack packets see a second attacker within N packets" | Bursts or attack pauses are longer than `LONG_CONTEXT_N` for those classes | Raise `LONG_CONTEXT_N` (e.g. 2,048 or 4,096) in §3 and re-run; it is hashed, so a new run folder starts |
| `NameError: protocol_match` / `SUBTYPE_OF` / `dos_ddos_partner` | The §5b cell (`In [6]`) was skipped | Run it; its definitions are needed from §6 onward even with `RUN_DOS_DDOS_DIAGNOSIS = False` |
| "DoS/DDoS before-after needs TRAIN_LEVEL='variant'" (§17) | Training at subtype or family level | Expected: those levels do not separate DoS from DDoS |
| `MANUAL_SELECTION='x' is not a trained model` | Typo, or the model was skipped | Use one of the names printed in the error |
| `benchmark failed for …` | The subprocess could not import the modules or load the model | Check that `iomt_runtime.py` / `iomt_torch_models.py` exist in the notebook's working folder; read the stderr shown |
| "Global best kept: different evaluation protocol" | This run's data or settings differ from the best run's | Expected; set `FORCE_UPDATE_BEST = True` to replace it deliberately |
| "Note: bundle saved with scikit-learn X, running Y" | Version mismatch at load time | Install version X, or use the native `.json`/`.txt` booster |
| Extraction is very slow | Drive I/O | Copy the PCAPs to local disk and point `DATA_DIR` there |
| You changed a setting and everything retrains | It is a hashed setting | Expected: it starts a new run folder. Selection settings are not hashed |
| `UserWarning: X does not have valid feature names, but LGBMClassifier was fitted with feature names` in §16 | By the message, LightGBM was fitted on a DataFrame and scored on a NumPy array | Seen once in the recorded `In [18]`; LightGBM's scores there are in line with the other models (section 18.2). Not investigated further |
| The first cells after a reconnect take minutes | The ~11 GB sequence store is on local disk and is wiped on disconnect | Expected: it is rebuilt from the Drive caches (feature assembly took 253 s in the previous run). The Parquet caches are not re-extracted |

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
  1. Edit `build_features` in `iomt_runtime.py` and add the name to `BASE_FEATURES`, `CONTEXT_FEATURES` or
     `LONG_FEATURES`. A new long-horizon column goes into `long_horizon_features`; `window_group_stats(group, value, H)`
     gives exact per-group counts and distinct counts over the last H packets.
  2. Bump `RUNTIME_VERSION`.
  3. If you also change decoding (`decode_records` / `RAW_SPEC`), bump `PARSE_VERSION`, which invalidates the Parquet
     caches.

  Feature-only changes reuse the caches, because features are recomputed from raw fields each run.
* **Add an attack class:** add a rule to `LABEL_RULES` (§4) with its subtype and family, and a protocol rule in
  `protocol_match` (§6).
* **Different context length:** change `CONTEXT_N` or `LONG_CONTEXT_N`. Extraction caches are reused; features and the
  sequence store are rebuilt. Keep `LONG_CONTEXT_N` < `BLOCK_PACKETS`. `StreamFeaturizer` follows automatically,
  because it carries `max(CONTEXT_N, LONG_CONTEXT_N)` packets.
* **Per-flow context:** the long-horizon features are already per endpoint. Making the short context per flow means
  computing it per flow key instead of per block, and mirroring the change in `StreamFeaturizer`.
* **Time-based windows:** replace the packet-count window with "the last T seconds, capped at H packets". The interval
  trick in `window_group_stats` still applies, with `np.searchsorted` on the timestamps for the window edges.
* **Window-level DoS/DDoS decision:** for an incident-level answer, vote over a time window, for example the majority
  variant among the attack packets to one victim in the last second. This is an inference-time layer in
  `iomt_inference.py`; it needs no retraining.

---

## 17. Glossary

| Term | Meaning |
|---|---|
| **FIT / gap / VAL / TEST** | Training data / purged buffer / validation (tail of training captures) / held-out test captures |
| **Capture** | One PCAP file. Numbered files (`…ICMP1`, `…ICMP2`) are separate sessions of the same class |
| **Block** | 20,000 contiguous packets read from one position in a capture |
| **Context window** | The current packet plus the previous 19 in the same block or stream |
| **Warm-up** | Packets whose short or long history is incomplete (the first `HISTORY_N` = 1,024 packets of a block or stream); never training targets |
| **Long-horizon features** | The 8 `lh_*` columns: attacker counts and shares per endpoint over the last `LONG_CONTEXT_N` packets |
| **Fan-in / fan-out** | Number of distinct hosts sending to a destination / that a source sends to, within the window |
| **Burst** | A run of consecutive packets from the same source towards the victim; DDoS attackers send in bursts |
| **DoS↔DDoS swap rate** | Share of true DoS/DDoS packets predicted as the other scale of the same protocol |
| **Separability ladder** | §5b's binary DoS-vs-DDoS models with growing feature sets, scored on unseen capture sessions |
| **`HISTORY_N`** | `max(CONTEXT_N, LONG_CONTEXT_N)`: a target's minimum block position, and the purge gap's minimum minus one |
| **Off-protocol packet** | A packet in an attack capture whose protocol cannot belong to that attack (background traffic) |
| **Collapse matrix** | A 0/1 matrix mapping 13-class probabilities to 7, 4 or 2 classes |
| **Composite score** | 0.6·F1 + 0.2·latency term + 0.2·memory term, relative to the other models in the run |
| **Label-conflict floor** | The minimum error any per-packet model must make, because identical feature vectors carry different labels |
| **Shortcut** | A column that identifies the capture rather than the attack (timestamp, packet number, addresses) |
| **ECE** | Expected calibration error: the gap between confidence and accuracy, averaged over confidence bins |
| **CONFIG_HASH** | A hash of result-affecting settings plus the data fingerprints; names the run folder |
| **Protocol hash** | A hash of the data and evaluation protocol; guards the best-model pointer |

---

## 18. Recorded run: results and findings

**This section is the previous, pre-fix run.** Everything here is read from the saved outputs of
`FYP_IoMT_PCAP_Detector_fixed.ipynb` (run `0c8497aa2f`). The `In [k]` references in this section use **that notebook's
numbering**: from §6 onward they are one lower than in the revised notebook. Nothing here was re-computed outside the
notebook, apart from simple differences and sums of printed values. It is kept unchanged as the baseline for the DoS vs
DDoS revision (section 20.6).

### 18.1 Run facts and data

| Item | Value | Notebook |
|---|---|---|
| Run identifiers | `SETTINGS_HASH` e8f2d1e883, `CONFIG_HASH` 0c8497aa2f, protocol hash a94af550bf | `In [2]`, `In [3]`, `In [20]` |
| Hardware | Tesla T4 (15.6 GB VRAM), 2 CPU cores, 13.6 GB RAM | `In [1]` |
| Libraries | scikit-learn 1.6.1, XGBoost 3.4.1, LightGBM 4.6.0, PyTorch 2.11.0+cu130, dpkt 1.9.8, pandas 2.2.3, numpy 2.4.6 | `In [1]` |
| Captures | 60 found (45 train, 15 test); none excluded | `In [3]` |
| Packets | 840,830,708 in the captures; 57,850,708 extracted (6.9 %) | `In [5]` |
| Rows | FIT 2,600,269; VAL 651,009; TEST 1,299,979 | `In [6]` |
| Sampling fractions | VAL 0.0763, TEST 0.0982 (one fraction for every class) | `In [6]` |
| Features | 66 built, 61 kept (4 constant, 1 duplicate dropped) | `In [7]` |

Captures and rows per class (`In [3]`, `In [9]`):

| Class | Train / test captures | FIT rows | VAL rows | TEST rows |
|---|---|---|---|---|
| Benign | 1 / 1 | 199,913 | 14,833 | 36,983 |
| DoS-SYN | 4 / 1 | 199,865 | 58,777 | 97,819 |
| DoS-TCP | 4 / 1 | 200,024 | 58,145 | 96,520 |
| DoS-UDP | 4 / 1 | 199,978 | 57,347 | 95,941 |
| DoS-ICMP | 4 / 1 | 199,729 | 57,103 | 96,809 |
| DDoS-SYN | 4 / 1 | 200,393 | 59,866 | 96,885 |
| DDoS-TCP | 4 / 1 | 198,964 | 58,168 | 97,388 |
| DDoS-UDP | 8 / 2 | 200,126 | 113,155 | 194,663 |
| DDoS-ICMP | 8 / 2 | 200,176 | 114,808 | 192,793 |
| MQTT-DoS-Connect | 1 / 1 | 200,352 | 14,630 | 30,652 |
| MQTT-DoS-Publish | 1 / 1 | 200,434 | 14,432 | 83,839 |
| MQTT-DDoS-Connect | 1 / 1 | 200,296 | 14,870 | 97,339 |
| MQTT-DDoS-Publish | 1 / 1 | 200,019 | 14,875 | 82,348 |

FIT is capped at about 200,000 rows per class; VAL and TEST keep the class proportions of the extracted packets, which is
why DDoS-UDP and DDoS-ICMP (eight and two captures) are about twice as large there. Background packets dropped from attack
captures were 0 % of Benign captures and up to 4.7 % of an attack capture's extracted packets (TCP_IP-DoS-UDP4_train,
46,019 packets); every other capture is below 1.7 % (`In [9]`). The full per-capture table is saved as
`reports/assembly_report.csv`.

### 18.2 Model comparison

Variant level, 13 classes. VAL and cost columns are what selection used; TEST columns are for reporting only (`In [23]`).
Cost is measured on the Colab CPU. TEST figures here are **uncalibrated**, so every model is compared on the same footing.

| Model | VAL macro-F1 | TEST macro-F1 (variant) | TEST macro-F1 (subtype) | TEST macro-F1 (binary) | 1k-batch p95 (ms) | RAM (MB) | Composite (rank) |
|---|---|---|---|---|---|---|---|
| decision_tree | 0.8772 | 0.7806 | 0.9944 | 0.9874 | 3.8 | 24 | 0.9193 (1) |
| logreg | 0.8254 | 0.6944 | 0.9932 | 0.9840 | 6.2 | 28 | 0.8858 (2) |
| xgboost | 0.8854 | 0.7832 | 0.9958 | 0.9888 | 117.0 | 186 | 0.8106 (3) |
| adaboost | 0.7025 | 0.6217 | 0.8386 | 0.4928 | 44.7 | 22 | 0.7841 (4) |
| birnn | 0.8977 | 0.7930 | 0.9955 | 0.9879 | 169.8 | 280 | 0.7617 (5) |
| lightgbm | 0.8861 | 0.7871 | 0.9958 | 0.9886 | 265.0 | 113 | 0.7120 (6) |
| transformer | 0.8933 | 0.7901 | 0.9953 | 0.9878 | 238.0 | 360 | 0.6938 (7) |
| random_forest | 0.8828 | 0.7794 | 0.9950 | 0.9868 | 59.0 | 1,151 | 0.6852 (8) |
| dummy (prior) | 0.0033 | 0.0093 | 0.0256 | 0.4928 | 4.9 | 16 | not ranked |

Throughput on CPU, from the same benchmark: Decision Tree 866,808 packets/s, Logistic Regression 338,182, Random Forest
50,332, XGBoost 7,460, BiRNN 6,038, LightGBM 5,142, Transformer 3,915 (`In [23]`). Disk size ranges from 0.01 MB (Logistic
Regression) to 82.7 MB (Random Forest); the Decision Tree is 1.3 MB.

### 18.3 Headline result (selected model: Decision Tree, calibrated)

TEST, one pass, `In [17]` and the headline block of `In [23]`:

| Level | Macro-F1 | Accuracy | Worst-class recall | Log-loss | ECE raw → calibrated |
|---|---|---|---|---|---|
| Variant (13) | 0.7643 | 0.7805 | 0.285 (MQTT-DDoS-Publish) | 1.0116 | 0.0984 → 0.0664 |
| Subtype (7) | 0.9936 | 0.9972 | 0.992 (MQTT-Connect) | 0.0197 | 0.0011 → 0.0015 |
| Family (4) | 0.8725 | 0.8322 | 0.645 (DoS) | 0.3630 | 0.0558 → 0.0281 |
| Binary (2) | 0.9853 | 0.9983 | 0.994 (Benign) | 0.0076 | 0.0011 → 0.0009 |

Benign false-alarm rate 0.0019; attacks missed as benign 0.0018; variant-level label-conflict floor 0.0051.

At the variant level, the weakest classes are DoS-ICMP (recall 0.302, F1 0.421) and MQTT-DDoS-Publish (recall 0.285, F1 0.439);
MQTT-DoS-Publish has the lowest precision (0.587). The strongest are Benign (F1 0.969), MQTT-DDoS-Connect (0.957),
DDoS-UDP (0.886) and MQTT-DoS-Connect (0.882). At subtype level every class has F1 ≥ 0.994 except Benign (0.971, precision
0.945), and at binary level Attack has precision 0.9998 and recall 0.9985.

### 18.4 Findings

1. **Attack vs benign and attack protocol are solved.** Every model except AdaBoost and the Dummy reaches at least 0.984
   binary and 0.993 subtype TEST macro-F1 (`In [17]`). The remaining subtype-level error is small (0.0028 against a floor of 0).
2. **DoS vs DDoS is the unsolved part.** At variant level the TEST error is 0.2195 against a conflict floor of 0.0051
   (`In [18]`), so almost all of it is avoidable in principle. The ten most frequent confusions are all DoS↔DDoS pairs of
   the same protocol, for example DoS-ICMP→DDoS-ICMP (67,598 packets, 70 % of DoS-ICMP), MQTT-DDoS-Publish→MQTT-DoS-Publish
   (58,516 packets, 71 %), DoS-TCP→DDoS-TCP (33 %) and DoS-SYN→DDoS-SYN (30 %). `ctx_n_src` is only 4th in permutation
   importance, after `ctx_tcp_ratio`, `ctx_len_mean` and `is_icmp`. *Why it did not separate the two was not diagnosed
   in that notebook.* **Update:** the revised notebook diagnoses it (§5b) and implements the per-destination,
   longer-horizon option: the window covers more packets and counts sources per victim (section 20). The time-window
   vote remains an untested option (section 16).
3. **VAL overstates TEST by about 0.1 macro-F1 for every model.** FIT→VAL is at most 0.033 for every model, but VAL→TEST
   is 0.081 (AdaBoost) to 0.131 (Logistic Regression), and 0.097 for the Decision Tree (`In [18]`). VAL holds later packets
   of the same sessions as FIT, so quote TEST for any claim about unseen traffic.
4. **The shortcut ablation does not show the expected collapse on TEST** (`In [19]`):

   | Feature set (Decision Tree, same sample) | VAL macro-F1 (variant) | TEST macro-F1 (variant) | TEST macro-F1 (binary) |
   |---|---|---|---|
   | (a) clean features (deployed) | 0.8693 | 0.7832 | 0.9886 |
   | (b) clean + `timestamp` + `packet_no` | 1.0000 | 0.8567 | 1.0000 |
   | (c) `timestamp` + `packet_no` only | 1.0000 | 0.8567 | 1.0000 |

   The VAL result shows what the guide expected: the two columns identify the capture. On TEST they do not collapse; they
   score *higher* than the clean features. The most likely reason, from the time ranges printed in `In [9]`, is that each
   class's test capture was recorded minutes after its training captures (for example MQTT-DoS-Connect train starts
   2023-08-28 18:26 UTC and its test capture at 18:32), so a timestamp learned from training still points at the right
   class. This is an inference, not something the notebook tests. Consequences: excluding these columns is still correct,
   because a live network has no such clock to rely on; the reported TEST numbers are not inflated by them, because the
   deployed model never sees them; but TEST measures *new sessions of the same campaigns recorded back to back*, not new
   environments. Word any generalisation claim accordingly, and do not cite this ablation as proof that shortcuts fail on TEST.
5. **Leave-capture-out recall is lower than in-capture VAL recall for 5 of the 8 classes tested** (`In [19]`). The classes
   tested are the eight DoS/DDoS classes with several training sessions; Benign and the four MQTT classes have one training
   capture each and cannot be tested this way.

   | Class | Held-out session | Recall, unseen session | Recall, in-capture VAL | Most common error |
   |---|---|---|---|---|
   | DoS-SYN | TCP_IP-DoS-SYN4 | 0.976 | 0.870 | DDoS-SYN |
   | DoS-TCP | TCP_IP-DoS-TCP4 | 0.600 | 0.872 | DDoS-TCP |
   | DoS-UDP | TCP_IP-DoS-UDP4 | 0.888 | 0.946 | DDoS-UDP |
   | DoS-ICMP | TCP_IP-DoS-ICMP4 | 0.783 | 0.805 | DDoS-ICMP |
   | DDoS-SYN | TCP_IP-DDoS-SYN4 | 0.377 | 0.724 | DoS-SYN |
   | DDoS-TCP | TCP_IP-DDoS-TCP4 | 0.528 | 0.752 | DoS-TCP |
   | DDoS-UDP | TCP_IP-DDoS-UDP8 | 0.925 | 0.902 | DoS-UDP |
   | DDoS-ICMP | TCP_IP-DDoS-ICMP8 | 0.836 | 0.793 | DoS-ICMP |

   The largest drops are DDoS-SYN, DDoS-TCP and DoS-TCP. Subtype-level recall on the unseen session is at least 0.9945 for
   all eight, and every most-common error is the DoS/DDoS twin, which agrees with finding 2.
6. **Calibration improves probabilities but costs some F1** (`In [16]`, `In [17]`). On VAL, cross-fitted, ECE is unchanged
   (0.0317 → 0.0322) while log-loss improves (0.4444 → 0.3941). On TEST at variant level, ECE improves (0.0984 → 0.0664),
   log-loss improves (1.0909 → 1.0116) and Brier improves (0.3188 → 0.3046), but macro-F1 falls from 0.7806 to 0.7643
   and worst-class recall from 0.291 to 0.285. At family, subtype and binary level the F1 loss is 0.0085, 0.0008 and 0.0021.
   The bundle and the headline use the calibrated model.
7. **Model choice.** On TEST variant macro-F1 the six good models (Decision Tree, Random Forest, XGBoost, LightGBM, BiRNN,
   Transformer) span 0.7794–0.7930, a spread of 0.014; at subtype level the spread is 0.0014 and at binary level 0.0020.
   The Decision Tree gives up 0.012 of variant macro-F1 against the BiRNN (both uncalibrated), and 0.029 when its
   calibrated headline (0.7643) is compared with the BiRNN's uncalibrated figure (0.7930). In return it is 45× faster than the
   BiRNN per 1,000-packet batch (3.8 ms against 170 ms) and uses 24 MB instead of 280 MB. This is the trade the composite
   score encoded (section 8). The VAL columns alone favour the BiRNN (best VAL macro-F1 and worst-class recall, zero benign
   false alarms on VAL). The team should make and record this decision deliberately.
8. **The live engine works on real captures** (`In [22]`, first 5,000 packets of one TEST capture each, every packet
   classified):

   | Capture | Predicted attack | Predicted true family | Predicted true variant | End-to-end packets/s | Model ms/packet (p50) |
   |---|---|---|---|---|---|
   | Benign_test | 0.26 % | 99.74 % | 99.74 % | 2,046 | 0.0058 |
   | MQTT-DDoS-Connect_Flood_test | 100 % | 99.76 % | 93.80 % | 10,099 | 0.0060 |
   | TCP_IP-DDoS-ICMP1_test | 99.94 % | 94.70 % | 94.56 % | 1,722 | 0.0084 |
   | TCP_IP-DoS-ICMP_test | 100 % | 57.02 % | 57.02 % | 9,813 | 0.0056 |

   Detection is reliable, and the DoS-ICMP row repeats finding 2: every packet is flagged but only 57 % are assigned the
   right family. Model time is about 0.006 ms per packet, so end-to-end speed is dominated by parsing. It varies six-fold
   between captures for a reason the notebook does not investigate.

### 18.5 Artifacts and the best-model pointer

* The deployment bundle of this run is `runs/run_0c8497aa2f/models/detector_bundle.joblib`, with `iomt_runtime.py`,
  `iomt_torch_models.py` and `iomt_inference.py` beside it (`In [20]`, `In [22]`).
* **`best_model/` was not updated by this run.** `In [20]` printed "Global best kept: different evaluation protocol
  (9adf7f6222 vs a94af550bf)". The stored pointer belongs to an earlier run under protocol `9adf7f6222`; the notebook does
  not say which run that was. Check what `best_model/best_model.json` points to before relying on `best_model/`.
* To make this run the global best, set `FORCE_UPDATE_BEST = True` in the §18 cell (`In [20]`) and run it again. After a
  reconnect, use *Run all* first: nothing is retrained and the variables the cell needs are rebuilt (section 11).
* Otherwise, use the run folder's bundle directly, as in section 10.

### 18.6 Timings and resources

From the model metadata in `In [23]`. Final fits only; search time is not in the saved outputs (section 11). "Peak train
RAM" is the whole notebook process, which already holds about 4.4 GB of data (the Dummy, which does nothing, shows 4,429 MB).

| Model | Final fit (s) | Peak train RAM (MB) | Peak train VRAM (MB) | Peak inference VRAM (MB) |
|---|---|---|---|---|
| decision_tree | 60.7 | 4,454 | 0 | 0 |
| logreg | 472.5 | 6,781 | 0 | 0 |
| random_forest | 228.6 | 5,185 | 0 | 0 |
| adaboost | 1,395.2 | 5,567 | 0 | 0 |
| xgboost | 153.8 | 6,144 | 1,022 | 0 |
| lightgbm | 1,047.8 | 6,462 | 0 | 0 |
| birnn | 1,058.1 | 8,100 | 448 | 243 |
| transformer | 1,581.9 | 7,779 | 516 | 263 |

The final fits add up to about 6,000 s (100 minutes). Extraction totalled 2,808 s (47 minutes; `In [5]`, from the cache metadata)
and feature assembly 253 s (`In [6]`).

### 18.7 Suggested next steps

These are suggestions drawn from the findings above, not decisions the team has taken.

1. Decide the deployed model from the VAL and cost columns (finding 7), record the decision, and set `MANUAL_SELECTION` if it
   differs from the composite winner. Redo this on the revised run, whose ranking may change.
2. Decide whether to promote this run to `best_model/` (section 18.5).
3. ~~Diagnose DoS vs DDoS (finding 2).~~ **Done in code:** see section 20. Next, run the revised notebook on the real
   data and fill in section 20.6 before spending effort on more models; the spread among the good models is small
   compared with this error.
4. Re-benchmark the shortlisted models on the real gateway (section 8, caveat).
5. Run the standalone CLI on a real capture in a separate process (section 13, "Still not done").
6. Either diagnose AdaBoost or keep it in the comparison with the note in section 14, item 15.
7. Word any generalisation claim with finding 4 in mind.

---

## 19. Notebook map

Every section of the **revised** notebook, the code cell that runs it, what it writes or leaves in memory, and the
matching part of this guide. `In [k]` is the Colab execution count after *Run all* (24 code cells). `%%writefile` cells
create the modules the bundle depends on.

| Notebook § | Title | Code cell | Writes / leaves in memory | This guide |
|---|---|---|---|---|
| §1 | Abstract, architecture, requirements tracing | markdown only | none | 1, 3 |
| §2 | Environment setup, GPU detection, library audit | `In [1]` | `VERSIONS`, `HARDWARE`, memory tools (`mem_guard`, `PeakMemory`) | 4 |
| §3 | Global configuration, paths, run hashes | `In [2]` | all settings, `SETTINGS_HASH` | 4, 6 |
| §4 | PCAP discovery, fingerprinting, label parsing | `In [3]` | `LABEL_RULES`, `HIERARCHY`, `FILES`, `CONFIG_HASH`, `RUN_DIR`, `reports/file_manifest.csv` | 4 |
| §5 | Streaming extraction, shortcut removal | `In [4]`, `In [5]` | `iomt_runtime.py` (`%%writefile`, now with `LONG_FEATURES`, `window_group_stats`, `long_horizon_features`), `cache/*.parquet` and `.json`, `reports/extraction_report.csv` | 4, 5 |
| §5b | **DoS vs DDoS diagnosis (new)** | `In [6]` | `VARIANT_CODE`, `SUBTYPE_OF`, `protocol_match`, `dos_ddos_partner`, `DOS_DDOS_PAIRS`, `DIAG_ATTACKERS`, `DIAG_SEPARABILITY`, `reports/dos_ddos_diagnosis_*.csv`, `dos_ddos_diagnosis_history.png` | 4, 20 |
| §6 | Feature assembly, windowing | `In [7]` | `RAW_PARTS`, `SEQ_STORE` / `SEQ_VIEW`, `reports/assembly_report.csv` | 4 |
| §7 | Preprocessing | `In [8]` | `PREP`, `FEATURES` | 4, 5 |
| §8 | Labels and collapse matrices | `In [9]` | `EVAL_LEVELS`, `reports/label_mapping.json` | 4 |
| §9 | Leakage-safe split, data audit | `In [10]` | `PARTS`, split table, `reports/label_conflicts.csv`, figures | 4 |
| §10 | Training framework, baselines | `In [11]` | `SPACES`, `run_search`, `final_fit`, `fit_model`, `evaluate` (+ `dos_ddos_swap_rate`), `dos_ddos_table`, `tuning/trials.csv`, Dummy / LogReg / Decision Tree | 4, 7 |
| §11 | Random Forest, AdaBoost | `In [12]` | `models/random_forest/`, `models/adaboost/` | 4, 7 |
| §12 | XGBoost, LightGBM | `In [13]` | `models/xgboost/`, `models/lightgbm/` | 4, 7 |
| §13 | Deep sequence models | `In [14]`, `In [15]` | `iomt_torch_models.py` (`%%writefile`), `fit_seq_model`, `models/birnn/`, `models/transformer/` | 4, 7 |
| §14 | Multi-criteria model selection | `In [16]` | `bench/bench_model.py`, `bench.json` per model, `SELECTION`, `SELECTED`, `reports/model_selection_multicriteria.csv` | 4, 8 |
| §15 | Probability calibration | `In [17]` | `CALIBRATOR`, `calibrator_sigmoid.joblib` | 4 |
| §16 | Final evaluation on TEST | `In [18]` | `TEST_RESULTS`, `TEST_PROBA`, `DOS_DDOS_TEST`, `reports/test_*.csv` (incl. `test_dos_ddos_<model>.csv`), `test_results_full.json` | 4 |
| §17 | Robustness, importance, ablation, DoS↔DDoS before/after | `In [19]`, `In [20]` | `reports/generalization_gaps.csv`, `top_confusions.csv`, `error_vs_floor.csv`, `feature_importance_<model>.csv`, `shortcut_ablation.csv`, `leave_capture_out.csv`, `SEP` / `SEP_PAIRS` → `dos_ddos_before_after*.csv`, `dos_ddos_before_after.png` | 4, 20 |
| §18 | Bundle and best-model pointer | `In [21]` | `BUNDLE`, `detector_bundle.joblib`, `model_card.json`, `feature_schema.json`, `experiment_summary.csv`, `best_model/` | 4, 10, 18.5 |
| §19 | Live PCAP inference engine | `In [22]`, `In [23]` | `iomt_inference.py` (`%%writefile`), streaming-equality assertion on a real cache, demo table (both scales per protocol) | 4, 10 |
| §20 | Final summary | `In [24]` | `FINAL_TABLE`, `final_model_comparison.csv` | 4, 18 |

Functions and classes worth knowing, by module:

| Where | Names |
|---|---|
| `iomt_runtime.py` (written by `In [4]`) | `PcapSource`, `plan_blocks`, `read_blocks`, `decode_records`, `RAW_SPEC`, `build_features`, `window_group_stats`, `long_horizon_features`, `LONG_FEATURES`, `DEFAULT_LONG_CONTEXT_N`, `StreamFeaturizer`, `ProbaPassthrough` |
| `iomt_torch_models.py` (written by `In [14]`) | `BiRNNClassifier`, `PacketTransformer`, `ARCHS`, `TorchSequencePredictor`, `train_sequence_model` |
| `iomt_inference.py` (written by `In [22]`) | `load_detector`, `predict_pcap_stream`, the command-line entry point |
| Notebook cells | `extract_capture` (`In [5]`), `protocol_match`, `dos_ddos_partner`, `read_cache_blocks`, `burst_lengths` (`In [6]`), `assign_roles`, `get_windows`, `WindowDataset`, `make_loader` (`In [7]`), `dos_ddos_table` (`In [11]`), `run_search`, `final_fit`, `fit_model`, `evaluate` (`In [11]`), `fit_seq_model` (`In [15]`), `model_artifact`, `proba_of` (`In [16]`, `In [17]`) |

To change something and see where it takes effect, use the "How to extend it" list in section 16 of this guide, then re-run from
the cell named in the table above. Hashed settings (section 6) start a new run folder; selection settings do not.

---

## 20. DoS vs DDoS revision: cause, fix and verification

This revision answers limitation 12 of the previous run: *"DoS vs DDoS is not separable per packet … The cause is not
diagnosed in the notebook."* The team chose **new features + retraining** over a post-hoc window vote. The vote remains
possible as a later add-on (section 16).

### 20.1 The cause

Same-protocol DoS and DDoS in CICIoMT2024 run the same flood tool on identical Raspberry Pis, so their packets are the
same. The only difference is **how many hosts attack the victim at once**. The capture profile (`PCAP_README.md`, first
5,000 packets per TEST capture) shows every DoS packet from `192.168.137.48`, while the DDoS captures use `.48`, `.212`,
`.156` and `.37`. The previous features could not see this, for three reasons:

1. **Bursts longer than the window.** Consecutive packets usually come from one attacker. In the profile, the first five
   packets of DDoS-UDP1, DDoS-ICMP2 and DDoS-SYN each share one source, often with identical timestamps. A burst longer
   than 20 packets means `ctx_n_src` sees one attacker in a DDoS, just as in a DoS.
2. **Not victim-centric.** `ctx_n_src` counted sources over the whole stream, including the victim's replies (for
   example, `.250 → .48` in DoS-ICMP). A single attacker plus replies already gives 2 sources.
3. **No scale information in a single packet.** With the scale invisible, a per-packet model can only memorise
   session-specific details. The previous run showed exactly that pattern:
   * all top-10 TEST confusions were DoS↔DDoS of the same protocol;
   * leave-capture-out DDoS-SYN recall fell to 0.377 on an unseen session (0.724 in-capture);
   * subtype recall stayed ≥ 0.994.

§5b tests (1) and (2) directly on the real training captures (burst lengths, fan-in against history length) and (3)
with the separability ladder. **The real numbers are in section 21.5:** DDoS bursts have a median of 4 packets (p90
37), and only 51.8 % of DDoS attack packets show a second attacker within 20 packets, against 95.8 % within 1,024.

### 20.2 The fix

* **Count per endpoint, not per stream.**
  * For the current packet's destination: how many distinct sources sent to it (`lh_fanin_dst`).
  * For its source: how many distinct destinations it sent to (`lh_fanout_src`). This catches the victim's replies.
  * The pair's share of that traffic (`lh_pair_share_min`): ≈ 1 for one attacker, ≈ 1/k for k attackers.
  * Rates into the destination and of the pair.
* **Look further back.** The window is the last `LONG_CONTEXT_N = 1024` packets. That is long enough to span several
  bursts, and short enough for about 5 % warm-up per 20k block and a small live carry-over. §5b reports the share of
  DDoS packets that see a second attacker at 20, 64, 256, 1,024 and 4,096 packets, so the choice can be checked. A NOTE
  is printed if 1,024 is too short for any class.
* **Train what you deploy.**
  * A target needs its full 1,024-packet history inside its block (`HISTORY_N`).
  * The purge gap is at least 1,025 packets.
  * The live engine carries 1,024 packets between batches.
  * An assertion in §19 checks on real traffic that streaming reproduces the training features exactly.
* **Identity-free.** Addresses are used only as hashes for counting, so the model learns *how many* hosts, never *which*
  hosts. That matters because the DDoS victims and attacker sets differ between captures.
* **Why packet-count windows, not time windows.** The training data is stored as 20k-packet blocks, so a packet-count
  history always fits inside one block. A time window can span a block boundary in slow captures. A time-capped
  variant is listed in section 16.

### 20.3 What changed, cell by cell

| Notebook | Cell (new numbering) | Change |
|---|---|---|
| §1 | markdown | Revision note, updated diagram, new design-decision and requirement rows |
| §3 | `In [2]` | `LONG_CONTEXT_N`, `HISTORY_N`, `FEATURE_VERSION`, `RUN_DOS_DDOS_DIAGNOSIS`, `DIAG_*`, `RUN_DOS_DDOS_ABLATION`; smoke overrides; the new settings are hashed |
| §5 | `In [4]` | `iomt_runtime.py` 1.1.0: `LONG_FEATURES`, `window_group_stats`, `long_horizon_features`, `build_features(…, n_long)`, `StreamFeaturizer(n_ctx, n_long)` |
| §5 | `In [5]` | Feature-count print includes the long-horizon features |
| §5b | `In [6]` (new) | Shared helpers moved here from §6, plus the diagnosis (A), ladder (B), automatic reading and figure |
| §6 | `In [7]` | Eligibility `bpos ≥ HISTORY_N`, gap ≥ `HISTORY_N + 1`, `build_features(…, LONG_CONTEXT_N)`, store key includes `n_long`, stale-store cleanup |
| §9 | `In [10]` | Leakage assertion against `HISTORY_N` |
| §10 | `In [11]` | `dos_ddos_table`, `dos_ddos_swap_rate` in `evaluate`, `val_dos_ddos_swap_rate` in trials |
| §14 | `In [16]` | Swap rate shown in the selection table (not scored) |
| §16 | `In [18]` | Swap rate in the TEST tables, per-pair DoS/DDoS table for the selected model |
| §17 | `In [19]`, `In [20]` | Top-confusion DoS↔DDoS flag; new item 6, before/after |
| §18 | `In [21]` | Bundle keys `long_context_n`, `history_n`, `long_features`, `feature_version`; protocol hash includes them |
| §19 | `In [22]`, `In [23]` | Live engine passes `long_context_n`; real-cache streaming assertion; demo shows both scales |
| §20 | `In [24]` | Swap rate columns; headline lines for the swap rate, the before/after and the diagnosis |
| all | | Saved outputs cleared, because every number changes with the feature set |

`iomt_torch_models.py` changes only by the GradScaler resume fix (section 4, §13); the input width follows `F_SEQ`.

### 20.4 Verification so far

Synthetic only; see section 13, stage 3: brute-force exactness, streaming equality, about 42 ms per block, the
mechanism test (0.50 / 0.61 / 1.00), and a full smoke run with no errors. **Real data:** `run_c53a51becb`
(section 13, stage 4, and section 21).

### 20.5 How to read the first real run

| Where | Fix working | Fix not (fully) working, and what to do |
|---|---|---|
| §5b (A) | DoS ≈ 1 attacker per block, DDoS ≥ 2; fan-in ≥ 2 share for DDoS rises steeply between 20 and 1,024 packets; no NOTE | DDoS share still low at 1,024 → raise `LONG_CONTEXT_N` (2,048 or 4,096). DoS also shows ≥ 2 → benign or background hosts talk to the victim; check `lh_pair_share_min`, which should still differ |
| §5b (B) | Header only ≈ 0.5, 20-packet context a little higher, long-horizon close to 1 on leave-capture-out rows | Long-horizon stays near the old design → the scale is not visible in the data at this horizon; consider the time-window vote (section 16) and report the limit |
| §17 item 6 | TEST swap rate falls clearly from (b) to (c); variant macro-F1 rises towards the subtype level | Small change → as above |
| §17 leave-capture-out | DDoS-SYN / DDoS-TCP / DoS-TCP unseen-session recall rises from 0.377 / 0.528 / 0.600 | Still low → the model still memorises sessions; inspect permutation importance for `lh_*` |
| §16 / §20 | Top-10 confusions no longer all DoS↔DDoS; variant ECE falls | |
| §14 | Ranking may change (more features, slower trees); re-make the model decision (section 18.7, step 1) | |

### 20.6 Results to record after the first real run

Filled in from the revised notebook's outputs (`run_c53a51becb`). "Before" is the previous run (section 18); in §17
item 6, row (b) is the like-for-like "before" on the same sample.

| Metric | Before (`run_0c8497aa2f`) | After (`run_c53a51becb`) | Source in the new notebook |
|---|---|---|---|
| TEST variant macro-F1, selected + calibrated | 0.7643 | **0.8584** | §20 headline (`In [24]`) |
| TEST variant accuracy, selected + calibrated | 0.7805 | **0.8836** | §20 headline |
| TEST subtype macro-F1 | 0.9936 | **0.9947** | §20 headline |
| TEST family macro-F1 | 0.8725 | **0.9514** | §20 headline |
| TEST binary macro-F1 | 0.9853 | **0.9854** | §20 headline |
| TEST variant macro-F1, selected, uncalibrated | 0.7806 | **0.8835** | §16 (`In [18]`) |
| TEST DoS↔DDoS swap rate, selected + calibrated | not computed | **0.1175** (0.0919 uncalibrated) | §16 / §20 |
| DoS↔DDoS among top-10 confusions | 10 of 10 | **7 of 10** | §17 (`In [19]`) |
| §17 item 6 TEST swap rate, (a) → (b) → (c) | n/a | **0.457 → 0.210 → 0.108** | §17 (`In [20]`) |
| §17 item 6 TEST variant macro-F1, (a) → (b) → (c) | n/a | **0.517 → 0.796 → 0.880** | §17 (`In [20]`) |
| §5b mean balanced accuracy, header / 20-pkt / + long-horizon / long-horizon alone | n/a | **0.641 / 0.847 / 0.948 / 0.954** | §5b (`In [6]`) |
| Leave-capture-out recall DDoS-SYN / DDoS-TCP / DoS-TCP | 0.377 / 0.528 / 0.600 | **0.887 / 0.988 / 0.635** | §17 (`In [20]`) |
| Variant label-conflict floor (TEST) | 0.0051 | **0.0000** | §9 (`In [10]`) |
| TEST variant ECE raw → calibrated | 0.0984 → 0.0664 | **0.0722 → 0.0812** | §20 headline |
| Selected model | Decision Tree (composite) | **Decision Tree (composite, score 0.9798)** | §14 (`In [16]`) |
| Run / protocol hash | `0c8497aa2f` / `a94af550bf` | **`c53a51becb` / `1373798b05`** | §4 / §18 |

**Reading against section 20.5.** §5b (A) and (B) match the "fix working" column: DoS shows 1 attacker and DDoS 3–4,
fan-in rises steeply between 20 and 1,024 packets, no NOTE, and the long-horizon features lift every pair's
leave-capture-out balanced accuracy to 0.90–0.96. §17 item 6 halves the swap rate. Leave-capture-out recall rose
sharply for DDoS-SYN and DDoS-TCP, but not for DoS-TCP. The top-10 confusions are no longer all DoS↔DDoS. Variant ECE
did **not** fall after calibration. The remaining failures are two pairs on TEST only (section 21.4).

### 20.7 Open decisions for the team

1. **`LONG_CONTEXT_N`.** §5b printed no NOTE, so 1,024 is long enough on the training captures. It is hashed, so
   changing it starts a new run.
2. **Model selection on the new run** (section 8). The cost terms may shift, because there are more features.
3. **Whether to promote the new run to `best_model/`** with `FORCE_UPDATE_BEST = True`. Its protocol differs by design.
4. **Whether to add a window-level DoS/DDoS vote** to the live engine for incident-level reports (section 16).
5. **How to word the result in the report.** Present it as "DoS vs DDoS is separable once attacker cardinality per
   victim is measured over ~1,000 packets, on CICIoMT2024", with the caveats in section 14, item 12.

---

## 21. Recorded run of the revised notebook: accuracy, precision and recall at every level

**This section is the first real-data run of the revised notebook** (`FYP_IoMT_PCAP_Detector_dos_ddos_fix_scalerfix.ipynb`,
run `c53a51becb`). `In [k]` uses the revised notebook's numbering (24 code cells). Every number is read from the saved
outputs. The only values computed outside the notebook are the selected model's macro and weighted precision at the
subtype, family and binary levels, which are averages of its printed per-class table (they reproduce the printed macro
recall and macro-F1 to ±0.0001), and the error shares in 21.4.

**Two definitions used throughout.** *Macro* precision/recall = the unweighted mean over classes, so every class counts
equally. *Weighted* recall equals accuracy. Balanced accuracy is defined in `evaluate()` as the mean per-class recall,
so it **is** macro recall.

### 21.1 Run facts

| Item | Value | Notebook |
|---|---|---|
| Run identifiers | `SETTINGS_HASH` 6173c20dcc, `CONFIG_HASH` c53a51becb, protocol hash 1373798b05 | `In [2]`, `In [3]`, `In [21]` |
| Hardware | Tesla T4 (15.6 GB VRAM), 2 CPU cores, 13.6 GB RAM | `In [1]` |
| Libraries | Python 3.13.16, scikit-learn 1.6.1, XGBoost 3.4.1, LightGBM 4.6.0, PyTorch 2.14.1+cu130, dpkt 1.9.8 | `In [1]` |
| Captures / packets | 60 (45 train, 15 test), none excluded; 840,830,708 packets, 57,850,708 extracted (Parquet caches reused) | `In [3]`, `In [5]` |
| Rows | FIT 2,598,912; VAL 651,090; TEST 1,299,644 (VAL fraction 0.0805, TEST 0.1034) | `In [7]` |
| Features | 74 built, **69 kept** (`ip_mf`, `ip_frag`, `tcp_urg`, `malformed` constant; `tcp_cwr` = `tcp_ece`) | `In [8]` |
| Sequence store | 57,850,708 × 47 = 10.88 GB; feature assembly 252 s | `In [7]` |
| Leakage | min FIT→VAL gap 5,000 packets ≥ `HISTORY_N` 1,024; label-conflict floor 0.0 at every level; 0.0 % of TEST vectors occur in FIT (previous run 8.0 %) | `In [10]` |
| Selected model | Decision Tree (composite score 0.9798), Platt-calibrated on VAL | `In [16]`, `In [17]` |
| Top-5 permutation features | `lh_pair_share_min`, `ctx_tcp_ratio`, `ctx_len_sum`, `is_icmp`, `lh_log_dst_rate` | `In [19]` |
| Bundle | `runs/run_c53a51becb/models/detector_bundle.joblib`; `best_model/` **not** replaced (protocol 9adf7f6222 vs 1373798b05) | `In [21]` |

TEST rows per class: Benign 36,960 · DoS-SYN 97,732 · DoS-TCP 96,464 · DoS-UDP 95,821 · DoS-ICMP 96,819 · DDoS-SYN 96,919 ·
DDoS-TCP 97,429 · DDoS-UDP 194,788 · DDoS-ICMP 192,730 · MQTT-DoS-Connect 30,529 · MQTT-DoS-Publish 83,832 ·
MQTT-DDoS-Connect 97,273 · MQTT-DDoS-Publish 82,348 (`In [10]`).

### 21.2 Every model on TEST: accuracy, precision and recall per level

TEST, one pass (`In [18]`). Rows are uncalibrated except the last, which is the deployed headline. **Do not choose the
model from these columns** (section 8); they are for reporting.

**Variant level (13 classes)**

| Model | Accuracy | Macro precision | Macro recall | Macro-F1 | Weighted F1 | Worst-class recall | DoS↔DDoS swap rate |
|---|---|---|---|---|---|---|---|
| dummy (prior) | 0.0645 | 0.0050 | 0.0769 | 0.0093 | 0.0078 | 0.0000 (Benign) | 0.0652 |
| logreg | 0.9153 | 0.9319 | 0.9122 | 0.8908 | 0.9023 | 0.1200 (MQTT-DDoS-Publish) | 0.0847 |
| decision_tree | 0.9084 | 0.9327 | 0.8994 | 0.8835 | 0.8941 | 0.1157 (MQTT-DDoS-Publish) | 0.0919 |
| random_forest | 0.9054 | 0.9349 | 0.8966 | 0.8810 | 0.8904 | 0.1128 (MQTT-DDoS-Publish) | 0.0955 |
| adaboost | 0.9146 | 0.9296 | 0.9089 | 0.8886 | 0.9005 | 0.1021 (MQTT-DDoS-Publish) | 0.0849 |
| xgboost | 0.9069 | 0.9367 | 0.8977 | 0.8838 | 0.8927 | 0.1307 (MQTT-DDoS-Publish) | 0.0944 |
| lightgbm | 0.9053 | 0.9359 | 0.8958 | 0.8812 | 0.8903 | 0.1185 (MQTT-DDoS-Publish) | 0.0960 |
| birnn | 0.9089 | 0.9341 | 0.9028 | 0.8856 | 0.8954 | 0.1234 (MQTT-DDoS-Publish) | 0.0921 |
| transformer | 0.9032 | 0.9300 | 0.8971 | 0.8799 | 0.8891 | 0.1183 (MQTT-DDoS-Publish) | 0.0978 |
| **decision_tree + calibrated (deployed)** | **0.8836** | **0.9232** | **0.8749** | **0.8584** | **0.8645** | **0.1157 (MQTT-DDoS-Publish)** | **0.1175** |

**Subtype level (7 classes)**

| Model | Accuracy | Macro recall (= balanced acc.) | Macro-F1 | Weighted F1 | Worst-class recall | Benign false-alarm rate |
|---|---|---|---|---|---|---|
| dummy (prior) | 0.0983 | 0.1429 | 0.0256 | 0.0176 | 0.0000 | 1.0000 |
| logreg | 0.9977 | 0.9972 | 0.9945 | 0.9977 | 0.9947 | 0.0027 |
| decision_tree | 0.9977 | 0.9975 | 0.9947 | 0.9978 | 0.9948 | 0.0017 |
| random_forest | 0.9983 | 0.9983 | 0.9955 | 0.9983 | 0.9953 | 0.0004 |
| adaboost | 0.9682 | 0.8530 | 0.8400 | 0.9545 | 0.0000 | 1.0000 |
| xgboost | 0.9986 | 0.9986 | 0.9963 | 0.9986 | 0.9957 | 0.0002 |
| lightgbm | 0.9985 | 0.9985 | 0.9960 | 0.9985 | 0.9957 | 0.0001 |
| birnn | 0.9984 | 0.9984 | 0.9958 | 0.9984 | 0.9952 | 0.0002 |
| transformer | 0.9982 | 0.9983 | 0.9954 | 0.9982 | 0.9951 | 0.0001 |
| **decision_tree + calibrated (deployed)** | **0.9977** | **0.9974** | **0.9947** | **0.9978** | **0.9947** | **0.0018** |

**Family level (4 classes)**

| Model | Accuracy | Macro recall (= balanced acc.) | Macro-F1 | Weighted F1 | Worst-class recall | Benign false-alarm rate |
|---|---|---|---|---|---|---|
| dummy (prior) | 0.2262 | 0.2500 | 0.0922 | 0.0835 | 0.0000 | 1.0000 |
| logreg | 0.9716 | 0.9827 | 0.9743 | 0.9717 | 0.9424 | 0.0027 |
| decision_tree | 0.9647 | 0.9740 | 0.9694 | 0.9646 | 0.9306 | 0.0017 |
| random_forest | 0.9616 | 0.9717 | 0.9675 | 0.9615 | 0.9194 | 0.0005 |
| adaboost | 0.7108 | 0.5623 | 0.5291 | 0.7130 | 0.0000 | 1.0000 |
| xgboost | 0.9619 | 0.9715 | 0.9685 | 0.9618 | 0.9150 | 0.0002 |
| lightgbm | 0.9610 | 0.9708 | 0.9674 | 0.9609 | 0.9119 | 0.0001 |
| birnn | 0.9645 | 0.9755 | 0.9700 | 0.9645 | 0.9446 | 0.0002 |
| transformer | 0.9590 | 0.9710 | 0.9657 | 0.9589 | 0.9281 | 0.0001 |
| **decision_tree + calibrated (deployed)** | **0.9399** | **0.9536** | **0.9514** | **0.9393** | **0.8533** | **0.0018** |

**Macro precision at the subtype and family levels for the non-selected models is computed but not printed**: §16
displays only a subset of columns at the coarse levels. The values are in `runs/run_c53a51becb/reports/test_metrics_all_models.csv`
(column `macro_precision`, rows `subtype` / `family`) and in `test_results_full.json`. For the deployed model they are
in 21.3.

Binary level, for completeness: accuracy 0.9985–0.9988 and macro-F1 0.9865–0.9894 for every model except AdaBoost and the
Dummy (both 0.9716 / 0.4928); deployed model 0.9984 / 0.9854.

### 21.3 Deployed model (Decision Tree + Platt calibration): summary and per-class tables

**Summary per level** (TEST; accuracy, macro recall and macro-F1 printed in `In [18]` / `In [24]`; macro precision for the
coarse levels and every weighted precision averaged from the per-class tables below):

| Level | Accuracy | Macro precision | Macro recall | Macro-F1 | Weighted precision | Weighted recall | Weighted F1 |
|---|---|---|---|---|---|---|---|
| Variant (13) | 0.8836 | 0.9232 | 0.8749 | 0.8584 | 0.9174 | 0.8836 | 0.8645 |
| Subtype (7) | 0.9977 | 0.9922 | 0.9974 | 0.9947 | 0.9978 | 0.9977 | 0.9978 |
| Family (4) | 0.9399 | 0.9510 | 0.9536 | 0.9514 | 0.9409 | 0.9399 | 0.9393 |
| Binary (2) | 0.9984 | 0.9765 | 0.9948 | 0.9854 | 0.9984 | 0.9984 | 0.9984 |

**Variant level, per class** (`In [18]`; `predicted` = packets assigned to the class):

| Class | Precision | Recall | F1 | Support | Predicted |
|---|---|---|---|---|---|
| Benign | 0.9520 | 0.9986 | 0.9748 | 36,960 | 38,770 |
| DoS-SYN | 0.9459 | 0.9901 | 0.9675 | 97,732 | 102,302 |
| DoS-TCP | 0.9993 | 0.9901 | 0.9946 | 96,464 | 95,577 |
| DoS-UDP | 0.8796 | 0.9974 | 0.9348 | 95,821 | 108,660 |
| DoS-ICMP | 0.9842 | **0.4362** | 0.6045 | 96,819 | 42,909 |
| DDoS-SYN | 0.9904 | 0.9339 | 0.9613 | 96,919 | 91,388 |
| DDoS-TCP | 0.9899 | 0.9900 | 0.9899 | 97,429 | 97,439 |
| DDoS-UDP | 0.9987 | 0.9330 | 0.9647 | 194,788 | 181,958 |
| DDoS-ICMP | 0.7787 | 0.9965 | 0.8742 | 192,730 | 246,630 |
| MQTT-DoS-Connect | 0.9838 | 0.9957 | 0.9897 | 30,529 | 30,899 |
| MQTT-DoS-Publish | **0.5362** | 0.9989 | 0.6978 | 83,832 | 156,170 |
| MQTT-DDoS-Connect | 0.9994 | 0.9972 | 0.9983 | 97,273 | 97,061 |
| MQTT-DDoS-Publish | 0.9641 | **0.1157** | 0.2066 | 82,348 | 9,881 |

**Subtype level, per class:**

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Benign | 0.9522 | 0.9982 | 0.9746 | 36,960 |
| SYN | 0.9996 | 0.9947 | 0.9972 | 194,651 |
| TCP | 0.9996 | 0.9951 | 0.9973 | 193,893 |
| UDP | 0.9999 | 0.9999 | 0.9999 | 290,609 |
| ICMP | 1.0000 | 1.0000 | 1.0000 | 289,549 |
| MQTT-Connect | 0.9965 | 0.9966 | 0.9965 | 127,802 |
| MQTT-Publish | 0.9974 | 0.9974 | 0.9974 | 166,180 |

**Family level, per class:**

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Benign | 0.9522 | 0.9982 | 0.9746 | 36,960 |
| DoS | 0.9446 | **0.8533** | 0.8966 | 386,836 |
| DDoS | 0.9083 | 0.9638 | 0.9352 | 581,866 |
| MQTT-Flood | 0.9990 | 0.9992 | 0.9991 | 293,982 |

**Binary level, per class:** Benign precision 0.9533 / recall 0.9909; Attack precision 0.9997 / recall 0.9986. Benign
false-alarm rate 0.0014 (variant level); attacks missed as benign 0.0015.

**DoS vs DDoS per protocol, deployed model** (`In [18]`; share of the pair's true packets put on the wrong scale):

| Pair | DoS → DDoS | DDoS → DoS | Swap rate |
|---|---|---|---|
| DoS-SYN / DDoS-SYN | 0.0083 | 0.0571 | 0.0326 |
| DoS-TCP / DDoS-TCP | 0.0097 | 0.0006 | 0.0051 |
| DoS-UDP / DDoS-UDP | 0.0024 | 0.0670 | 0.0457 |
| DoS-ICMP / DDoS-ICMP | **0.5638** | 0.0035 | 0.1908 |
| MQTT-DoS-Connect / MQTT-DDoS-Connect | 0.0004 | 0.0001 | 0.0002 |
| MQTT-DoS-Publish / MQTT-DDoS-Publish | 0.0003 | **0.8793** | 0.4359 |

### 21.4 Findings

1. **The fix works for four of the six protocol pairs.** SYN, TCP, UDP and MQTT-Connect swap rates on TEST are 0.0002–0.046.
   Variant macro-F1 rose by 0.094 (calibrated) and family macro-F1 by 0.079 against the previous run; subtype and binary
   were already solved and stayed so.
2. **Two errors make up 84 % of all variant-level mistakes.** MQTT-DDoS-Publish → MQTT-DoS-Publish (72,406 packets,
   87.9 % of the class) and DoS-ICMP → DDoS-ICMP (54,584 packets, 56.4 %) together are 126,990 of about 151,300 wrong TEST
   packets (`In [19]`). They also explain the low precision of MQTT-DoS-Publish (0.536) and DDoS-ICMP (0.779), and the
   family-level DoS recall of 0.853.
3. **Both failures are specific to the TEST sessions.** On VAL the overall swap rate is 0.023 and DoS-ICMP leave-capture-out
   recall is 0.965 on an unseen *training* session (`In [20]`). In the §19 demo, the first 5,000 packets of the DoS-ICMP
   test capture are 97.9 % correct (`In [23]`), so the error comes from later blocks of that 36.5-minute capture. For
   MQTT-Publish, the new features made TEST *worse* on the same sample (swap 0.303 → 0.438, §17 item 6), while §5b shows
   MQTT-DDoS-Publish with ≥ 2 attackers in 100 % of training packets at 1,024. The likely reading, not tested, is that
   the MQTT-DDoS-Publish test capture (2.2 minutes) is dominated by one publisher, so it looks like a DoS by attacker
   count. Inspecting the attacker counts of these two test captures is fine for the report, but **do not tune on TEST**.
4. **VAL still overstates TEST by about 0.1 variant macro-F1** (Decision Tree 0.9806 → 0.8835; every model 0.077–0.102,
   `In [19]`). Almost all of the gap is finding 2.
5. **Calibration hurt the deployed model on TEST.** Uncalibrated → calibrated: variant macro-F1 0.8835 → 0.8584, family
   0.9694 → 0.9514, swap rate 0.0919 → 0.1175, variant ECE 0.0722 → 0.0812. On VAL (cross-fitted) it helped a little: ECE
   0.0128 → 0.0104, log-loss 0.137 → 0.102, macro-F1 unchanged (`In [17]`). The calibrator learns VAL's class balance
   and confidence pattern, which TEST does not share. Options for the team: ship the raw tree, or keep calibration for
   the Controller's confidence but take the label from the raw `argmax`. Either choice must be made on VAL grounds and
   recorded.
6. **Model choice.** VAL macro-F1 of the six strong models spans 0.9806–0.9831; cost decides, so the Decision Tree wins
   (3.6 ms per 1,000-packet batch, 17 MB) over XGBoost (102 ms, 123 MB) and the BiRNN (166 ms, 310 MB) (`In [16]`). On
   TEST, Logistic Regression is the best at variant (0.8908) and family (0.9743) level and XGBoost at subtype (0.9963)
   and binary (0.9894). That is reporting only, not a reason to switch.
7. **The long-horizon features are what the trees use.** `lh_pair_share_min` is the top permutation feature and
   `lh_log_dst_rate` is 5th. The label-conflict floor fell from 0.0051 to 0, and no TEST feature vector occurs in FIT.
8. **Shortcut ablation:** clean features 0.8831 vs timestamp + packet number 0.8562 on TEST at the variant level, both
   1.000 vs 0.9939 binary (`In [20]`). See section 14, item 14.
9. **Leave-capture-out** (unseen session vs in-capture VAL recall): DoS-SYN 0.922 / 0.993, DoS-TCP **0.635** / 0.992,
   DoS-UDP 0.990 / 0.993, DoS-ICMP 0.965 / 0.984, DDoS-SYN 0.887 / 0.894, DDoS-TCP 0.988 / 0.941, DDoS-UDP 1.000 / 0.999,
   DDoS-ICMP 0.948 / 0.978. DoS-TCP is the one class whose unseen-session recall did not recover (0.600 before).
10. **Live engine** (`In [23]`, first 5,000 packets per capture): Benign 0.02 % flagged; MQTT-DDoS-Connect 98.96 %,
    DDoS-ICMP1 98.56 %, DoS-ICMP 97.94 %, MQTT-DoS-Connect 99.58 % and DDoS-ICMP2 98.10 % on the true variant;
    2,477–8,263 packets/s end to end; model time 0.005–0.009 ms per packet. The streaming assertion passed.
11. **AdaBoost** fails at the coarse levels; see section 14, item 15.

### 21.5 DoS vs DDoS diagnosis and before/after (real data)

§5b on the training captures (`In [6]`):

| Pair | Header only | + 20-packet context | + long-horizon | Long-horizon alone | Split |
|---|---|---|---|---|---|
| DoS-SYN vs DDoS-SYN | 0.506 | 0.711 | 0.899 | 0.896 | leave-capture-out, 4 folds |
| DoS-TCP vs DDoS-TCP | 0.483 | 0.781 | 0.925 | 0.952 | leave-capture-out, 4 folds |
| DoS-UDP vs DDoS-UDP | 0.563 | 0.894 | 0.960 | 0.959 | leave-capture-out, 4 folds |
| DoS-ICMP vs DDoS-ICMP | 0.628 | 0.763 | 0.927 | 0.934 | leave-capture-out, 4 folds |
| MQTT-Connect | 0.760 | 0.953 | 0.982 | 0.988 | chronological, single capture (optimistic) |
| MQTT-Publish | 0.906 | 0.982 | 0.995 | 0.994 | chronological, single capture (optimistic) |

Balanced accuracy; 0.5 = not separable. Every DoS capture shows 1 attacker per block (TCP/IP DoS bursts of 10,000–19,000
packets); DDoS shows 3–4 attackers with median bursts of 2–39 packets.

§17 item 6, Decision Tree, same 20,000-per-class sample and hyper-parameters (`In [20]`):

| Feature set | Features | TEST variant macro-F1 | TEST family macro-F1 | TEST swap rate | VAL swap rate |
|---|---|---|---|---|---|
| (a) header only | 34 | 0.5168 | 0.6971 | 0.4574 | 0.3329 |
| (b) + 20-packet context (previous design) | 61 | 0.7961 | 0.8817 | 0.2103 | 0.1459 |
| (c) + long-horizon (deployed) | 69 | 0.8802 | 0.9696 | 0.1080 | 0.0203 |

Per pair, TEST swap (b) → (c): SYN 0.319 → 0.046, TCP 0.235 → 0.006, UDP 0.129 → 0.032, ICMP 0.219 → 0.126,
MQTT-Connect 0.056 → 0.0004, **MQTT-Publish 0.303 → 0.438**.

### 21.6 Selection and cost (VAL, CPU benchmark)

| Model | VAL macro-F1 | VAL worst-class recall | 1k-batch p95 (ms) | Throughput (pkt/s) | RAM (MB) | Disk (MB) | Final fit (s) | Composite (rank) |
|---|---|---|---|---|---|---|---|---|
| decision_tree | 0.9806 | 0.8936 | 3.6 | 812,166 | 17 | 0.11 | 78 | 0.9798 (1) |
| logreg | 0.9701 | 0.8859 | 16.0 | 301,699 | 27 | 0.01 | 615 | 0.9586 (2) |
| adaboost | 0.9652 | 0.8839 | 39.9 | 71,854 | 21 | 0.07 | 1,550 | 0.9349 (3) |
| xgboost | 0.9831 | 0.8983 | 102.3 | 8,271 | 123 | 7.97 | 153 | 0.8553 (4) |
| lightgbm | 0.9830 | 0.8982 | 140.3 | 8,341 | 56 | 7.74 | 626 | 0.8394 (5) |
| birnn | 0.9821 | 0.8949 | 166.0 | 5,975 | 310 | 0.46 | 2,721 | 0.7377 (6) |
| random_forest | 0.9825 | 0.8945 | 83.1 | 52,568 | 664 | 59.15 | 1,002 | 0.7103 (7) |
| transformer | 0.9823 | 0.8941 | 209.9 | 4,356 | 359 | 1.07 | 1,866 | 0.6813 (8) |

VAL worst class is DDoS-SYN for every model. Cost is measured on the Colab CPU; re-measure on the gateway (`In [16]`, `In [24]`).

### 21.7 Suggested next steps

Suggestions drawn from the findings above, not decisions the team has taken.

1. Decide on calibration (finding 5) and record the decision.
2. Investigate the DoS-ICMP and MQTT-DDoS-Publish test captures (finding 3), for the report. A window-level vote over
   one victim (section 16) is the cheapest way to test whether incident-level labels recover.
3. Decide whether to promote `run_c53a51becb` to `best_model/` (`FORCE_UPDATE_BEST = True`).
4. Re-benchmark the shortlisted models on the real gateway, then confirm or override the Decision Tree.
5. Run the standalone CLI on a real capture in a separate process (section 13, "Still not done").
6. Word the result as: "DoS vs DDoS is separable once attacker cardinality per victim is measured over ~1,000 packets on
   CICIoMT2024, for SYN, TCP, UDP and MQTT-Connect; DoS-ICMP and MQTT-Publish do not transfer to the test sessions."
