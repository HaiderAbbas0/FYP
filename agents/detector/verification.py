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

#: Measured DoS/DDoS confusions. See confusion_matrix.csv in the evidence
#: directory. These pairs are reported as a single honest status instead of
#: cherry-picking whichever side happens to score better.
MEASURED_AMBIGUOUS_PAIRS = (
    ("DoS-TCP", "DDoS-TCP", 0.4653),
    ("MQTT-DoS-Publish", "MQTT-DDoS-Publish", None),
)


def _load_report() -> dict[str, Any] | None:
    path = EVIDENCE_DIR / "summary.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def _ambiguous_status(label: str) -> tuple[str, str | None] | None:
    """Return the measured ambiguity affecting this label, if any."""
    for left, right, rate in MEASURED_AMBIGUOUS_PAIRS:
        if label in (left, right):
            if rate is None:
                return STATUS_NOT_SEPARABLE, (
                    f"{left} and {right} are not separable: the measurement shows one direction "
                    "of this pair collapsing into the other."
                )
            return STATUS_NOT_SEPARABLE, (
                f"{left} and {right} swap at {rate:.4f} on the local test capture; the label is "
                "evidence of an attack of this protocol, not of the attacker count."
            )
    return None


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

        # Separability is checked first and deliberately overrides the score bar.
        # DoS-TCP misses the recall threshold *because* it cannot be told from
        # DDoS-TCP; reporting that as "unevaluated" would hide a known, measured
        # limitation behind a neutral-sounding word.
        ambiguous = _ambiguous_status(label)
        if ambiguous is not None:
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
