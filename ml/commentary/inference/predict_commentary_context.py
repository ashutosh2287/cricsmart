from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List

import joblib
import pandas as pd

from ml.commentary.training.train_commentary_classifier import FEATURE_COLUMNS, TARGET_COLUMNS


def predict_rows(model_path: Path, rows: List[Dict]) -> List[Dict]:
    model = joblib.load(model_path)
    frame = pd.DataFrame(rows)
    frame = frame.reindex(columns=FEATURE_COLUMNS, fill_value=0)
    predictions = model.predict(frame)

    out = []
    for index, row in enumerate(rows):
        payload = dict(row)
        for target_index, target in enumerate(TARGET_COLUMNS):
            payload[target] = predictions[index][target_index]
        out.append(payload)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict commentary context labels")
    parser.add_argument("--model", default="ml/commentary/models/classifier.joblib")
    parser.add_argument("--input", required=True, help="JSON file with array of feature rows")
    parser.add_argument("--out", required=True, help="Output JSON path")
    args = parser.parse_args()

    rows = json.loads(Path(args.input).read_text(encoding="utf-8"))
    predictions = predict_rows(Path(args.model), rows)
    Path(args.out).write_text(json.dumps(predictions, indent=2), encoding="utf-8")
    print(f"Wrote predictions to {args.out}")


if __name__ == "__main__":
    main()

