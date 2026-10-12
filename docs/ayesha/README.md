# Ayesha — backend and frontend ownership

**Project:** Adaptive Autonomous Cyber Defense for IoMT Networks (FYP 2026-27)  
**Owner:** Ayesha Ikram (23i-0109)  
**Scope:** Runtime backend work that is still open after the pipeline and detector handoffs, then the operational frontend.  
**Does not own:** Detector training or CIC dataset protocol (see `docs/hamd`), or the already-implemented agent orchestration (see `docs/haider`).

This folder follows the same pattern as `docs/haider` and `docs/hamd`: plans, status, run notes, and evidence that belong to this owner. Teammate documents are not copied or edited here.

## Teammate documents (read, do not modify)

| Path | What it is |
|---|---|
| `docs/hamd/detector.md` | 13-class detector design, notebook map, results template |
| `docs/hamd/CSV_README.md` | CICIoMT2024 CSV samples |
| `docs/haider/RUNTIME_RUNBOOK.md` | How to start the existing API, workers, auth, tests |
| `docs/haider/IMPLEMENTATION_STATUS.md` | What the pipeline already implements |
| `docs/haider/AGENTIC_PIPELINE_IMPLEMENTATION_ORGANIZATION_AND_VALIDATION_SUMMARY.md` | Remaining work, including multiclass runtime integration |

## This folder

| File | Purpose |
|---|---|
| [BACKEND_WORK_PLAN.md](BACKEND_WORK_PLAN.md) | Sequenced backend tasks |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | What this owner has implemented |
| [RUNTIME_NOTES.md](RUNTIME_NOTES.md) | Local backend bring-up on this machine |
| [WORK_LOG.md](WORK_LOG.md) | Dated record of what was done |
| [evidence/](evidence/) | Saved adapter / opt-in check outputs |

Code added for this work lives in new files (starting with `agents/detector/multiclass.py` and `backend/tests/test_multiclass_detector.py`). The legacy detector in `agents/detector/agent.py` remains the default runtime path.
