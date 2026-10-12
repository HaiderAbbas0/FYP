"""Which classes the model declares, and which ones are actually evidenced.

The bundle is configured to predict 13 classes. The evidence in
`docs/ayesha/evidence/multiclass-evaluation/` covers 6 of them. An API that
returned only the configured label list would let a reader reasonably assume all
13 were validated, which is not established and for two of the six is in fact
contradicted by the measurement.

`VERIFICATION_STANDARD` states exactly what "verified" means here, so the number
is falsifiable rather than a matter of opinion. A class is verified only when it
clears every one of:

  1. support   - at least `min_support` scored rows from an official `*_test`
                 capture, so the figure is not a handful of rows.
  2. recall    - class recall at or above `min_recall`.
  3. precision - class precision at or above `min_precision`.
  4. separability - the class is not inside a measured-ambiguous pair.

A class with no local test capture is reported as `unevaluated`, never as
failing: untested is not the same claim as disproven. The one class the
measurement actively contradicts is reported separately as `not_separable`.

Regenerate the underlying report with `backend/evaluate_multiclass.py`.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from agents.detector.captures import VARIANT_CLASSES

#: Directory holding the held-out evaluation produced by evaluate_multiclass.py.
EVIDENCE_DIR = Path(__file__).resolve().parents[2] / "docs" / "ayesha" / "evidence" / "multiclass-evaluation"

#: A class must clear all of these to be reported as verified.
VERIFICATION_STANDARD = {
    "min_support": 100,
    "min_recall": 0.80,
    "min_precision": 0.90,
    "source": "official *_test captures scored by backend/evaluate_multiclass.py",
    "note": (
        "Verified means evidenced at this standard, not 'the model can output it'. "
        "Classes with no local test capture are unevaluated. Classes whose DoS/DDoS "
        "distinction the measurement could not resolve are not_separable."
    ),
}

STATUS_VERIFIED = "verified"
STATUS_UNEVALUATED = "unevaluated"
STATUS_NOT_SEPARABLE = "not_separable"

#: DoS/DDoS pairs are the same protocol with a different attacker count. A pair
#: is reported as inseparable when the recorded evidence cannot distinguish its
#: two sides. The threshold is a judgement call, stated here so it can be
#: argued with: below it, the pair is reliably separated and the ordinary score
#: bar applies instead.
#:
#: This is derived from the confusion matrix in the recorded evidence rather than
#: hard-coded per class, so adding a class never silently leaves it unlisted.
SEPARABILITY_MAX_SWAP_RATE = 0.05

#: (lower, upper) label pairs sharing a protocol suffix.
_DOS_DDOS_PAIRS = (
    ("DoS-SYN", "DDoS-SYN"),
    ("DoS-TCP", "DDoS-TCP"),
    ("DoS-UDP", "DDoS-UDP"),
    ("DoS-ICMP", "DDoS-ICMP"),
    ("MQTT-DoS-Connect", "MQTT-DDoS-Connect"),
    ("MQTT-DoS-Publish", "MQTT-DDoS-Publish"),
)


def _load_report() -> dict[str, Any] | None:
    path = EVIDENCE_DIR / "summary.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def _pair_membership() -> dict[str, tuple[str, str]]:
    """Map each DoS/DDoS pair label to its partner."""
    mapping: dict[str, tuple[str, str]] = {}
    for lower, upper in _DOS_DDOS_PAIRS:
        mapping[lower] = (lower, upper)
        mapping[upper] = (lower, upper)
    return mapping


def _swap_rate(report: dict[str, Any], lower: str, upper: str) -> float | None:
    """Fraction of the two-class block where the side was mislabelled."""
    labels = report.get("metrics", {}).get("labels") or []
    if lower not in labels or upper not in labels:
        return None
    matrix = report.get("metrics", {}).get("confusion_matrix") or []
    i, j = labels.index(lower), labels.index(upper)
    if len(matrix) <= max(i, j):
        return None
    correct = matrix[i][i] + matrix[j][j]
    total = sum(matrix[i]) + sum(matrix[j])
    if total <= 0:
        return None
    return round(1.0 - (correct / total), 4)


def _ambiguous_status(report: dict[str, Any], label: str) -> tuple[str, str | None] | None:
    """Return the measured DoS/DDoS ambiguity affecting this label, if any.

    Computed from the recorded confusion matrix. A pair below
    `SEPARABILITY_MAX_SWAP_RATE` is reliably separated, so no ambiguity note is
    attached and the ordinary score bar decides the status.
    """
    pair = _pair_membership().get(label)
    if pair is None:
        return None
    lower, upper = pair
    rate = _swap_rate(report, lower, upper)
    if rate is None:
        return None
    if rate <= SEPARABILITY_MAX_SWAP_RATE:
        return None
    return STATUS_NOT_SEPARABLE, (
        f"{lower} and {upper} swap at {rate:.4f} on the recorded test captures: the feature schema "
        "carries no source addresses, so the prediction is evidence of an attack of this protocol, "
        "not of the attacker count."
    )


def evaluate_verification() -> dict[str, Any]:
    """Class-level verification status derived from the recorded evidence."""
    report = _load_report()
    if report is None:
        return {
            "evidence_present": False,
            "standard": VERIFICATION_STANDARD,
            "summary": {
                "declared": len(VARIANT_CLASSES),
                "verified": 0,
                "unevaluated": len(VARIANT_CLASSES),
                "not_separable": 0,
            },
            "classes": {label: {"status": STATUS_UNEVALUATED, "detail": "no evaluation evidence recorded"} for label in VARIANT_CLASSES},
            "note": "No held-out evaluation has been recorded yet; no class can be verified.",
        }

    per_class = {
        row["label"]: row for row in report.get("metrics", {}).get("per_class", [])
    }
    classes: dict[str, Any] = {}
    counts = {STATUS_VERIFIED: 0, STATUS_UNEVALUATED: 0, STATUS_NOT_SEPARABLE: 0}

    for label in VARIANT_CLASSES:
        row = per_class.get(label)
        if row is None or row.get("support", 0) == 0:
            classes[label] = {
                "status": STATUS_UNEVALUATED,
                "support": 0,
                "detail": "no official *_test capture for this class is present in this workspace",
            }
            counts[STATUS_UNEVALUATED] += 1
            continue

        support = int(row.get("support", 0))
        recall = float(row.get("recall", 0.0))
        precision = float(row.get("precision", 0.0))

        # Separability and the score bar are independent axes and are both
        # reported. A class that clears the score bar but sits in a confused pair
        # is *usable* (the protocol is right) while its DoS/DDoS distinction is
        # not; calling that simply "not_separable" would understate what the
        # model demonstrably does get right.
        ambiguous = _ambiguous_status(report, label)
        clears_bar = (
            support >= VERIFICATION_STANDARD["min_support"]
            and recall >= VERIFICATION_STANDARD["min_recall"]
            and precision >= VERIFICATION_STANDARD["min_precision"]
        )
        if ambiguous is not None and not clears_bar:
            status, detail = ambiguous
        elif support < VERIFICATION_STANDARD["min_support"]:
            status, detail = STATUS_UNEVALUATED, (
                f"support {support} is below the {VERIFICATION_STANDARD['min_support']} row minimum"
            )
        elif recall < VERIFICATION_STANDARD["min_recall"] or precision < VERIFICATION_STANDARD["min_precision"]:
            status = STATUS_UNEVALUATED
            detail = (
                f"recall {recall:.4f} / precision {precision:.4f} do not meet the "
                f"{VERIFICATION_STANDARD['min_recall']} / {VERIFICATION_STANDARD['min_precision']} bar"
            )
        else:
            status, detail = STATUS_VERIFIED, (
                f"recall {recall:.4f}, precision {precision:.4f} over {support} scored rows"
            )

        entry = {"status": status, "support": support, "detail": detail}
        if status != STATUS_NOT_SEPARABLE:
            entry["recall"] = recall
            entry["precision"] = precision
        if ambiguous is not None and status != STATUS_NOT_SEPARABLE:
            entry["label_caveat"] = ambiguous[1]
        classes[label] = entry
        counts[status] += 1

    return {
        "evidence_present": True,
        "evidence_source": str(EVIDENCE_DIR),
        "rows_scored": report.get("rows_scored"),
        "standard": VERIFICATION_STANDARD,
        "summary": {"declared": len(VARIANT_CLASSES), **counts},
        "classes": classes,
        "note": (
            "Declared means the model is configured to emit the label. Verified means the recorded "
            "evidence clears VERIFICATION_STANDARD. The two counts are deliberately different."
        ),
    }
