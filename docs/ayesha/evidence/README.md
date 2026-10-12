# Evidence — Ayesha

Saved outputs from this owner's backend checks. These are not detector accuracy claims and not lab containment proof.

| File | What it records |
|---|---|
| `opt_in_capture_replay_low.json` | Default vs `IDS_DETECTOR=multiclass` manifest keys, plus one `low` capture-replay event (fanout 0, calibrated variant confidence vs window-mean P(Attack)) |
| [`multiclass-evaluation/`](multiclass-evaluation/) | Held-out evaluation of the staged LightGBM bundle over every official `*_test` capture in this workspace: per-class precision/recall/F1, confusion matrix, DoS/DDoS swap rate, benign false-alarm rate, calibration and local latency. 6 of 13 classes; see its README before quoting any number |
| [`pipeline-evaluation/`](pipeline-evaluation/) | End-to-end pipeline run under `IDS_DETECTOR=multiclass`: 5 scenarios, 140 checks across detector, routing, evidence, response, policy, safety, memory and reproducibility, plus 5 fail-closed checks. Includes a negative control proving the harness detects a broken system |
