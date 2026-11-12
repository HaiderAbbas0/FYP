
import argparse, json, os, sys, time, threading
ap = argparse.ArgumentParser()
ap.add_argument("--kind"); ap.add_argument("--model", default=""); ap.add_argument("--input")
ap.add_argument("--repeats", type=int); ap.add_argument("--threads", type=int); ap.add_argument("--device", default="cpu")
ap.add_argument("--module-dir"); ap.add_argument("--baseline", action="store_true")
a = ap.parse_args()
for v in ("OMP_NUM_THREADS", "MKL_NUM_THREADS", "OPENBLAS_NUM_THREADS"):
    os.environ[v] = str(a.threads)
if a.device == "cpu":
    os.environ["CUDA_VISIBLE_DEVICES"] = ""
sys.path.insert(0, a.module_dir)
import numpy as np, psutil
proc = psutil.Process(); peak = [proc.memory_info().rss]; stop = threading.Event()
def sampler():
    while not stop.is_set():
        peak[0] = max(peak[0], proc.memory_info().rss); stop.wait(0.002)
th = threading.Thread(target=sampler, daemon=True); th.start()
if a.kind == "tabular":
    import joblib, pandas as pd, sklearn, xgboost, iomt_runtime
    try:
        import lightgbm
    except Exception:
        pass
    X = pd.read_parquet(a.input)
    take = lambda i, j: X.iloc[i:j]
else:
    import torch, iomt_torch_models as tm, iomt_runtime
    torch.set_num_threads(a.threads)
    X = np.load(a.input)
    take = lambda i, j: X[i:j]
base = proc.memory_info().rss
out = {"baseline_rss_mb": base / 2**20}
if not a.baseline:
    t0 = time.perf_counter()
    if a.kind == "tabular":
        model = joblib.load(a.model); f = model.predict_proba
    else:
        model = tm.TorchSequencePredictor.load(a.model, device=a.device); f = model.predict_proba
    out["load_ms"] = (time.perf_counter() - t0) * 1e3
    n = len(X); f(take(0, 1)); f(take(0, min(1000, n)))                    # warm-up
    if a.device != "cpu":
        torch.cuda.synchronize(); torch.cuda.reset_peak_memory_stats()
    lat = []
    for r in range(a.repeats):
        i = (r * 37) % n; t0 = time.perf_counter(); f(take(i, i + 1)); lat.append((time.perf_counter() - t0) * 1e3)
    bl = []
    for r in range(max(10, a.repeats // 10)):
        i = (r * 997) % max(1, n - 1000); t0 = time.perf_counter(); f(take(i, i + 1000)); bl.append((time.perf_counter() - t0) * 1e3)
    t0 = time.perf_counter(); f(take(0, n)); tput = n / (time.perf_counter() - t0)
    out.update(single_p50_ms=float(np.percentile(lat, 50)), single_p95_ms=float(np.percentile(lat, 95)),
               batch1k_p50_ms=float(np.percentile(bl, 50)), batch1k_p95_ms=float(np.percentile(bl, 95)),
               throughput_pps=float(tput))
    if a.device != "cpu":
        out["peak_infer_vram_mb"] = torch.cuda.max_memory_allocated() / 2**20
stop.set(); th.join()
out["peak_rss_mb"] = max(peak[0], proc.memory_info().rss) / 2**20
print("BENCH_JSON " + json.dumps(out))
