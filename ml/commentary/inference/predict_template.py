from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd

from ml.commentary.models.feature_contract import load_feature_contract
from ml.commentary.training.train_template_ranker import FEATURE_COLUMNS


def rank_templates(model_path: Path, rows: list[dict], *, feature_contract_path: Path) -> list[dict]:
    pipeline = joblib.load(model_path)
    contract = load_feature_contract(feature_contract_path)

    frame = pd.DataFrame(rows)
    required = FEATURE_COLUMNS + ["template_key"]
    missing = [column for column in required if column not in frame.columns]
    if missing:
        raise ValueError(f"Missing ranker inference features: {missing}")

    frame = frame.reindex(columns=required)
    if frame[FEATURE_COLUMNS].isna().any().any():
        raise ValueError("Ranker inference contains missing feature values")

    scores = pipeline.predict(frame)

    out: list[dict] = []
    for row, score in zip(rows, scores):
        payload = dict(row)
        payload["template_score"] = float(score)
        payload["template_confidence"] = float(max(0.0, min(1.0, score / 10)))
        payload["schemaVersion"] = contract.get("schemaVersion")
        payload["schemaHash"] = contract.get("schemaHash")
        out.append(payload)

    out.sort(key=lambda item: (-float(item.get("template_score", 0)), str(item.get("template_key", ""))))
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict template ranking scores")
    parser.add_argument("--model", default="ml/commentary/models/template_ranker.joblib")
    parser.add_argument("--input", required=True, help="Input JSON rows")
    parser.add_argument("--out", required=True, help="Output JSON rows")
    parser.add_argument("--feature-contract", default="ml/commentary/models/feature_contract.json")
    args = parser.parse_args()

    rows = json.loads(Path(args.input).read_text(encoding="utf-8"))
    ranked = rank_templates(Path(args.model), rows, feature_contract_path=Path(args.feature_contract))
    Path(args.out).write_text(json.dumps(ranked, indent=2), encoding="utf-8")
    print(f"Wrote ranked templates to {args.out}")


if __name__ == "__main__":
    main()
