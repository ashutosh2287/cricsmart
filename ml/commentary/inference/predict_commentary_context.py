from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List

import joblib
import pandas as pd

from ml.commentary.models.feature_contract import feature_order, load_feature_contract, validate_feature_frame
from ml.commentary.training.train_commentary_classifier import TARGET_COLUMNS


def predict_rows(model_path: Path, rows: List[Dict], *, feature_contract_path: Path) -> List[Dict]:
    model = joblib.load(model_path)
    contract = load_feature_contract(feature_contract_path)
    ordered_features = feature_order(contract)

    frame = pd.DataFrame(rows)
    frame = frame.reindex(columns=ordered_features)
    valid, errors = validate_feature_frame(frame, contract)
    if not valid:
        raise ValueError(f"Inference feature contract validation failed: {errors}")

    predictions = model.predict(frame[ordered_features])

    out = []
    for index, row in enumerate(rows):
        payload = dict(row)
        payload["schemaVersion"] = contract.get("schemaVersion")
        payload["schemaHash"] = contract.get("schemaHash")
        for target_index, target in enumerate(TARGET_COLUMNS):
            payload[target] = predictions[index][target_index]
        out.append(payload)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict commentary context labels")
    parser.add_argument("--model", default="ml/commentary/models/classifier.joblib")
    parser.add_argument("--input", required=True, help="JSON file with array of feature rows")
    parser.add_argument("--out", required=True, help="Output JSON path")
    parser.add_argument("--feature-contract", default="ml/commentary/models/feature_contract.json")
    args = parser.parse_args()

    rows = json.loads(Path(args.input).read_text(encoding="utf-8"))
    predictions = predict_rows(Path(args.model), rows, feature_contract_path=Path(args.feature_contract))
    Path(args.out).write_text(json.dumps(predictions, indent=2), encoding="utf-8")
    print(f"Wrote predictions to {args.out}")


if __name__ == "__main__":
    main()
