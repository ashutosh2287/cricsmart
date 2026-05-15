from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

if __package__ in {None, ""}:
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[3]))

from ml.commentary.preprocessing.feature_engineering import FEATURE_COLUMNS, build_model_features

DEFAULT_MODEL_PATH = "ml/commentary/models/commentary_ranker.joblib"


def predict_commentary_context(context: dict[str, Any], model_path: str = DEFAULT_MODEL_PATH) -> dict[str, Any]:
    bundle = joblib.load(model_path)
    feature_row = build_model_features(context)
    matrix = pd.DataFrame([[feature_row[column] for column in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS, dtype="float32")

    predictions: dict[str, Any] = {
        "modelVersion": bundle["modelVersion"],
        "features": feature_row,
    }
    for target, model in bundle["models"].items():
        classes = bundle["labelEncodings"][target]
        probabilities = model.predict_proba(matrix)[0]
        best_index = int(np.argmax(probabilities))
        predictions[target] = classes[best_index]
        predictions[f"{target}_confidence"] = round(float(probabilities[best_index]), 4)
    return predictions


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict commentary context labels from match state features.")
    parser.add_argument("--model", default=DEFAULT_MODEL_PATH)
    parser.add_argument("--input", help="Optional JSON file containing context payload")
    args = parser.parse_args()

    if args.input:
        payload = json.loads(Path(args.input).read_text(encoding="utf-8"))
    else:
        payload = json.loads(input())

    print(json.dumps(predict_commentary_context(payload, args.model), indent=2))


if __name__ == "__main__":
    main()
