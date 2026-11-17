# IoMT PCAP Resource-Exhaustion Detector: Handoff Guide, Part 4

**Notebook:** `FYP_IoMT_PCAP_Detector.ipynb` (in Drive: `MyDrive/Colab Notebooks/`). This is the Part 4 notebook,
**executed on the real captures**: all 33 code cells ran in order (`In [1]`–`In [33]`) with no errors. Its code is
identical to the delivered Part 4 notebook.
**Current recorded run:** `run_c53a51becb`, the same run as Part 3 (`SETTINGS_HASH` 6173c20dcc; 60 captures; the
Decision Tree is selected and Platt-calibrated). §1–§20 reproduce Part 3's results exactly; for example, TEST variant
macro-F1 is again 0.8584 and the swap rate 0.1175. The Part 4 cells produced the evidence in **section 13**.
**Evidence package:** `part4_evidence_c53a51becb_p4-1.0_20261114T140037Z.zip` (5.7 MB), in
`MyDrive/FYP_IoMT_Detector/runs/run_c53a51becb/part4/`.
**Builds on:** Part 3 (`IoMT_PCAP_Detector_HANDOFF_part_3.md`, run `run_c53a51becb`). Read Part 3 first for the
pipeline, the features and the recorded results. Part 4 adds no new deployed model.
**Team:** Mohammad Haider Abbas (23i-2558), Hamd Ul Haq (23i-0081), Ayesha Ikram (23i-0109)

> **Part 4 in one paragraph.** Part 3 showed that victim-centric attacker counts over 1,024 packets fix DoS vs DDoS for
> four of six protocol pairs, but that evidence came from one sample, validation inside the training sessions, and a
> TEST set that had already been looked at. Part 4 makes the evidence harder to argue with. It (1) expands the
> history-length experiment to all six pairs, four history lengths, two counting methods and five seeds, with both
> confusion directions and per-capture results; (2) chooses the history length and feature set on **whole held-out
> training captures**, and freezes that choice in a file **before** TEST is scored; (3) investigates the two failing
> pairs as exploratory hypotheses only; (4) tests whether **source diversity** or **recording conditions** drive the
> DoS/DDoS decision, with a controlled replay now and a loader for real mixed recordings later; and (5) measures costs
> and writes one versioned evidence package.
>
> **Results in brief** (section 13 has the detail):
>
> * **Item 2.** Capture-disjoint validation, over 40 held-out training captures and before TEST was scored, **chose the
>   deployed design**: all 8 long-horizon features at 1,024 packets. Its mean wrong-scale share was 0.062, against
>   0.117 for the best single count (per-destination @ 1,024) and 0.221 for the previous design. MQTT could not be
>   selected, because no new sessions were added.
> * **Item 1.** Mean TEST swap over 5 seeds, previous design → deployed design:
>   * SYN 0.313 → 0.039, TCP 0.203 → 0.006, UDP 0.132 → 0.031, MQTT-Connect 0.060 → 0.000;
>   * **ICMP 0.238 → 0.164**: here a per-destination count alone does better on TEST (0.065);
>   * **MQTT-Publish 0.370 → 0.438**: it gets worse.
>
>   Counting per destination beats counting over the whole link at 1,024 packets for SYN, TCP, UDP and ICMP. The spread
>   over seeds is small (sd ≤ 0.05); the spread between captures is large.
> * **Item 3, exploratory.**
>   * **MQTT-DDoS-Publish TEST** has three attackers only in its first four blocks (about 10 s). After that, almost all
>     victim traffic comes from **one source**, and the model follows it, calling it DoS. This is a change in the
>     traffic pattern, not overfitting.
>   * **DoS-ICMP TEST** has one attacker throughout, but its victim **never replies**. In training, DoS-ICMP victims
>     replied (13–49 % of packets), while most DDoS-ICMP victims did not. The non-count features (`lh_dst_share`, the
>     rates) follow that cue, and calibration amplifies it.
> * **Item 4: inconclusive.** With 10 % benign traffic mixed in, even the *as-recorded* replay streams were misread far
>   more often than the same captures on TEST. The mixing or the role attribution, not attacker count, dominates. Next
>   step: a 0 % control (section 15). No real recordings were added.
> * **Item 5.**
>   * `build_features`: 47.5 ms per 20k-packet block at H = 1,024; history length adds about 5 ms.
>   * A 1,024-packet history covers about 48 s of benign traffic, 0.02–0.05 s of a TCP/IP flood and 0.03–0.49 s of
>     MQTT.
>   * The live pipeline runs at about 11,800 packets/s end to end on Colab (median), about 27,000 before incident
>     assembly.

**How this guide refers to the notebook.** `§N` is a notebook section. `In [k]` is the execution count after *Run all*
in the **Part 4 notebook**, which has **33 code cells**. Seven code cells now sit before §18, so Part 3's
`In [21]`–`In [24]` (§18–§20) are `In [28]`–`In [31]` here; `In [1]`–`In [20]` are unchanged.

---

## Contents

