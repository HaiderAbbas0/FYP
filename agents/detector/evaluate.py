"""Evaluate the staged multiclass bundle on every local official test capture."""
from __future__ import annotations

import json
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from agents.detector.captures import DATA, VARIANT_CLASSES, label_from_filename
from agents.detector.multiclass import MulticlassDetectorAdapter

CHUNK = 2048


def discover_test_files() -> list[tuple[Path, str]]:
    files = []
    for path in sorted(DATA.rglob("*.pcap.csv")):
        if "_test" not in path.name and not path.name.startswith("Benign_test"):
            continue
        if "_train" in path.name:
            continue
        label = label_from_filename(path.name)
        if label:
            files.append((path, label))
    return files


def _ece(confidence: np.ndarray, correct: np.ndarray, bins: int = 10) -> float:
    edges = np.linspace(0.0, 1.0, bins + 1)
    total = 0.0
    n = len(confidence)
    if n == 0:
        return float("nan")
    for i in range(bins):
        mask = (confidence >= edges[i]) & (confidence < edges[i + 1] if i < bins - 1 else confidence <= edges[i + 1])
        if not np.any(mask):
            continue
        total += abs(float(correct[mask].mean()) - float(confidence[mask].mean())) * int(mask.sum())
    return total / n


def _metrics(y_true: list[str], y_pred: list[str], labels: list[str]) -> dict[str, Any]:
    from sklearn.metrics import confusion_matrix, precision_recall_fscore_support

    matrix = confusion_matrix(y_true, y_pred, labels=labels)
    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, zero_division=0
    )
    per_class = []
    for i, label in enumerate(labels):
        per_class.append({
            "label": label,
            "precision": round(float(precision[i]), 4),
            "recall": round(float(recall[i]), 4),
            "f1": round(float(f1[i]), 4),
            "support": int(support[i]),
        })
    present = [row for row in per_class if row["support"] > 0]
    macro_f1 = float(np.mean([row["f1"] for row in present])) if present else float("nan")
    return {
        "labels": labels,
        "confusion_matrix": matrix.tolist(),
        "per_class": per_class,
        "macro_f1": round(macro_f1, 4) if present else None,
        "accuracy": round(float(np.mean(np.asarray(y_true) == np.asarray(y_pred))), 4) if y_true else None,
    }


def dos_ddos_confusion(y_true: list[str], y_pred: list[str]) -> dict[str, Any]:
    protocols = ("TCP", "UDP", "SYN", "ICMP")
    rows = []
    swaps = 0
    considered = 0
    for truth, pred in zip(y_true, y_pred):
        for proto in protocols:
            dos, ddos = f"DoS-{proto}", f"DDoS-{proto}"
            if truth in {dos, ddos}:
                considered += 1
                swapped = (truth == dos and pred == ddos) or (truth == ddos and pred == dos)
                if swapped:
                    swaps += 1
                rows.append({"true": truth, "pred": pred, "swapped": swapped})
                break
    return {
        "rows_considered": considered,
        "protocol_family_swaps": swaps,
        "swap_rate": round(swaps / considered, 4) if considered else None,
        "note": "Same-protocol DoS vs DDoS swaps; CIC windows often cannot separate attacker count.",
    }


