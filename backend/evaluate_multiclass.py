"""Write multiclass evaluation artifacts under docs/ayesha/evidence/multiclass-evaluation."""
from pathlib import Path
from agents.detector.evaluate import run_evaluation

OUTPUT = Path(__file__).resolve().parents[1] / "docs" / "ayesha" / "evidence" / "multiclass-evaluation"

if __name__ == "__main__":
    summary = run_evaluation(OUTPUT)
    print(f"rows={summary['rows_scored']} present={summary['classes_present']} missing={summary['classes_missing']}")
    print(f"wrote {OUTPUT}")