1. [What changed](#1-what-changed)
2. [How to run it](#2-how-to-run-it)
3. [The first §17b version and its recorded results (previously undocumented)](#3-the-first-17b-version-and-its-recorded-results-previously-undocumented)
4. [§17b: history length, counting method and capture-disjoint selection (items 1–2)](#4-17b-history-length-counting-method-and-capture-disjoint-selection-items-12)
5. [§17c: failure investigation (item 3)](#5-17c-failure-investigation-item-3)
6. [§17d: independent mixed-traffic test (item 4)](#6-17d-independent-mixed-traffic-test-item-4)
7. [§21: costs and evidence package (item 5)](#7-21-costs-and-evidence-package-item-5)
8. [Output files and where they are in Drive](#8-output-files-and-where-they-are-in-drive)
9. [Part 4 settings](#9-part-4-settings)
10. [Notebook map and cell-by-cell changes](#10-notebook-map-and-cell-by-cell-changes)
11. [How it was tested](#11-how-it-was-tested)
12. [Limitations and honest-reporting notes](#12-limitations-and-honest-reporting-notes)
13. [Recorded run of Part 4: results](#13-recorded-run-of-part-4-results)
14. [Troubleshooting](#14-troubleshooting)
15. [Suggested next steps](#15-suggested-next-steps)

---

## 1. What changed

| Item (priority order) | Where | What it does |
|---|---|---|
| **1. History-length experiment, all six pairs** | §17b-1, §17b-3, §17b-4 (`In [21]`, `In [23]`, `In [24]`) | 6 pairs × {global, per-destination} source count × H ∈ {20, 64, 256, 1,024} plus two references, × **5 seeds**. VAL and TEST, **DoS→DDoS and DDoS→DoS separately**, mean ± sd over seeds, **per capture**. |
| **2. Capture-disjoint selection before TEST** | §17b-2 (`In [22]`) | k-fold over **whole training captures** for SYN, TCP, UDP and ICMP. The best candidate is frozen to `capture_disjoint_selection.json`. The cell never reads TEST. MQTT can only be selected on **new sessions** (folder hook). |
| **3. Failure investigation** | §17c (`In [25]`) | DoS-ICMP and MQTT-DDoS-Publish, block by block over time: source counts, bursts, destination mix, background, attribution check, predictions and feature shift. Four hypotheses, all labelled **exploratory**. |
| **4. Independent mixed-traffic test** | §17d-1, §17d-2 (`In [26]`, `In [27]`) | **Replay:** re-attributes TEST attack streams to 1, 2 or 4 synthetic attackers inside benign traffic. Does the predicted scale follow attacker count or the recording? **Real recordings:** the same metrics on labelled PCAPs you add later. Reports detection delay, packet-level false alarms and incident-level decisions. |
| **5. Costs and packaging** | §21-1, §21-2 (`In [32]`, `In [33]`) | Feature-extraction time and memory, time covered by each history, warm-up delay, stage-by-stage live throughput, then a manifest, code snapshot, file hashes and one zip. |
| Documentation | §1, §17 markdown; new §17b/§17c/§17d/§21 markdown | Revision note and pointers. |

**What did not change:** extraction, features, the deployed model and bundle, `CONFIG_HASH`, and every hashed setting.
No Part 4 setting is hashed. Running Part 4 never re-extracts or retrains the deployed models, and the run folder stays
`run_c53a51becb`, provided the data and §3 are unchanged.

---

## 2. How to run it

### On Colab (intended)

1. Upload `FYP_IoMT_PCAP_Detector_part4.ipynb` to Drive and open it in Colab with a **T4 GPU** runtime, as in Part 3.
2. Leave §3 alone. Any §3 change starts a new run on different packets and breaks the comparisons with Part 3.
3. **Optional inputs.** Both folders sit **next to** `CICIoMT2024`, never inside it; inside it, §4 would pick them up
   and change `CONFIG_HASH`.
   * new independent sessions for §17b-2, for example new MQTT recordings: `/content/drive/MyDrive/CICIoMT2024_new_sessions/`
     (section 4.4);
   * real labelled mixed-traffic recordings for §17d-2: `/content/drive/MyDrive/IoMT_mixed_recordings/` with a
     `labels.csv` (section 6.3).
4. *Runtime → Run all.* §1–§20 reload everything that Part 3 already computed: captures, trials, models, benchmarks,
   calibrator and the §17 ablations. Feature assembly and the TEST pass are recomputed, as before. The Part 4 cells
   then run.
5. Before the last cell (§21-2), **save the notebook** (*File → Save*) so the copy in the evidence zip matches what ran.

**Measured extra time (recorded run, Colab T4, 2 CPU cores):**

| Cell | Time |
|---|---|
| §17b-1 | seconds (the count features of the first §17b version were reloaded, because the cache name is unchanged) |
| §17b-2 | 642 s (4 folds × 3 seeds × 10 candidates; about 53 s per fold and seed) |
| §17b-3 | 683 s (5 seeds × 10 candidates; about 137 s per seed) |
| §17c | 46 s |
| §17d-1 | 35 s |
| §21 | not printed by the notebook |

That is about 25 minutes for §17b–§17d. Your earlier 1–1.5 hour guess was generous.

**Disconnects.** Every Part 4 cell saves its results as it goes and resumes:

| Cell | Resumes from | Recomputed when |
|---|---|---|
| §17b-1 | `reports/history_exp_counts_<run>_20-64-256-1024.npz` | the cache is missing |
| §17b-2 | `part4/reports/capture_disjoint_units.csv`, per (fold, seed) | model key, H grid, seeds, sample sizes or the set of new sessions change |
| §17b-3 | `part4/reports/history_exp_runs.csv` and `history_exp_per_capture.csv`, per seed | model key, H grid or sample size change |
| §17c | `part4/reports/failure_blocks.csv` and `failure_feature_sample.parquet` | model key, cases or block count change |
| §17d-1 | `part4/reports/replay_streams.csv` | model key or any replay setting changes |
| §17d-2, §21 | (recomputed; cheap) | always |

`capture_disjoint_selection.json` keeps its original `frozen_utc` when a re-run reaches the same choice with the same
folds and seeds, so the freeze time stays meaningful after a reconnect.

### Locally or in smoke mode

The same environment variables as Part 3 (`IOMT_DATA_DIR`, `IOMT_OUTPUT_DIR`, `IOMT_LOCAL_DIR`, `IOMT_SMOKE=1`), plus
`IOMT_NEW_SESSIONS_DIR`, `IOMT_MIXED_DIR` and `IOMT_NOTEBOOK_PATH` (section 9). In smoke mode `LONG_CONTEXT_N` is 256,
so the history grid is {20, 64, 256} and the reference is "all 8 long-horizon @ 256".

---

## 3. The first §17b version and its recorded results (previously undocumented)

Part 3 ended before this experiment, so its handoff does not describe it. It was three pasted code cells after §17
item 6, without a markdown heading, and it ran on `run_c53a51becb`. Part 4 **replaces** those cells (section 10). Its
saved outputs are recorded here so they are not lost.

**Design.** It used the Decision Tree with its tuned parameters frozen, and the §17 item 6 sample (seed 0, 20,000 per
class). It covered **two pairs only, TCP and MQTT-Publish**. It added one feature at a time to design (b), header +
20-packet context: a global or per-destination source count at H ∈ {20, 64, 256, 1,024}. The references were "none",
design (b), and "full", all 8 long-horizon features (deployed). Building the counts took 79 s. The new 1,024-packet
columns matched `lh_n_src` / `lh_fanin_dst` row for row, and the "none" and "full" rows reproduced §17 item 6 exactly
(MQTT-Publish TEST swap 0.3029 and 0.4375).

**TEST: share of each class put on the wrong scale** (seed 0, one sample):

| Candidate | TCP: DoS→DDoS | TCP: DDoS→DoS | TCP swap | MQTT-Pub: DoS→DDoS | MQTT-Pub: DDoS→DoS | MQTT-Pub swap |
|---|---|---|---|---|---|---|
| none (previous design) | 0.386 | 0.085 | 0.235 | 0.011 | 0.595 | 0.303 |
| global @ 20 | 0.386 | 0.085 | 0.235 | 0.010 | 0.595 | 0.303 |
| global @ 64 | 0.130 | 0.044 | 0.087 | 0.006 | 0.718 | 0.362 |
| global @ 256 | 0.035 | 0.024 | 0.030 | 0.007 | 0.772 | 0.390 |
| global @ 1,024 | 0.116 | 0.031 | 0.074 | 0.009 | 0.797 | 0.403 |
| per-destination @ 20 | 0.380 | 0.078 | 0.229 | 0.013 | 0.596 | 0.304 |
| per-destination @ 64 | 0.157 | 0.044 | 0.100 | 0.006 | 0.797 | 0.402 |
| per-destination @ 256 | 0.011 | 0.010 | 0.011 | 0.008 | 0.754 | 0.381 |
| per-destination @ 1,024 | 0.017 | 0.003 | 0.010 | 0.005 | 0.800 | 0.403 |
| all 8 long-horizon @ 1,024 (deployed) | 0.012 | 0.000 | 0.006 | 0.000 | 0.875 | 0.438 |

**VAL swap rate** (same runs): TCP 0.214 (none) → 0.123 (global @ 256) / 0.090 (per-destination @ 1,024) / 0.031 (full);
MQTT-Publish 0.024 (none) → 0.010 (per-destination @ 256) / 0.002 (full).

**Reading. These are exploratory: one seed, one sample, and the TEST set had already been looked at.**

* **TCP:** counting per destination over ≥ 256 packets removes almost all TCP DoS/DDoS swaps on TEST (0.235 → 0.011).
  Global counting helps less and is not monotonic: it is worse at 1,024 than at 256 (0.074 vs 0.030), as expected when
  unrelated hosts enter a longer link-wide window.
* **MQTT-Publish:** *every* source count makes TEST **worse** (0.303 → 0.36–0.44), entirely through DDoS read as DoS
  (0.595 → 0.72–0.88), while VAL **improves**. The features work inside the training session and fail on the test
  session. §17c tests the possible reasons.
* With the 8 long-horizon features, the most common TEST error of DDoS-TCP is **Benign**, not DoS-TCP, and for MQTT-DoS-Publish
  it is **MQTT-DoS-Connect**. The scale error is gone there, but a different error remains.

Part 4 re-does this experiment properly (section 4). When reporting, say that these TEST numbers were seen before the
capture-disjoint selection existed (section 12).

---

## 4. §17b: history length, counting method and capture-disjoint selection (items 1–2)

### 4.1 Candidates and the shared machinery (§17b-1, `In [21]`)

* **Model:** `EXP_MODEL = "decision_tree"`, the same family as §17 items 4–6, with the tuned parameters of
  `FINAL["decision_tree"]` frozen. If no Decision Tree was trained, it falls back to `ABL_MODEL`.
* **Counts:** `all_H<h>` is the number of distinct sources over all traffic in the last *h* packets; `dst_H<h>` is the
  number of distinct sources that sent to *this packet's destination* in the last *h* packets. Both are exact and causal,
  use the same engine as `rt.long_horizon_features`, and are computed per 20k-packet block as in training. They are
  matched to the FIT/VAL/TEST rows by (file id, packet number), so no packet is added, dropped or re-sampled. A check
  asserts that `all_H1024` = `lh_n_src` and `dst_H1024` = `lh_fanin_dst` on every row.
* **10 candidates** (`RUNS`): no count (design (b)) · global @ 20/64/256/1,024 · per-destination @ 20/64/256/1,024 ·
  all 8 long-horizon @ 1,024 (deployed, design (c)). The global and per-destination candidates add **one** column to
  design (b).
* **Seeds** (`model_seed`): `fit_model()` reads the global `RANDOM_STATE` when it is called. Part 4 swaps it for one fit
  (`RANDOM_STATE + seed`) and always restores it. Sample draws use a frozen copy (`P4_BASE_SEED`), so the swap never
  changes which packets are drawn.

### 4.2 Capture-disjoint selection (§17b-2, `In [22]`). This is item 2, and it runs first.

* **Folds over whole captures.** The pairs that have at least two training captures per class (SYN, TCP, UDP, ICMP) get
  k = min(4, smallest capture count) = **4 folds**. Captures are sorted by their number; fold *f* holds out captures
  *f*, *f + 4*, … of **every** DoS and DDoS class of these pairs. On the real data each fold holds out 10 captures: one
  per DoS class, one per DDoS-SYN/TCP and two per DDoS-UDP/ICMP (for example DDoS-UDP1 and DDoS-UDP5). Over the four
  folds that is **40 held-out capture units**: SYN 8, TCP 8, UDP 12, ICMP 12.
* **Training** uses the FIT packets of the retained captures, class-stratified (`ABLATION_ROWS_PER_CLASS` = 20,000 per
  class), including Benign and MQTT, whose single captures always stay in training. Early stopping, which the tree does
  not use but boosted models would, sees only the retained captures' VAL rows.
* **Scoring** uses **all** packets of each held-out capture, both its FIT and its VAL rows, up to
  `C_EVAL_ROWS_PER_CAPTURE` = 20,000 per capture. The unit is one capture: its **wrong-scale share**, the share of its
  packets predicted as the partner scale of the same protocol.
* **Criterion:** the mean wrong-scale share over all held-out capture units and `C_SEEDS` = 3 seeds, lower is better.
  Ties go to the lower worst capture. The table also shows the sd between captures, the worst capture and each pair.
* **Freeze:** the winner, the criterion, the folds, the seeds, the pairs that could and could not be selected, and
  `test_read_by_this_cell: false` are written to `part4/reports/capture_disjoint_selection.json`. §17b-3 asserts that
  the file exists before it scores TEST, and marks the frozen candidate with `*` and `preselected = True`.
* **The selection chooses an experimental configuration. It does not change the deployed detector.** If it picks
  something other than the deployed 8 features @ 1,024, the TEST row of the chosen candidate is the honest "method
  chosen without TEST" number for the report. Deploying it would mean changing `LONG_CONTEXT_N` and/or the feature
  set in §3, which is hashed, so it would mean a new run. That is a team decision.

### 4.3 The grid on the standard split (§17b-3, `In [23]`) and the report (§17b-4, `In [24]`)

* For each of the 5 seeds, one class-stratified sample is drawn (seed 0 = the §17 item 6 sample), all 10 candidates
  are trained, and each is scored on VAL and TEST. Per pair it records DoS→DDoS, DDoS→DoS, the swap rate, the most
  common wrong label of each side, and variant macro-F1. Per capture it records the wrong-scale share and the
  correct-variant share.
* **Reproduction check:** for seed 0, rows "none" and "full" must equal §17 item 6 rows (b) and (c) for all six pairs.
  A WARNING line is printed for any mismatch.
* **Tables:** mean ± sd over seeds for VAL and TEST, in both directions, plus a per-capture table (VAL tails of every
  training capture, and every TEST capture) for "none", the frozen choice, and "full".
* **Figures:**
  * `history_exp_test_both_directions.png` / `_val_`: one panel per pair; colour = counting method, line style =
    direction, error bars = sd over seeds, grey band = the frozen choice;
  * `history_exp_per_capture.png`: one line per capture (thick = TEST, dotted = VAL tails), per-destination count;
  * `capture_disjoint_selection.png`: the ranking from §17b-2, with the chosen candidate in orange.

**Seeds vs captures.** The sd over seeds measures model and sample variability on the **same** recordings, not
independence between recordings. Quote the per-capture spread and the capture-disjoint ranking for anything about new
sessions. TEST has only one capture per class, two for DDoS-UDP and DDoS-ICMP, so TEST alone cannot show
between-session spread.

### 4.4 MQTT: new sessions instead of within-capture validation

Each MQTT class has one training capture, so §17b-2 cannot hold out an MQTT session. Without new data, the JSON lists
MQTT-Connect and MQTT-Publish under `pairs_not_selectable`, and their §17b-3 results are **exploratory**.

**To make MQTT selectable,** record new sessions and put them in `CICIoMT2024_new_sessions/`, next to `CICIoMT2024`.
Name each file so a §4 label rule matches, for example `MQTT-DoS-Publish_session2.pcap` or
`MQTT-DDoS-Publish_lab2.pcapng`. Both scales of a pair are needed. Then re-run from §17b-1. The cell:

* skips files identical to a capture already used (fingerprint) and files that no rule matches;
* extracts them with the §5 code into the shared cache; they never enter `FILES`, so `CONFIG_HASH` and the models are
  unchanged;
* samples up to `NEW_SESSION_ROWS` = 20,000 eligible packets per session (same eligibility as training);
* trains on **all** training captures and scores each new session as one more held-out unit.

New TCP/IP sessions dropped there are used as extra units for their pairs too.

**What to record.** Each class needs an attacker population matching its scale (one attacking host for DoS, several
for DDoS) against an MQTT broker, with ordinary IoMT traffic running. Keep the attacker and victim IP addresses, which
§17d-2 can use as labels.

---

## 5. §17c: failure investigation (item 3)

`In [25]`. It covers every capture of DoS-ICMP/DDoS-ICMP and MQTT-DoS-Publish/MQTT-DDoS-Publish: **all** blocks of the
test captures and `INV_TRAIN_BLOCKS` = 12 evenly spaced blocks of each training capture. The model is the deployed one
when it is tabular (the Decision Tree), raw and calibrated.

**Per block** (`failure_blocks.csv`; one row per 20k-packet block, with minutes since capture start):

| Group | Columns |
|---|---|
| Source counts | `attackers_in_block` (sources with ≥ 1 % of the victim's protocol-matching traffic), `sources_to_victim_any`, `top_attacker_share` |
| Bursts | `burst_median`, `burst_p90` (runs of one source towards the victim) |
| Destination composition | `victim_share` (top destination's share of matching packets), `n_victims_ge1pct`, `reply_share` (victim → others) |
| Background | `background_share` (off-protocol packets) |
| Attribution check | `median_fanin_matched_only` (victim fan-in counting only protocol-matching packets), `share_fanin_inflated_by_background` (packets whose model fan-in `lh_fanin_dst` is larger than the attack-only fan-in) |
| Model inputs | medians of `lh_n_src`, `lh_fanin_dst`, `lh_peer_max`, `lh_pair_share_min` over eligible packets |
| Predictions | `share_true_*`, `share_partner_*`, `share_other_*` for raw and calibrated, over **every** eligible packet of the block |

**Feature shift** (`failure_feature_shift.csv`): the median and the KS distance of the test capture to the own-class and
to the partner-class training captures, for the 8 long-horizon features, the top-5 permutation features and a few
context features.

**How to read the four hypotheses** (printed per case):

| Hypothesis | Supported when | Contradicted when |
|---|---|---|
| **Changed traffic pattern** | the test capture's attackers per block, bursts or `lh_peer_max` look like the **partner's** training captures (for example DoS-ICMP test showing ≥ 2 attackers, or MQTT-DDoS-Publish test dominated by one publisher), and the wrong-scale share rises in the blocks where they do (Spearman over blocks) | the test capture's counts match its own class |
| **Background contamination** | high `background_share`, `sources_to_victim_any` well above `attackers_in_block`, many packets whose fan-in is inflated by non-attack sources | all three are near the training values |
| **Inaccurate attribution** | the victim changes between blocks or shares traffic (`victim_share` low, several victims ≥ 1 %), replies dominate, or model fan-in ≠ attack-only fan-in | one stable victim, and the model fan-in equals the attack-only fan-in |
| **Model overfitting** | the long-horizon features are **closer to the own class** (small KS to own, large to partner), yet most packets are predicted as the partner: the tree is using session-specific cues instead of attacker count | the features themselves have moved towards the partner (then it is a data change, not overfitting) |

Figures: `failure_timeline_<class>.png` has three rows over time: predictions; attackers per block and `lh_peer_max`;
background and fan-in inflation. `failure_attackers_train_vs_test.png` shows attackers per block for train vs test of
both classes.

**Rules.** These are hypotheses about a TEST result the team has already seen. Do **not** change `LONG_CONTEXT_N`,
features, thresholds or the model because of them. Confirm a hypothesis on new captures (§17b-2 hook, §17d-2). In
writing, call them "exploratory analysis of the test captures".

---

## 6. §17d: independent mixed-traffic test (item 4)

### 6.1 The question

Same-protocol DoS and DDoS in CICIoMT2024 differ in attacker count, but each scale was also recorded in its own
sessions. A model can therefore score well by recognising **recording conditions** (rates, timing, which session)
rather than **source diversity**. The two explanations make different predictions once attacker count and recording
are varied independently, and §17d does exactly that.

### 6.2 Controlled replay (§17d-1, `In [26]`): runs now

* **Source:** the TEST captures (sessions the model never trained on; evaluation only). For each pair and each recorded
  scale, `REPLAY_REPEATS` = 3 attack blocks are used. A block is used only if more than half of its packets match the
  protocol.
* **Roles in a block:** the victim is the top destination of protocol-matching packets; attackers are sources with
  ≥ 1 % of the victim's inbound matching traffic; attack packets go from an attacker to the victim; replies go from the
  victim to an attacker; everything else is "other" and excluded from the metrics.
* **Re-attribution** (only addresses change; headers, sizes, timing and TTL stay as recorded):
  * `k = "rec"`: as recorded (reference);
  * `k = 1`: every attack packet gets one synthetic address (collapses a DDoS);
  * `k = 2, 4`: attack packets are split into round-robin bursts of `B` ∈ {4, 32} packets over k synthetic addresses.
    For reference, real DDoS bursts have a median of 2–39 packets (Part 3, §21.5).
  * Replies are redirected to the attacker they answer, the most recent attack packet's sender.
  * Synthetic addresses are 32-bit keys that do not occur in the benign capture.
* **Benign embedding** (Benign TEST capture): a benign-only lead-in of 2 × `HISTORY_N` = 2,048 packets, so the
  detector warms up on benign traffic; benign packets mixed into the attack at `REPLAY_BG_SHARE` = 10 % (inserted at
  random positions, carrying the timestamp of the preceding attack packet); and a benign tail of `HISTORY_N` packets.
  Features are built causally over the whole stream, exactly as live.
* **Truth:** k ≥ 2 → DDoS of that protocol, k = 1 → DoS, `rec` → the file's label.

**Metrics per stream** (`replay_streams.csv`; `proba` = raw / calibrated):

| Metric | Definition |
|---|---|
| `share_pred_ddos` / `share_pred_dos` | share of attack packets predicted as the DDoS / DoS variant of the pair |
| `share_pred_truth_scale`, `share_pred_recorded_scale` | share predicted as the k-implied / the recorded variant |
| `attack_detected_share`, `protocol_correct_share` | attack packets flagged Attack (binary level) / with the right subtype |
| `benign_far_before`, `_during`, `_after` | benign packets flagged Attack: in the lead-in after warm-up, mixed into the attack, and in the tail |
| `delay_detect_packets` / `_seconds` | from attack onset to the end of the first window of 50 attack packets with ≥ 90 % flagged Attack |
| `delay_scale_packets` / `_seconds` | from onset to the first 50-attack-packet window whose majority is the k-implied variant (NaN = never) |
| `incident_window_correct_share` | majority variant per 500 attack packets: share of windows that are correct |
| `incident_final_decision` / `_correct` | majority variant over attack packets after the long history has filled (onset + `HISTORY_N`) |

**Reading** (`replay_verdict.csv`, per pair, raw model):

* `source_diversity_effect` = P(DDoS | k = 4) − P(DDoS | k = 1), averaged over both recordings. Ideal: **1**.
* `recording_effect` = P(DDoS | DDoS recording) − P(DDoS | DoS recording), averaged over k = 1, 2, 4. Ideal: **0**.
* The verdict is "follows attacker count" when the first is ≥ 0.5 and the second < 0.25, "follows recording
  conditions" in the reverse case, and "mixed / partial" otherwise. The thresholds are reading aids, not tests.
* Figure `replay_scale_vs_attackers.png`: one panel per pair; x = attacker count; the two recordings as two lines;
  hollow markers = as recorded; dashed step = the ideal source-diversity answer.

**Expect `benign_far_during` to be high.** Benign packets mixed into a flood see flood context, so the detector flags
them, as Part 3 limitation 7 explains. That number describes context, not a fault in the benign class. Quote
`benign_far_before` (and `_after`, which shows how long the flood context lingers) as false-alarm rates.

**Caveats.** This is semi-synthetic. A real multi-host attack also varies timing, TTL and per-host rates, and benign
traffic is mixed by packet share, not by its real arrival rate. A "follows attacker count" verdict shows that the
model *can* use source diversity on these packets. It does not show that real botnets look like this.

**Check the `rec` rows first; the recorded run shows why.** The as-recorded streams are the replay's sanity check.
Re-attribution has not touched them, so they should score close to the same captures on TEST. In `run_c53a51becb` they
did not:

| Recorded class | Replay, as recorded: share read as DDoS (deployed tree, raw) | TEST, same class: wrong-scale share (§17b grid, 8 long-horizon features, 5-seed mean) |
|---|---|---|
| DoS-TCP | 0.66 (should be near 0) | read as DDoS 0.012 |
| DoS-ICMP | 0.56 | read as DDoS 0.318 |
| MQTT-DoS-Publish | 0.68 (should be near 0) | read as DDoS 0.000 |
| DDoS-SYN | 0.31 (should be near 1) | read as DoS 0.058 |
| DDoS-TCP | 0.65 (should be near 1) | read as DoS 0.000 |

Something in the replay construction itself changes the decision. Two candidates, not yet separated:

1. **The 10 % benign mixing.** Benign hosts add to `lh_n_src` and dilute `lh_dst_share`. The training attack captures
   had less than 2 % background.
2. **Per-block role attribution.** The very wide error bars and the `attack_detected_share` of exactly 0.667 (for
   example SYN and TCP DDoS) suggest that in one of the three blocks the "attack" packets were not the flood.

Until a control separates them (section 15), **the verdict table cannot be read as source diversity vs recording**.

The benign tail is `HISTORY_N` packets long, so every tail packet still has attack traffic in its history.
`benign_far_after` therefore measures how long the flood context lingers, not a steady-state false-alarm rate.

### 6.3 Real labelled recordings (§17d-2, `In [27]`): runs when you add them

Put PCAP/PCAPNG files and a `labels.csv` in `/content/drive/MyDrive/IoMT_mixed_recordings/`:

```
file,true_variant,n_attackers,attacker_ips,victim_ip,attack_start,attack_end,scenario
syn_1host.pcap,DoS-SYN,1,192.168.1.50,192.168.1.10,1767225600.0,1767225900.0,SYN one host
syn_4hosts.pcap,DDoS-SYN,4,192.168.1.50;192.168.1.51;192.168.1.52;192.168.1.53,192.168.1.10,,,SYN four hosts
```

* `true_variant`: one of the 12 attack variants. Use your own definition of scale, for example DDoS when
  `n_attackers` ≥ 2.
* `attacker_ips`: `;`-separated. `victim_ip`: optional; empty means any destination. `attack_start` / `attack_end`:
  optional epoch seconds; empty means the whole file.
* A packet is **attack** when an attacker sends it to the victim inside the window, **reply** when the victim answers
  an attacker inside the window, **benign** when neither endpoint is an attacker, and **other** otherwise (excluded).
  IPv4 addresses are matched with the same 32-bit key that `decode_records` uses.
* Up to `MIXED_MAX_PACKETS` = 2 M packets per file are streamed through `StreamFeaturizer` in 20k batches, exactly as
  live, and the §17d-1 metrics are computed (`real_mixed_recordings.csv`).

**Suggested recording protocol:** one victim (an IoMT device or the MQTT broker), with benign IoMT traffic running
throughout. For each protocol, record 1, 2 and 4 attacking hosts. Use the **same** attacking machines, and switch hosts
on or off between scenarios, so that recording conditions are held constant while the attacker count changes. Leave a
few minutes of benign-only traffic before each attack and note the attack start time. If the scale follows the attacker
count here, item 4 is answered on real traffic.

---

## 7. §21: costs and evidence package (item 5)

### 7.1 Costs (§21-1, `In [32]`)

Measured on the runtime that runs the notebook. Re-measure on the gateway before quoting deployment numbers.

| Output | What is measured |
|---|---|
| `cost_feature_extraction.csv` (+ `_blocks`) | Per 20k-packet block, median of 3 runs on `COST_BLOCKS` = 8 TEST blocks, at each H: `build_features` (all 74), header + context only, the 8 long-horizon features alone, the global count alone, the per-destination count alone; µs per packet; **peak memory** of `build_features` (`tracemalloc`) |
| printed `CARRY` | live carry-over of `StreamFeaturizer`: `HISTORY_N` raw packets, in KiB and bytes per packet |
| `cost_history_time_covered.csv` | for every capture and H: seconds between packet *i − H + 1* and *i* (p10 / median / p90 over packets), and the implied packets/s. **This answers "how much real time does a 1,024-packet history cover?"** per class |
| `cost_warmup_delay.csv` | at the true start of each capture (block 0): seconds until `CONTEXT_N` and `HISTORY_N` packets have been seen, and the steady-state span for comparison |
| `cost_pipeline_throughput.csv` | first `PIPE_PACKETS` = 20,000 packets of every TEST capture, batch 1,000: µs per packet for **read, decode, features, model, calibration**; packets/s over these stages; **end-to-end** packets/s with `predict_pcap_stream` (incident JSON included); peak RAM |
| figures | `cost_history_time_covered.png` (median and p10–p90 band per family vs H), `cost_pipeline_stages.png` |

Expect the same 1,024 packets to cover far more time on quiet benign traffic than inside a flood; the table gives the real figures per class. That is why
the warm-up and time-covered tables belong next to any claim about detection delay.

### 7.2 Evidence package (§21-2, `In [33]`)

* `part4_manifest.json`:
  * the run, settings and protocol hashes, the runtime and feature versions, `CONTEXT_N` / `LONG_CONTEXT_N` /
    `HISTORY_N`, the selected model and the bundle path;
  * library versions and hardware;
  * **every Part 4 setting** and the frozen selection;
  * SHA-256 of `iomt_runtime.py`, `iomt_inference.py` and `iomt_torch_models.py`, and of **every output file**.
* `part4_config.json`: the Part 4 settings alone.
* `part4_code_snapshot.py`: every Part 4 cell **exactly as it ran**, taken from the IPython input history (cells that
  start with `# [P4]`; the last execution of each wins).
* `notebook_snapshot.ipynb`: a copy of the notebook if it is found in `MyDrive/Colab Notebooks/` or `MyDrive/`, or at
  `IOMT_NOTEBOOK_PATH`. Otherwise download it (*File → Download .ipynb*) and keep it with the zip.
* **`part4_evidence_<run>_<version>_<utc>.zip`**: all of `part4/` plus the three runtime modules. This is the one file
  to share.
* A headline block prints the frozen choice, the TEST swap per pair (previous design / frozen choice / deployed), the
  replay verdicts and the main costs.

`P4_VERSION` (`p4-1.0`) is stored in every key and output. Bump it in §17b-1 whenever a Part 4 cell changes, so old
results are never mixed with new code.

---

## 8. Output files and where they are in Drive

All Part 4 outputs go to one folder. With the default paths and unchanged data and settings, that folder is:

**`/content/drive/MyDrive/FYP_IoMT_Detector/runs/run_c53a51becb/part4/`**
(in the Drive web UI: *My Drive › FYP_IoMT_Detector › runs › run_c53a51becb › part4*)

If you changed `OUTPUT_DIR`, the data or §3, the run folder is `runs/run_<CONFIG_HASH>/part4/`; §17b-1 prints the exact
path.

### Share these

| # | File (inside `part4/`) | Why |
|---|---|---|
| ★ | **`part4_evidence_c53a51becb_p4-1.0_20261114T140037Z.zip`** (5.7 MB) | Everything below plus the modules, in one file |
| 1 | `reports/capture_disjoint_selection.json` | The pre-registered choice, frozen before TEST |
| 2 | `reports/capture_disjoint_summary.csv`, `figures/capture_disjoint_selection.png` | Selection evidence on held-out captures |
| 3 | `reports/history_exp_summary.csv` | Item 1: 6 pairs × candidates, both directions, mean/sd/min/max over 5 seeds, VAL and TEST |
| 4 | `reports/history_exp_per_capture_mean.csv`, `figures/history_exp_per_capture.png` | Item 1: per-capture results |
| 5 | `figures/history_exp_test_both_directions.png`, `figures/history_exp_val_both_directions.png` | Item 1: main figures |
| 6 | `reports/failure_capture_summary.csv`, `reports/failure_feature_shift.csv`, `figures/failure_timeline_DoS-ICMP.png`, `figures/failure_timeline_MQTT-DDoS-Publish.png`, `figures/failure_attackers_train_vs_test.png` | Item 3 (exploratory) |
| 7 | `reports/replay_verdict.csv`, `reports/replay_summary.csv`, `figures/replay_scale_vs_attackers.png` | Item 4: replay |
| 8 | `reports/real_mixed_recordings.csv` | Item 4: real traffic. **Not produced in this run** (no recordings yet) |
| 9 | `reports/cost_feature_extraction.csv`, `cost_history_time_covered.csv`, `cost_warmup_delay.csv`, `cost_pipeline_throughput.csv`, `figures/cost_*.png` | Item 5: costs |
| 10 | `part4_manifest.json`, `part4_config.json`, `part4_code_snapshot.py` (9 Part 4 cells), `notebook_snapshot.ipynb` | Item 5: exact version |

`notebook_snapshot.ipynb` was copied from `/content/drive/MyDrive/Colab Notebooks/FYP_IoMT_PCAP_Detector.ipynb`
(modified 14:00:22 UTC, 15 s before the zip). Colab had not yet saved the §21-2 cell's own output into it, so share the
**executed notebook** as well. It is the file this guide was written from, `FYP_IoMT_PCAP_Detector.ipynb` in
`MyDrive/Colab Notebooks/`.

### Raw files (in the zip, for audit and re-analysis; no need to send them separately)

`reports/capture_disjoint_units.csv` (every held-out capture × candidate × fold × seed), `reports/history_exp_runs.csv`
(every pair × candidate × seed × partition), `reports/history_exp_per_capture.csv` (per seed),
`reports/failure_blocks.csv`, `reports/failure_feature_sample.parquet`, `reports/replay_streams.csv`,
`reports/cost_feature_extraction_blocks.csv`.

### Not part of the package

`runs/run_c53a51becb/reports/history_exp_counts_c53a51becb_20-64-256-1024.npz` is a rebuildable cache of the count
features, shared with the first §17b version. `runs/run_c53a51becb/reports/history_window_experiment.csv` and
`figures/history_window_experiment.png` are the **first** §17b version's outputs (section 3). Keep them; the new cells
do not overwrite them.

---

## 9. Part 4 settings

All are set at the top of their cell. **None is hashed.**

| Setting | Cell | Default | Notes |
|---|---|---|---|
| `P4_VERSION` | §17b-1 | `"p4-1.0"` | Bump when any Part 4 cell changes |
| `EXP_MODEL` | §17b-1 | `"decision_tree"` (else `ABL_MODEL`) | Tuned parameters frozen |
| `H_GRID` | §17b-1 | `[20, 64, 256, 1024]` (values ≤ `HISTORY_N`) | Every target has this much history inside its block |
| `EXP_SEEDS` | §17b-1 | `[0, 1, 2, 3, 4]` | Seed 0 reproduces §17 item 6 |
| `C_SEEDS` | §17b-1 | `[0, 1, 2]` | Seeds for the capture-disjoint selection |
| `C_EVAL_ROWS_PER_CAPTURE` | §17b-1 | `20_000` | Held-out packets scored per capture |
| `ABLATION_ROWS_PER_CLASS` | §3 (existing) | `20_000` | Training sample per class. Not hashed, but changing it breaks the seed-0 reproduction of §17 item 6 |
| `NEW_SESSIONS_DIR` | §17b-2 | `<parent of DATA_DIR>/CICIoMT2024_new_sessions` (env `IOMT_NEW_SESSIONS_DIR`) | Must not be inside `DATA_DIR` |
| `NEW_SESSION_ROWS` | §17b-2 | `20_000` | Eligible packets per new session |
| `INV_CASES` | §17c | `["DoS-ICMP", "MQTT-DDoS-Publish"]` | Their pairs are investigated |
| `INV_TRAIN_BLOCKS` | §17c | `12` | Blocks per training capture (test captures: all) |
| `INV_SAMPLE_PER_BLOCK` | §17c | `400` | Packets per block kept for the KS comparison |
| `REPLAY_KS` | §17d-1 | `["rec", 1, 2, 4]` | Synthetic attacker counts |
| `REPLAY_BURSTS` | §17d-1 | `[4, 32]` | Burst length per synthetic attacker |
| `REPLAY_BG_SHARE` | §17d-1 | `0.10` | Benign packets mixed into the attack |
| `REPLAY_REPEATS` | §17d-1 | `3` | Attack blocks per pair and recorded scale |
| `REPLAY_PRE`, `REPLAY_POST` | §17d-1 | `2 × HISTORY_N`, `HISTORY_N` | Benign lead-in / tail |
| `DETECT_WINDOW`, `DETECT_FRAC` | §17d-1 | `50`, `0.9` | Detection-delay rule |
| `INCIDENT_WINDOW` | §17d-1 | `500` | Attack packets per incident decision |
| `MIXED_DIR` | §17d-2 | `<parent of DATA_DIR>/IoMT_mixed_recordings` (env `IOMT_MIXED_DIR`) | Holds the PCAPs and `labels.csv` |
| `MIXED_MAX_PACKETS` | §17d-2 | `2_000_000` | Per file |
| `COST_BLOCKS`, `COST_REPEATS` | §21-1 | `8`, `3` | Feature-timing sample |
| `PIPE_PACKETS`, `PIPE_BATCH` | §21-1 | `20_000`, `1000` | Live-throughput sample |
| `P4_NOTEBOOK_PATH` | §21-2 | env `IOMT_NOTEBOOK_PATH` | Explicit notebook path for the copy |

---

## 10. Notebook map and cell-by-cell changes

| Notebook § | Code cell | Status | Writes / leaves in memory |
|---|---|---|---|
| §1 markdown | – | revision note added | – |
| §2–§17 | `In [1]`–`In [20]` | unchanged (saved outputs kept) | as in Part 3 |
| §17 markdown | – | pointer to Part 4 added | – |
| **§17b markdown** | – | new | – |
| §17b-1 | `In [21]` | **replaces** the first §17b "CELL 1" | `P4_DIR`, `P4`, `EXP_*`, `H_GRID`, `NEWF`, `RUNS`, `RUN_LABEL`, `run_matrix`, `model_seed`, `fit_seeded`, `per_capture_rows`, `PART_OF` |
| §17b-2 | `In [22]` | new | `NEWS`, `FOLDS`, `CD`, `CD_SUMMARY`, `CHOSEN`, `SELECTION_P4`; `capture_disjoint_*` |
| §17b-3 | `In [23]` | **replaces** "CELL 2" | `EXP`, `EXP_CAP`; `history_exp_runs.csv`, `history_exp_per_capture.csv` |
| §17b-4 | `In [24]` | **replaces** "CELL 3" | `HIST_SUMMARY`, `CAP_MEAN`; summaries and figures |
| **§17c** | `In [25]` | new | `INV`, `INV_S`, `INV_CAPS`, `INV_EVID`; `failure_*` |
| **§17d-1** | `In [26]` | new | `REPLAY`, `RS`, `REPLAY_VERDICT`, `stream_metrics`, `predict_stream`; `replay_*` |
| **§17d-2** | `In [27]` | new | `MIXED`; `real_mixed_recordings.csv` |
| §18–§20 | `In [28]`–`In [31]` | unchanged (Part 3's `In [21]`–`In [24]`) | as in Part 3 |
| **§21-1** | `In [32]` | new | `COST_FX`, `COST_FX_SUM`, `CARRY`, `COST_SPAN`, `COST_WARM`, `COST_PIPE`; `cost_*` |
| **§21-2** | `In [33]` | new | `MANIFEST_P4`; manifest, config, snapshot, zip |

Changes compared with the first §17b version:

* All six pairs, not two.
* 5 seeds, varying both the sample and the model `random_state`, instead of seed 0 only.
* Per-capture results.
* Selection on whole held-out captures, frozen before TEST.
* Outputs go to `part4/` with a cache key, and resume.
* Both directions are tabulated and plotted.
* The reproduction check covers all six pairs.
* The markdown heading has been added, and the "paste these cells" instructions removed.

§21 sits after §20 because it needs the saved bundle and the §19 live engine.

---

## 11. How it was tested

The real captures are not available here, so testing used **synthetic CICIoMT-style captures**. The generator is not
part of the deliverable. They covered:

* all 13 classes, train and test;
* **three training sessions per TCP/IP class**, so §17b-2 forms real folds;
* about 4 % background traffic;
* single-attacker DoS and four-attacker DDoS with bursts of 8–40 packets;
* four new MQTT sessions in `CICIoMT2024_new_sessions/`;
* two labelled mixed recordings (SYN with 1 and 4 attackers, 15 % benign) in `IoMT_mixed_recordings/`.

The notebook ran in smoke mode (`IOMT_SMOKE=1`, `LONG_CONTEXT_N` = 256) with `MODELS_TO_RUN` reduced to logreg and the
Decision Tree in the test copy only.

**Checks that passed:**

* **The whole notebook ran end to end with no error**, all 33 code cells, including every Part 4 cell, §18–§20, the
  benchmark subprocesses and the live engine.
* **Alignment:** the H = `LONG_CONTEXT_N` count columns equal `lh_n_src` / `lh_fanin_dst` on every row.
* **Reproduction:** with `EXP_MODEL` set equal to `ABL_MODEL`, the seed-0 "none" and "full" rows reproduced §17 item 6
  rows (b) and (c) **exactly for all six pairs**.
* **§17b-2:** 3 folds × 3 seeds over 24 held-out training captures, plus the new MQTT sessions as extra units. The JSON
  was frozen with `test_read_by_this_cell: false`, and §17b-3 read it and marked the preselected rows.
* **Resume:** a second run reloaded every seed and fold and repeated nothing.
* **§17c:** every block of the test captures and 12 per training capture; the four hypothesis lines and the KS table
  printed. On the synthetic data the test captures match their own class, so no hypothesis is supported, as built.
* **§17d-1:** 6 pairs × 2 recorded scales × 3 blocks × 6 attributions = 216 streams per probability type. The
  synthetic model "follows attacker count" for every pair (diversity effect 0.92–0.99, recording effect ≈ 0), as the
  synthetic data were built.
* **§17d-2:** both labelled recordings were loaded, labelled by attacker IP and scored.
* **§21-1/§21-2:** every cost table; a code snapshot of all 9 Part 4 cells; a manifest with file hashes; the zip.
* **Figures:** inspected for layout (legends, labels, error bars, the frozen-choice band).
* **Format:** the notebook passes `nbformat` validation, and every cell has an id.

**Fixed during testing:**

* a loop variable named `gc` shadowed the `gc` module (renamed);
* a syntax error in a `next(...)` default;
* §17b-2 now holds out captures by **file id** instead of capture name. It is faster on 2.6 M rows, and a train and a
  test capture can share a name (for example `TCP_IP-DDoS-ICMP1` exists in both splits).

**The synthetic numbers say nothing about real performance**, just as Part 3's synthetic ≈ 0.999 did not predict the
real 0.764.

### The real-data run

`run_c53a51becb` ran all 33 code cells on the 60 real captures with no errors. It exercised what the smoke test could
not:

* the count cache from the first §17b version was reloaded, and the alignment check passed on every FIT, VAL and TEST
  row;
* §17b-2 ran 4 real folds of 10 held-out captures each (40 units);
* the seed-0 reproduction check matched §17 item 6 for all six pairs: no WARNING line was printed;
* §17c read every block of the 5 test captures and 12 blocks of each of the 14 training captures of the two pairs;
* the §21 pipeline measurement streamed 20,000 packets of each of the 15 TEST captures through the saved bundle;
* the evidence zip was written, and the notebook copy was found automatically.

§18–§20 reproduce Part 3 exactly. The new-session hook (§17b-2) and the real-recording loader (§17d-2) found no input
and skipped cleanly.

**Not done:** any real new MQTT session or real mixed recording; the replay control at 0 % background (section 15);
costs on the gateway.

---

## 12. Limitations and honest-reporting notes

1. **TEST has been seen.** The first §17b version (section 3) and Part 3 already showed TEST results for TCP and
   MQTT-Publish and all pairs. From Part 4 on the selection is frozen in code before TEST is scored, but the people
   designing the candidates had seen TEST. Say so in the report, for example: *"The candidate set was fixed after an
   exploratory analysis that included the test captures; the choice among candidates was made on held-out training
   captures and frozen before the final test evaluation."*
2. **MQTT cannot be validated on independent sessions** without new recordings. Until then, every MQTT conclusion is
   exploratory.
3. **TEST is small in sessions:** one capture per class (two for DDoS-UDP/ICMP). Per-capture TEST results are single
   observations. The 40 capture-disjoint units in §17b-2 are the better evidence for session-to-session variation.
4. **Seeds are not independent experiments** (section 4.3).
5. **§17c is exploratory** (section 5). It must not feed back into settings.
6. **The replay is semi-synthetic** (section 6.2). Only real recordings with controlled attacker populations (§17d-2)
   answer item 4 for real traffic.
7. **`benign_far_during` is high by design:** benign packets inside a flood are flagged because of flood context (Part
   3 limitation 7). Report `benign_far_before` / `_after` as false-alarm rates.
8. **Costs are Colab numbers.** Re-measure on the gateway.
9. **A selection different from the deployed feature set does not change the bundle.** Deploying it is a hashed change
   and a new run (section 4.2).
10. **The Decision Tree's `random_state`** affects only tie-breaking between equally good splits, because it considers
    every feature. Most seed-to-seed spread therefore comes from the sample draw.
11. **The replay at 10 % background fails its own sanity check** (section 6.2). Its verdict table must not be quoted
    as evidence either way on item 4.
12. **Capture-disjoint and TEST disagree on ICMP.** On held-out training captures the 8 features beat the
    per-destination count for ICMP (0.075 vs 0.163); on the single DoS-ICMP test capture the order reverses. Report
    both; the capture-disjoint ranking is the pre-registered evidence and uses 12 ICMP sessions instead of 3.
13. **The §21 peak-RAM column is the whole notebook process** (about 6.3–7.4 GB, mostly the data already in memory),
    and the measured increase during streaming is about 0. It says nothing about the detector's footprint on a gateway;
    run `iomt_inference.py` alone there to measure it.

---

## 13. Recorded run of Part 4: results

Every number is read from the saved outputs of the executed notebook (`run_c53a51becb`, `In [21]`–`In [33]`). The only
derived values are simple medians across rows of printed tables. **TEST is reported, never used to select.** MQTT rows
are exploratory (section 4.4).

### 13.1 Capture-disjoint selection (§17b-2, `In [22]`): chosen before TEST

* **Folds:** 4. Each holds out 10 training captures: one per DoS class, one per DDoS-SYN/TCP, and two per DDoS-UDP/ICMP.
  For example, fold 0 holds out DoS-*1, DDoS-SYN1, DDoS-TCP1, DDoS-UDP1 + 5 and DDoS-ICMP1 + 5. That makes **40
  capture units**, scored with 3 seeds.
* **New sessions:** none found. **Not selectable:** MQTT-Connect, MQTT-Publish.

| Candidate | Mean wrong-scale share | sd between captures | Worst capture | SYN | TCP | UDP | ICMP |
|---|---|---|---|---|---|---|---|
| **all 8 long-horizon @ 1,024 (deployed) ← frozen** | **0.062** | 0.093 | 0.339 | 0.090 | 0.078 | 0.020 | 0.075 |
| per-destination count @ 1,024 | 0.117 | 0.120 | 0.430 | 0.193 | 0.089 | 0.038 | 0.163 |
| per-destination count @ 256 | 0.136 | 0.140 | 0.473 | 0.229 | 0.141 | 0.036 | 0.170 |
| per-destination count @ 64 | 0.163 | 0.166 | 0.582 | 0.267 | 0.155 | 0.047 | 0.214 |
| global count @ 256 | 0.170 | 0.155 | 0.690 | 0.267 | 0.187 | 0.066 | 0.199 |
| global count @ 1,024 | 0.175 | 0.154 | 0.651 | 0.270 | 0.228 | 0.082 | 0.167 |
| global count @ 64 | 0.186 | 0.160 | 0.608 | 0.295 | 0.195 | 0.074 | 0.220 |
| per-destination count @ 20 | 0.216 | 0.166 | 0.648 | 0.289 | 0.254 | 0.106 | 0.251 |
| global count @ 20 | 0.221 | 0.171 | 0.656 | 0.318 | 0.254 | 0.108 | 0.247 |
| no source count (previous design) | 0.221 | 0.171 | 0.655 | 0.318 | 0.254 | 0.108 | 0.247 |

**Reading.**

* On unseen training sessions the **deployed design is the best candidate**, and it is best for every TCP/IP pair. So
  the Part 3 design choice is now confirmed by a selection that never saw TEST.
* Among the single counts, counting **per destination** beats counting over the whole link at every history length.
* Longer history helps per-destination counting monotonically: 0.216 → 0.163 → 0.136 → 0.117.
* "global @ 20" adds nothing to the previous design, as expected: it is the same quantity as `ctx_n_src`.
* The spread between captures is large (sd 0.093, worst 0.339): some sessions are much harder than others. Which
  capture is worst is in `capture_disjoint_units.csv`.
* The freeze time is `frozen_utc` in `capture_disjoint_selection.json`.

### 13.2 History grid on the standard split (§17b-3/-4, `In [23]`–`In [24]`): item 1

Five seeds; the seed-0 reproduction of §17 item 6 was exact for all six pairs.

**TEST swap rate, mean ± sd over 5 seeds**

| Pair | Previous design | **Frozen = deployed (8 lh @ 1,024)** | per-destination @ 1,024 | global @ 1,024 | Frozen: DoS→DDoS / DDoS→DoS |
|---|---|---|---|---|---|
| SYN | 0.313 ± 0.007 | **0.039 ± 0.005** | 0.086 ± 0.003 | 0.143 ± 0.010 | 0.019 / 0.058 |
| TCP | 0.203 ± 0.042 | **0.006 ± 0.002** | 0.013 ± 0.004 | 0.070 ± 0.008 | 0.012 / 0.000 |
| UDP | 0.132 ± 0.002 | **0.031 ± 0.001** | 0.086 ± 0.002 | 0.132 ± 0.003 | 0.010 / 0.051 |
| ICMP | 0.238 ± 0.029 | **0.164 ± 0.049** | 0.065 ± 0.006 | 0.105 ± 0.021 | **0.318** / 0.010 |
| MQTT-Connect (exploratory) | 0.060 ± 0.004 | **0.000 ± 0.000** | 0.031 ± 0.003 | 0.024 ± 0.002 | 0.001 / 0.000 |
| MQTT-Publish (exploratory) | 0.370 ± 0.039 | **0.438 ± 0.002** | 0.408 ± 0.005 | 0.409 ± 0.011 | 0.000 / **0.876** |

**VAL swap rate, previous design → frozen:** SYN 0.222 → 0.055, TCP 0.215 → 0.032, UDP 0.079 → 0.005, ICMP 0.212 →
0.022, MQTT-Connect 0.083 → 0.001, MQTT-Publish 0.028 → 0.002. On VAL the frozen design is best for every pair.

**Per capture, frozen design** (mean over seeds):

* **TEST captures:**
  * MQTT-DDoS-Publish **0.876**, DoS-ICMP **0.318**, DDoS-UDP2 0.089, DDoS-SYN 0.058;
  * every other TEST capture ≤ 0.019.
* **VAL tails of the 44 DoS/DDoS training captures:**
  * DDoS-SYN4 **0.390** and DDoS-TCP2 **0.244**;
  * every other ≤ 0.063.
  * Under the previous design the same tails ranged from 0.013 to 0.735.

**Reading.**

* The design's gain holds over five seeds for SYN, TCP, UDP and MQTT-Connect. The sd over seeds is at most 0.049
  (ICMP), much smaller than the differences between candidates.
* The spread between captures is far larger than the spread between seeds. A few sessions (DDoS-SYN4, DDoS-TCP2 and
  the two failing TEST captures) carry most of the remaining error, so the honest unit of evidence is the capture.
* **ICMP:** the deployed set is worse on TEST than a per-destination count alone (0.164 vs 0.065). Almost all of the
  difference is DoS-ICMP read as DDoS (0.318 vs 0.076), from the single DoS-ICMP test capture. The capture-disjoint
  ranking (12 ICMP sessions) says the opposite. See section 12, item 12, and §17c below.
* **MQTT-Publish:** every source count makes TEST worse, through DDoS read as DoS (0.729 with no count, up to 0.81 with one count and 0.88 with all 8). VAL improves.
  §17c explains why.

### 13.3 Failure investigation (§17c, `In [25]`): item 3, EXPLORATORY

| Evidence | DoS-ICMP TEST capture | MQTT-DDoS-Publish TEST capture |
|---|---|---|
| Blocks / duration | 50 blocks, about 36.5 min | 43 blocks, about 2.2 min |
| Attackers per block (median), test vs own train vs partner train | **1 / 1 / 3** | **1 / 3 / 1** |
| Over time | 1 attacker in every block | **3 attackers in the first 4 blocks (about 10 s), then 1** (2 briefly, around 0.2 min and 0.5–0.75 min) |
| Burst p90 towards the victim | 19,864 (one sender) | **3,702** vs 85 in own training (one long sender) |
| Victim share / reply share, test | **1.000 / 0.000: the victim never replies** | 0.536 / 0.463 (as in training) |
| Same, own-class training | 0.506–0.874 / 0.126–0.494 (the victim replied) | 0.575 / 0.421 |
| Partner (DDoS-ICMP) training | 5 of 8 captures with reply share ≤ 0.007 (no replies) | – |
| Background share | 0.001 (one late block 0.53) | 0.000 |
| Packets whose fan-in counts non-attack sources | 5.4 % | 0.0 % |
| Model fan-in vs attack-only fan-in | 1 vs 1 | 1 vs 1 |
| Long-horizon features closer (KS) to the partner's training | 3 of 8: `lh_dst_share`, `lh_log_pair_rate`, `lh_fanout_src`. The attacker-count features `lh_fanin_dst`, `lh_peer_max` and `lh_pair_share_min` are closer to its own class (KS 0.17–0.42 vs 0.70–0.88) | **8 of 8** (KS to the partner 0.02–0.13, to its own class 0.34–0.89) |
| Predictions (median over blocks) | raw: 0.729 correct / 0.271 DDoS; **calibrated: 0.269 correct / 0.731 DDoS** | raw and calibrated: 0.001 correct / 0.999 DoS |
| Predictions over time | ≥ 0.87 correct in the first 2 min, 0.5–0.8 at 16–22 min, 0.24–0.53 in three blocks at about 34.5 min | correct (≈ 1.0) in the first 4 blocks, then DoS (≥ 0.82, mostly ≥ 0.95) |
| Spearman (attackers, share predicted as partner) | n/a (attacker count constant) | **−0.61** |

**Reading (hypotheses, not conclusions):**

* **MQTT-DDoS-Publish: changed traffic pattern, strongly supported.**
  * After its first ~10 s, the test capture is a single-publisher flood by every attacker-count measure, and all 8
    long-horizon features match the DoS training session.
  * The model calls it DoS from the moment the extra attackers disappear. It follows source diversity, exactly as
    designed.
  * Background contamination and attribution errors are ruled out (0 % inflation; model fan-in equals attack-only
    fan-in).
  * Overfitting is not indicated: the features themselves moved.
  * By the source-diversity definition the prediction is arguably right, and the file label describes the scenario,
    not the traffic.
* **DoS-ICMP: a changed victim behaviour combined with the model using non-count cues.**
  * Attacker count says DoS throughout, and background and attribution are clean.
  * But the test victim never answers the pings, unlike the DoS-ICMP training victims and like most DDoS-ICMP training
    victims.
  * The features that encode this (`lh_dst_share` = 1.0, the pair rate) are the ones that moved towards the partner,
    and the errors rise in later blocks while the attacker count stays at 1. That fits the tree using a
    session-specific cue (overfitting in the sense of section 5) triggered by changed traffic.
  * **Platt calibration turns a raw 27 % error into 73 %**, which matches Part 3's 56 % DoS-ICMP → DDoS-ICMP for the
    calibrated model.
  * Consistent with this, the per-destination count alone, which has no reply-sensitive feature, misreads DoS-ICMP
    far less (0.076).
* **Rules still apply.** Do not drop `lh_dst_share`, change `LONG_CONTEXT_N` or retune calibration because of this. Test
  the hypotheses on new captures: an ICMP victim that does and does not reply; an MQTT DDoS whose attacker count
  changes over time.

### 13.4 Mixed-traffic replay (§17d-1, `In [26]`): item 4, inconclusive

**Share of attack packets predicted DDoS** (raw, mean over 3 blocks and both burst lengths):

| Pair, recorded | rec | k = 1 | k = 2 | k = 4 |
|---|---|---|---|---|
| SYN, DoS / DDoS | 0.364 / 0.307 | 0.372 / 0.012 | 0.704 / 0.643 | 0.274 / 0.639 |
| TCP, DoS / DDoS | 0.658 / 0.653 | 0.658 / 0.655 | 0.820 / 0.653 | 0.679 / 0.653 |
| UDP, DoS / DDoS | 0.111 / 0.785 | 0.109 / 0.587 | 0.167 / 0.904 | 0.263 / 0.905 |
| ICMP, DoS / DDoS | 0.558 / 0.689 | 0.561 / 0.397 | 0.911 / 0.676 | 0.803 / 0.676 |
| MQTT-Connect, DoS / DDoS | 0.002 / 0.800 | 0.004 / 0.137 | 0.025 / 0.819 | 0.030 / 0.806 |
| MQTT-Publish, DoS / DDoS | 0.678 / 0.666 | 0.684 / 0.666 | 0.973 / 0.666 | 0.971 / 0.665 |

**Verdict per pair** (`source_diversity_effect` / `recording_effect`):

* SYN 0.264 / −0.019 (mixed)
* TCP 0.010 / −0.065 (mixed)
* UDP 0.236 / 0.619 (**follows recording conditions**)
* ICMP 0.261 / −0.175 (mixed)
* MQTT-Connect 0.348 / 0.567 (mixed)
* MQTT-Publish 0.143 / −0.210 (mixed)

**Detection and false alarms** (as-recorded rows):

* Benign false-alarm rate in the lead-in: **0.009** for every pair (0.011–0.013 for the MQTT-Publish DoS streams),
  in line with Part 3's benign FAR.
* Attack detection share: 0.99–1.00 for most streams, but 0.667 for the SYN and TCP DDoS streams and 0.77 for
  MQTT-Publish DDoS, consistent with one of three blocks not being the flood.
* Detection delay: 53–430 packets, ≤ 0.03 s, except MQTT-Connect DoS (368 packets, 0.26 s). Two k = 1 DDoS streams
  were slow (SYN 1,093 packets / 27 s; TCP 244 packets / 6 s).
* `benign_far_after`: 0.016–0.66, the flood context lingering within one history length.
* Incident-level final decisions were correct in 0.333–1.0 of the streams per scenario (`replay_summary.csv`).

**Reading.**

* The as-recorded streams, which re-attribution does not touch, already disagree with TEST (section 6.2). For example,
  DoS-TCP is read as DDoS 0.66 of the time here against 0.012 on TEST.
* So this replay does **not** isolate source diversity, and the verdicts are not evidence either way.
* What it does show: inserting 10 % benign traffic into a flood, or the per-block role attribution, can move the
  deployed tree's DoS/DDoS decision a lot. That is a robustness finding worth testing properly (section 15).
* The cleanest pattern in the table is MQTT-Connect DDoS: k = 1 → 0.14 DDoS, k ≥ 2 → 0.81. It suggests source
  diversity matters there, but the DoS recording does not move with k (0.03), so recording conditions matter too.
* **Real recordings (§17d-2):** none were added, so the loader skipped.

### 13.5 Costs (§21-1, `In [32]`): item 5, Colab CPU

**Feature extraction per 20,000-packet block** (median of 8 TEST blocks):

* full `build_features` 42.2 ms at H = 20 and **47.5 ms at H = 1,024** (2.38 µs per packet);
* header + 20-packet context about 42.9 ms;
* the 8 long-horizon features alone 13.7 ms, the per-destination count alone 4.0 ms, the global count alone 2.4 ms;
* peak memory of one call **25.8 MB**.

So the long history costs about 5 ms per block over the short design, and history length barely matters.

**Live carry-over:** 1,024 raw packets = **57 KiB** (57 B per packet).

**Time covered by a 1,024-packet history** (median):

* Benign **48 s**;
* DoS floods 0.045–0.049 s; DDoS floods 0.017–0.022 s;
* MQTT 0.030 s (DDoS-Connect) to 0.49 s (DoS-Connect).

At H = 20 the figures are 1.0 s for Benign and under 5 ms for any flood.

**Warm-up at the true start of a capture** (time until 1,024 packets):

* Benign 31.9 s; TCP/IP floods 0.02–0.05 s;
* MQTT **3.7–20.6 s**, far above their steady state of 0.03–0.49 s. The MQTT captures begin with slower traffic, so at the start of an MQTT attack
  the DoS/DDoS label can lag by seconds.

**Live pipeline** (first 20,000 packets of each of the 15 TEST captures, batch 1,000, Decision Tree + calibrator):

* median µs per packet: **read 6.3, decode 17.1, features 8.8, model 3.3, calibration 1.7**;
* about 27,100 packets/s through these stages (median);
* **end to end with incident JSON: 11,816 packets/s** (median; range 7,420–15,009).

Decoding is the largest stage, and building incidents roughly halves throughput. One capture (DDoS-UDP2) had a slow
Drive read (64 µs per packet).

### 13.6 Package (§21-2, `In [33]`)

* `part4_code_snapshot.py`: **9 Part 4 cells**.
* `notebook_snapshot.ipynb`: copied from `/content/drive/MyDrive/Colab Notebooks/FYP_IoMT_PCAP_Detector.ipynb`.
* `part4_manifest.json`.
* **`part4_evidence_c53a51becb_p4-1.0_20261114T140037Z.zip`, 5.7 MB**.

All are in `MyDrive/FYP_IoMT_Detector/runs/run_c53a51becb/part4/`. The manifest holds the SHA-256 of every file in
the zip. The zip's own hash is not recorded; compute it (`sha256sum`) if you cite the package.

---

## 14. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `NameError` for `FINAL`, `PARTS`, `SEP_PAIRS`, `TOP_FEATURES` … in §17b–§17d | Part 4 cells run without the notebook state | *Run all* (nothing is retrained) |
| `AssertionError: run §17b-2 first` in §17b-3 | the selection was not frozen | Run §17b-2 |
| `AssertionError: … != lh_n_src` in §17b-1 | the count cache belongs to other packets, or `iomt_runtime.py` changed | Delete `reports/history_exp_counts_*.npz` and re-run §17b-1 |
| `WARNING reproduction …` in §17b-3 | seed 0 did not reproduce §17 item 6 (different model, or §17 item 6 was recomputed with other settings) | Check that `EXP_MODEL == ABL_MODEL` and that §17 item 6 reloaded for the same model key |
| §17b-2 prints "no capture-disjoint split possible" for TCP/IP pairs | a class has fewer than two training captures | Expected only with missing files |
| New sessions are not picked up | the folder is inside `DATA_DIR`, the file name matches no §4 rule, or the file is a copy of a capture already used | Use the sibling folder and names like `MQTT-DoS-Publish_session2.pcap` |
| `CONFIG_HASH` changed after adding sessions | the sessions were placed inside `CICIoMT2024` | Move them to `CICIoMT2024_new_sessions/` |
| §17d-2 says "No real mixed recordings yet" | no `labels.csv` in `MIXED_DIR` | Add the file (section 6.3) |
| §17d-2 skips a file | missing file, or `true_variant` is not one of the 12 attack variants | Fix `labels.csv` |
| A replay block is missing for a pair | fewer than `REPLAY_REPEATS` test blocks are mostly protocol-matching | Fewer repeats are used automatically |
| §21-2 "Notebook not found automatically" | the notebook is not in `MyDrive/Colab Notebooks/` or `MyDrive/` | Set `IOMT_NOTEBOOK_PATH`, or download the notebook and keep it with the zip |
| Results look stale after editing a Part 4 cell | the cache keys include `P4_VERSION`, not the code itself | Bump `P4_VERSION` in §17b-1 |

---

## 15. Suggested next steps

These are suggestions drawn from section 13, not decisions the team has taken. Ordered by what they add to the paper.

1. **Separate the replay's confounds (item 4).** It costs one cell and about a minute.
   1. First keep the current results: they are already in the evidence zip, and you can also rename
      `part4/reports/replay_streams.csv`, `replay_summary.csv`, `replay_verdict.csv` and
      `figures/replay_scale_vs_attackers.png` with a `_bg10` suffix.
   2. Set `REPLAY_BG_SHARE = 0.0` in §17d-1 and re-run that cell only. The cache key changes, so it recomputes.
   3. If the `rec` rows now match TEST (section 6.2 table), the 10 % mixing caused the disagreement. Then try 0.02, the
      background level of the training captures, before reading the verdicts.
   4. If they still disagree, inspect the `rec` rows of `replay_streams.csv` per `repeat` (`attack_detected_share`,
      `recorded_attackers`) for a block whose "attack" packets were not the flood.

   Either way this is evaluation design, not tuning: it uses TEST packets but selects nothing.
2. **Record what §17c cannot settle (items 2 and 4, real traffic).** Use the §17d-2 protocol (section 6.3) and the
   §17b-2 hook (section 4.4), and add the cases §17c points to:
   * an ICMP flood against a victim that **does** and one that **does not** reply, with 1 and 4 attackers;
   * an MQTT-Publish DDoS whose attacker count **changes during the capture** (for example 3 → 1), with timestamps of
     each change;
   * separate MQTT-Connect and MQTT-Publish sessions for both scales, so MQTT becomes selectable.
3. **Calibration decision (open since Part 3).** §17c adds exploratory evidence: on the DoS-ICMP test capture, Platt
   calibration turns a 27 % raw error into 73 %. Make the decision on VAL grounds, as Part 3 recommends, for example
   raw `argmax` for the label and calibrated probabilities only as confidence. Record that TEST was not the reason.
4. **Report wording.**
   * Suggested text: *"Capture-disjoint selection on 40 held-out training sessions, made before test evaluation, chose
     victim-centric attacker counts over 1,024 packets (mean wrong-scale share 0.062 vs 0.221 without them). On the
     test sessions, over five seeds, the DoS↔DDoS swap rate fell from 0.31 / 0.20 / 0.13 / 0.06 to 0.04 / 0.006 / 0.03
     / 0.000 for SYN / TCP / UDP / MQTT-Connect. Two test sessions do not transfer. Exploratory analysis shows the
     MQTT-DDoS-Publish test session reduces to one publisher after about 10 s, and the DoS-ICMP test victim never
     replies, a pattern the model associates with DDoS."*
   * Add section 12, item 1 (TEST seen before the freeze) and item 12 (ICMP: capture-disjoint vs TEST).
5. **Gateway measurements.**
   * Run `iomt_inference.py` alone on the gateway for throughput and memory; the Colab RAM column is the notebook
     process (section 12, item 13).
   * Report the 1,024-packet time coverage (13.5) next to any detection-delay claim.
6. **Keep the package immutable.** Before any further *Run all*, copy
   `part4_evidence_c53a51becb_p4-1.0_20261114T140037Z.zip` somewhere outside `runs/`. Bump `P4_VERSION` if you edit
   any Part 4 cell.