def run_evaluation(output_dir: Path, adapter: MulticlassDetectorAdapter | None = None) -> dict[str, Any]:
    adapter = adapter or MulticlassDetectorAdapter()
    files = discover_test_files()
    present = sorted({label for _, label in files})
    missing = [label for label in VARIANT_CLASSES if label not in present]
    y_true: list[str] = []
    y_pred: list[str] = []
    variant_conf: list[float] = []
    attack_p: list[float] = []
    file_rows: list[dict[str, Any]] = []
    started = time.perf_counter()
    for path, label in files:
        n_file = 0
        pred_counts: Counter[str] = Counter()
        for chunk in pd.read_csv(path, chunksize=CHUNK):
            incidents = adapter.predict_incidents(chunk)
            for incident in incidents:
                predicted = str(incident.get("attack_variant"))
                y_true.append(label)
                y_pred.append(predicted)
                variant_conf.append(float(incident["confidence"]))
                attack_p.append(float(incident["attack_probability"]))
                pred_counts[predicted] += 1
                n_file += 1
        file_rows.append({
            "file": path.name,
            "true_label": label,
            "rows": n_file,
            "predictions": dict(pred_counts),
        })
    elapsed = time.perf_counter() - started
    labels = [name for name in VARIANT_CLASSES if name in set(y_true) | set(y_pred)]
    report = _metrics(y_true, y_pred, labels)
    benign_true = [p for t, p in zip(y_true, y_pred) if t == "Benign"]
    false_alarm = float(np.mean([p != "Benign" for p in benign_true])) if benign_true else None
    correct = np.asarray(y_true) == np.asarray(y_pred)
    latency = _latency(adapter)
    summary = {
        "scope": "Official *_test captures present in this workspace, not the full 13-class CIC split.",
        "classes_defined": VARIANT_CLASSES,
        "classes_present": present,
        "classes_missing": missing,
        "rows_scored": len(y_true),
        "wall_time_s": round(elapsed, 2),
        "files": file_rows,
        "metrics": report,
        "benign_false_alarm_rate": round(false_alarm, 4) if false_alarm is not None else None,
        "dos_ddos": dos_ddos_confusion(y_true, y_pred),
        "calibration": {
            "top_label_ece": round(_ece(np.asarray(variant_conf), correct.astype(float)), 4) if y_true else None,
            "mean_variant_confidence": round(float(np.mean(variant_conf)), 4) if variant_conf else None,
            "mean_attack_probability": round(float(np.mean(attack_p)), 4) if attack_p else None,
        },
        "latency": latency,
        "strengths_and_weaknesses": _narrative(present, missing, report, false_alarm, dos_ddos_confusion(y_true, y_pred)),
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    _write_confusion_csv(output_dir / "confusion_matrix.csv", report["labels"], report["confusion_matrix"])
    pd.DataFrame(report["per_class"]).to_csv(output_dir / "per_class_metrics.csv", index=False)
    pd.DataFrame(file_rows).to_csv(output_dir / "per_file.csv", index=False)
    return summary


def _latency(adapter: MulticlassDetectorAdapter) -> dict[str, Any]:
    benign = DATA / "Benign_test.pcap.csv"
    if not benign.exists():
        return {"available": False}
    one = pd.read_csv(benign, nrows=1)
    batch = pd.read_csv(benign, nrows=512)
    times = []
    for _ in range(20):
        t0 = time.perf_counter()
        adapter.predict_incidents(one)
        times.append((time.perf_counter() - t0) * 1000)
    t0 = time.perf_counter()
    adapter.predict_incidents(batch)
    batch_ms = (time.perf_counter() - t0) * 1000
    return {
        "available": True,
        "single_row_p50_ms": round(float(np.percentile(times, 50)), 3),
        "single_row_p95_ms": round(float(np.percentile(times, 95)), 3),
        "batch_512_ms": round(batch_ms, 2),
        "note": "Local CPU timings, not gateway/edge latency.",
    }


def _write_confusion_csv(path: Path, labels: list[str], matrix: list[list[int]]) -> None:
    frame = pd.DataFrame(matrix, index=labels, columns=labels)
    frame.to_csv(path)


def _narrative(present, missing, report, false_alarm, dos_ddos) -> list[str]:
    notes = [
        f"This workspace has test captures for {len(present)} of 13 training classes; missing: {', '.join(missing) or 'none'}.",
        "Do not quote these numbers as full CICIoMT2024 TEST results.",
    ]
    if false_alarm is not None:
        notes.append(f"Benign false-alarm rate on local Benign_test rows: {false_alarm:.4f}.")
    if dos_ddos.get("swap_rate") is not None:
        notes.append(
            f"Same-protocol DoS/DDoS swap rate among scored DoS/DDoS rows: {dos_ddos['swap_rate']} "
            f"({dos_ddos['protocol_family_swaps']}/{dos_ddos['rows_considered']})."
        )
    if report.get("macro_f1") is not None:
        notes.append(f"Macro-F1 over classes that appear in this run: {report['macro_f1']}.")
    return notes
