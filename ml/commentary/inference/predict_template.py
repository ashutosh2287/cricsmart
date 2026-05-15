from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List

import joblib
import pandas as pd

from ml.commentary.training.train_template_ranker import FEATURE_COLUMNS


def rank_templates(model_path: Path, rows: List[Dict]) -> List[Dict]:
    pipeline = joblib.load(model_path)
    frame = pd.DataFrame(rows)
    required = FEATURE_COLUMNS + ["template_key"]
    frame = frame.reindex(columns=required, fill_value=0)
    scores = pipeline.predict(frame)

    out = []
    for row, score in zip(rows, scores):
        payload = dict(row)
        payload["template_score"] = float(score)
        out.append(payload)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict template ranking scores")
    parser.add_argument("--model", default="ml/commentary/models/template_ranker.joblib")
    parser.add_argument("--input", required=True, help="Input JSON rows")
    parser.add_argument("--out", required=True, help="Output JSON rows")
    args = parser.parse_args()

    rows = json.loads(Path(args.input).read_text(encoding="utf-8"))
    ranked = rank_templates(Path(args.model), rows)
    ranked = sorted(ranked, key=lambda row: row.get("template_score", 0), reverse=True)
    Path(args.out).write_text(json.dumps(ranked, indent=2), encoding="utf-8")
    print(f"Wrote ranked templates to {args.out}")


if __name__ == "__main__":
    main()

