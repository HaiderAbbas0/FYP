# Agent pipeline implementation status

Updated 10 October 2026. The agent architecture software is implemented and can
run without a trained detector or dataset using explicit synthetic fixtures.
This is an implementation completion record, separate from empirical acceptance
of the detector and physical lab.

## Implemented components

| Area | Implementation |
|---|---|
| Input boundary | `sources.py`: seeded fixtures, capture replay, authenticated live detector envelope with trusted device attribution and validated numeric evidence |
| Coordination | Typed controller states, risk routing, concurrent specialist selection, evidence join, deterministic fusion/recommendation fallbacks |
| Specialist isolation | Disposable processes, concurrency semaphore, input/output limits, deadline including queue/startup, kill/join on timeout or cancellation |
| Durable run lifecycle | PostgreSQL/SQLite migration, bounded queue, atomic claims, renewable leases, ordered journals, idempotent submission, cancellation and expiry interruption |
| Communication | REST commands/queries, database ordered events, SSE replay using Last-Event-ID, cross-process polling, browser reconnect without resubmission |
| Authority | Bounded action catalog, deterministic policy gate, device restrictions, allowlisted source exemptions, executor target/duration revalidation |
| Lab execution | Authenticated HTTP adapter plus Linux nftables gateway service, fixed registered scope, durable intents/receipts, automatic kernel expiry, rollback and owned-table restart cleanup |
| Synchronization | Cross-worker target locks and continued exclusion for active/unknown effects, fencing before live intent, read-only receipt reconciliation |
| Outcomes | Independent cumulative-counter consumer, sustained fresh baseline/post windows, suppression and legitimate delivery/latency checks, missing/reset/stale evidence rejection, harmful-outcome rollback |
| Memory/reuse | Shared cases/outbox, compatibility/reliability/version gates, calibrated detector requirement, three independent comparable measured successes, adverse-outcome veto, cache filtering and refresh |
| Security | Viewer/operator/admin keys stored as SHA256 digests, signed HttpOnly sessions, shared database logout revocation, trusted origins, admin operation audit |
| UI | Operational persisted run/case/evaluation/health/device views, API session, fixture submission, cancellation, gateway receipt inspection; explicitly marked design/illustration modes |
| Timing/operations | Whole-run deadline, bounded whole-chain LLM budget, specialist timings, queue wait and node lifecycle offsets, process CPU/peak resident memory, readiness, standalone worker and Compose configuration |
| Evaluation | Paired full/context/similarity profiles, frozen case snapshot, manifests saved before execution, public config/code/model/memory/suite hashes, seeded runs, journal hashes, JSON/CSV export |

## Verification evidence

The verification commands and setup are in [RUNTIME_RUNBOOK.md](RUNTIME_RUNBOOK.md).

- Backend discovery includes 79 checks: 75 local checks and four opt-in
  PostgreSQL checks. The PostgreSQL checks were run separately against an actual
  isolated PostgreSQL 16.15 server, with disposable schemas and clean shutdown.
- PostgreSQL checks cover migrations/idempotency, eight concurrent queue
  claims, sixteen concurrent ordered event writes, target/action exclusion and
  durable case outbox behavior.
- Local checks cover role/cookie authentication, shared session revocation,
  independent outcomes, forged and stale receipts, queue lease recovery,
  process termination, measurement provenance, reuse recurrence and adverse
  invalidation, required evidence failures, fault injection and compensating
  cancellation before/after/during acknowledgement.
- The socket smoke harness `backend/tests/runtime_smoke.py` executes 45 paired
  seeded runs through separate API and worker processes, including five
  conditions for each of three scenarios and three routing profiles. It checks
  persisted completion, unvalidated fixture outcomes, no claimed live success
  and browser-session logout revocation.
- TypeScript checking and the Vite production build pass. The build retains
  Vite configuration and large-bundle advisories; these do not fail the build.
- Root Compose configuration parses successfully. Container build/deployment
  was not run because the local Docker engine did not respond.
- Gateway tests validate generated commands and service behavior with mocked
  nft execution. No firewall changes were performed on this Windows machine.

The fixture smoke exports are in [evaluation-smoke/report.json](evaluation-smoke/report.json),
[manifest.json](evaluation-smoke/manifest.json), and [runs.csv](evaluation-smoke/runs.csv).
These are orchestration checks. They are not evidence of clinical safety,
trained detector accuracy, deployed firewall efficacy or actual suppression.
Latency values are specific to this Windows machine and include disposable
process startup. Process CPU is summed over reporting children; peak RSS is the
largest individual reporting child, not total concurrent application memory.
Timeouts without a resource report leave that contribution unmeasured. Missing
wrong-reuse labels and detector accuracy remain null.

## External acceptance still required

1. Integrate the detector owner's final model, feature schema and data; validate
   confidence calibration, device attribution and real flow evidence.
2. Deploy the gateway on the isolated Linux forwarding path and independently
   instrument malicious traffic and legitimate delivery/latency. Validate kernel
   rules, expiration, restart cleanup and rollback on that host.
3. Run final detector accuracy and live lab suppression/collateral-impact
   experiments. Enable verified reuse only after these acceptance checks.
4. Confirm container deployment, load capacity, worker monitoring and database
   backup/restore on the selected deployment host.

These steps require real external artifacts or infrastructure. The software
provides their interfaces and fails closed when evidence is unavailable.
