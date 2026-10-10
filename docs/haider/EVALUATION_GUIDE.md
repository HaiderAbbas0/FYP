# Reproducible architecture evaluation

The harness runs paired `full_baseline`, `context_gated`, and `similarity_only` profiles against the same incident and seed. It uses the runtime's persisted journal, so latencies and worker counts reflect executed behavior. Missing completion events produce missing latency, never a fabricated zero. A similarity profile may collapse to the full path when verified reuse is disabled; report that result rather than asserting a speedup.

`full_baseline` selects full investigation for every detected incident. `context_gated` applies current incident risk and compatible-case gates before choosing investigation depth. `similarity_only` is an experimental routing ablation; its actions remain restricted to simulated sources and the deterministic policy gate still applies. These named profiles are evaluation modes, so their routing evidence does not authorize operational live reuse. Operational reuse additionally requires calibrated detection, compatible versions, at least three distinct independently measured successful live runs, and no matching adverse outcome. Wrong reuse remains unmeasured until labeled independent evidence exists.

Start the backend using [RUNTIME_RUNBOOK.md](RUNTIME_RUNBOOK.md) and set `IDS_API_KEY` to a configured **admin** API key. The evaluation profiles require admin authorization. The CLI sends the key as a Bearer header and automatically snapshots the current case memory once, then sends that same snapshot with every paired run. From `backend`, run:

```powershell
.\.venv\Scripts\python.exe evaluate.py --url http://127.0.0.1:8099 --output evaluation-results --seed 42
```

The default suite includes low, medium, and high device impact, each paired across no fault, memory outage, specialist timeout, policy conflict, and planner failure. LLM access is forced unavailable to eliminate external provider variability. A seeded synthetic source supplies detector inputs without a trained model or capture dataset.

Exports are `manifest.json`, `report.json`, and `runs.csv`. The manifest records public runtime code/configuration hashes, synthetic detector identity, the frozen case memory hash, and the incident suite and seed. Never place credentials in manifest configuration. Each row records seed, pair ID, journal hash, measured completion latency, invoked specialist count, terminal outcome, and evidence boundary. Reports include p50/p95 latency, missing outcomes, unvalidated rate, and paired latency/worker deltas.

Default disposable process workers publish measured resource evidence in each finding. CPU includes process startup/imports and specialist execution; it is not isolated algorithm CPU. Peak RSS is the OS high-water resident memory for one child. The reported peak across children is not total simultaneous RAM and must not be multiplied or presented as system memory consumption. Unsupported platforms, missing worker output, and `SPECIALIST_EXECUTION=inprocess` report unavailable resource measurements as null. Timeout wall time remains observable even when the terminated worker cannot return resource evidence.

For a meaningful comparison, reserve the runtime for the experiment and preserve the frozen code/configuration, detector identity and case snapshot. The CLI's snapshot is also supplied to history specialists, so subsequent global case changes cannot drift paired inputs. Fixtures cannot add synthetic successful outcomes to learned live memory. Concurrent unrelated runs still affect scheduling, process startup and database latency, and configuration/provider changes invalidate a controlled comparison. The harness rejects live lab paired ablations: similarity-only evaluation cannot execute lab actions.

Fixture success cannot establish clinical safety, trained detector accuracy, or actual attack suppression. The reported real validated success count requires a live source plus explicit independent lab measurements. Capture replay can assess orchestration and capture scoring, but it cannot demonstrate a live action outcome. Supply the final dataset and model through the detector adapter for detector accuracy experiments; keep those evaluations separate from architecture timing.

Run unit boundary checks from `backend`:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p test_evaluation.py -v
```

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for completed software and verification evidence. The next evaluation milestone is the final detector/dataset/calibration plus independently instrumented isolated lab runs and empirical safety acceptance; implemented gateway interfaces do not establish actual deployed firewall efficacy.
