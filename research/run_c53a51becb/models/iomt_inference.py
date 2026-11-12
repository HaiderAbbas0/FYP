"""Live PCAP inference for the IoMT detector bundle (deployment entry point).

    python iomt_inference.py <detector_bundle.joblib> <capture.pcap> [--emit all|attacks] [--max-packets N]

prints one incident JSON object per line. Import use: `predict_pcap_stream(pcap_path, bundle_or_path, batch_size=1000)`.
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone

import joblib
import numpy as np

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)
import iomt_runtime as rt  # noqa: E402

DEFAULT_SEVERITY = {"high": 0.90, "medium": 0.60}


def load_detector(path):
    """Load a bundle saved by the training notebook; its own runtime modules sit next to it."""
    d = os.path.dirname(os.path.abspath(path))
    if d not in sys.path:
        sys.path.insert(0, d)
    b = joblib.load(path)
    try:
        import sklearn
        if b["versions"]["scikit-learn"] != sklearn.__version__:
            print(f"Note: bundle saved with scikit-learn {b['versions']['scikit-learn']}, running {sklearn.__version__}",
                  file=sys.stderr)
    except ImportError:
        pass
    if b.get("runtime_version") != rt.RUNTIME_VERSION:
        print(f"Note: bundle built with iomt_runtime {b.get('runtime_version')}, running {rt.RUNTIME_VERSION}",
              file=sys.stderr)
    if b["model_kind"] == "sequence":
        b["predictor"].to("cpu")
    return b


def _severity(is_attack, conf, thr):
    if not is_attack:
        return "none"
    return "high" if conf >= thr["high"] else "medium" if conf >= thr["medium"] else "low"


def predict_pcap_stream(pcap_path, detector_bundle, batch_size=1000, emit="attacks", max_packets=None,
                        min_confidence=0.0, use_calibrated=True):
    """Stream a raw PCAP/PCAPNG and yield structured incident dicts for SOC / Controller routing.
    emit: "attacks" (packets predicted as Attack) or "all" (every packet)."""
    det = load_detector(detector_bundle) if isinstance(detector_bundle, str) else detector_bundle
    src = rt.PcapSource(pcap_path)
    fz = rt.StreamFeaturizer(det["context_n"], det.get("long_context_n", rt.DEFAULT_LONG_CONTEXT_N))
    levels = {lv: (d["names"], np.asarray(d["matrix"])) for lv, d in det["eval_levels"].items()}
    classes = det["classes"]
    version, thr = f"run_{det['config_hash']}", det.get("severity_thresholds", DEFAULT_SEVERITY)

    def score(batch, first_index):
        raw = rt.decode_records(batch, src.linktype)
        feats, wins, warm = fz.transform(raw)
        t0 = time.perf_counter()
        P = det["predictor"].predict_proba(wins if det["model_kind"] == "sequence" else feats)
        if use_calibrated and det.get("calibrator") is not None:
            P = det["calibrator"].predict_proba(P)
        per_pkt_ms = (time.perf_counter() - t0) * 1e3 / len(batch)
        coarse = {lv: (names, (P @ M).argmax(1)) for lv, (names, M) in levels.items()}
        top = np.argsort(-P, axis=1)[:, :3]
        for j in range(len(batch)):
            lab = {lv: names[idx[j]] for lv, (names, idx) in coarse.items()}
            binary = lab.get("binary", "Benign" if classes[top[j, 0]] == "Benign" else "Attack")
            is_attack, conf = binary == "Attack", float(P[j, top[j, 0]])
            if (emit == "attacks" and not is_attack) or conf < min_confidence:
                continue
            s_ip, d_ip = rt.packet_addresses(batch[j][2], src.linktype)
            yield {"timestamp": datetime.fromtimestamp(batch[j][0], timezone.utc)
                                .isoformat(timespec="milliseconds").replace("+00:00", "Z"),
                   "src_ip": s_ip, "dst_ip": d_ip,
                   "attack_variant": lab.get("variant"), "attack_subtype": lab.get("subtype"),
                   "attack_family": lab.get("family"), "attack_binary": binary,
                   "confidence": round(conf, 4),
                   "top3_predictions": [[classes[k], round(float(P[j, k]), 4)] for k in top[j]],
                   "initial_severity": _severity(is_attack, conf, thr),
                   "inference_latency_ms": round(per_pkt_ms, 4), "model_version": version,
                   "packet_index": first_index + j, "context_warmup": bool(warm[j])}

    buf, n = [], 0
    for rec in src.iter_all():
        buf.append(rec)
        n += 1
        if len(buf) == batch_size:
            yield from score(buf, n - len(buf))
            buf = []
        if max_packets and n >= max_packets:
            break
    if buf:
        yield from score(buf, n - len(buf))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Stream a PCAP through the IoMT detector and print incident JSON lines")
    ap.add_argument("bundle")
    ap.add_argument("pcap")
    ap.add_argument("--emit", choices=["attacks", "all"], default="attacks")
    ap.add_argument("--max-packets", type=int, default=None)
    ap.add_argument("--batch-size", type=int, default=1000)
    a = ap.parse_args()
    for inc in predict_pcap_stream(a.pcap, a.bundle, a.batch_size, a.emit, a.max_packets):
        print(json.dumps(inc))
