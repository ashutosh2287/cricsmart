from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

import joblib
import pandas as pd
from lightgbm import LGBMRanker
from sklearn.compose import ColumnTransformer
from sklearn.metrics import ndcg_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from ml.commentary.evaluation.dataset_validation import validate_dataset
from ml.commentary.models.feature_contract import feature_order, load_feature_contract, validate_feature_frame


FEATURE_COLUMNS = [
    "pressure_score",
    "momentum_score",
    "collapse_score",
    "partnership_strength",
    "death_over_intensity",
    "phase_of_match",
    "commentary_type",
    "tone",
]

TEMPLATE_BY_TYPE = {
    "boundary": ["boundary_pressure_release", "standard_boundary", "single_rotation"],
    "wicket": ["wicket_breakthrough", "wicket_turning_point", "collapse_warning"],
    "pressure": ["pressure_summary", "dot_ball_pressure", "momentum_shift_summary"],
    "momentum": ["momentum_shift", "momentum_shift_summary", "partnership_building"],
    "partnership": ["partnership_building", "single_rotation", "over_summary_attack"],
    "collapse": ["collapse_warning", "wicket_turning_point", "pressure_summary"],
    "turning_point": ["turning_point_summary", "wicket_turning_point", "momentum_shift_summary"],
    "summary": ["over_summary_tight", "over_summary_attack", "single_rotation"],
}


def _expand_ranking_rows(df: pd.DataFrame) -> pd.DataFrame:
    rows: List[Dict] = []
    for _, row in df.iterrows():
        commentary_type = str(row.get("commentary_type", "summary"))
        candidates = TEMPLATE_BY_TYPE.get(commentary_type, TEMPLATE_BY_TYPE["summary"])
        chosen = candidates[0]
        for rank, template_key in enumerate(candidates):
            relevance = 3 - rank if template_key == chosen else max(0, 2 - rank)
            payload = row.to_dict()
            payload["template_key"] = template_key
            payload["relevance"] = relevance
            payload["query_id"] = f"{payload.get('match_id','')}:{payload.get('innings',1)}:{payload.get('over',0)}:{payload.get('ball',0)}"
            rows.append(payload)
    return pd.DataFrame(rows)


def train_ranker(df: pd.DataFrame) -> tuple[Pipeline, float]:
    ranking_df = _expand_ranking_rows(df)

    categorical = ["phase_of_match", "commentary_type", "tone", "template_key"]
    numeric = [column for column in FEATURE_COLUMNS if column not in categorical]
    features = ranking_df[FEATURE_COLUMNS + ["template_key"]]
    labels = ranking_df["relevance"]
    query_sizes = ranking_df.groupby("query_id").size().tolist()

    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("numeric", "passthrough", numeric),
        ]
    )
    ranker = LGBMRanker(
        objective="lambdarank",
        metric="ndcg",
        n_estimators=200,
        learning_rate=0.05,
        random_state=42,
    )

    transformed = preprocessor.fit_transform(features)
    ranker.fit(transformed, labels, group=query_sizes)

    predictions = ranker.predict(transformed)
    ndcg = float(ndcg_score([labels.tolist()], [predictions.tolist()]))

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("ranker", ranker),
        ]
    )
    return pipeline, ndcg


def main() -> None:
    parser = argparse.ArgumentParser(description="Train commentary template ranker")
    parser.add_argument("--data", default="ml/commentary/datasets/processed/commentary_feature_matrix.csv")
    parser.add_argument("--out-dir", default="ml/commentary/models")
    parser.add_argument("--feature-contract", default="ml/commentary/models/feature_contract.json")
    parser.add_argument("--validation-report", default="ml/commentary/evaluation/dataset_validation_report.json")
    args = parser.parse_args()

    data_path = Path(args.data)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(data_path)

    dataset_report = validate_dataset(df)
    validation_path = Path(args.validation_report)
    validation_path.parent.mkdir(parents=True, exist_ok=True)
    validation_path.write_text(json.dumps(dataset_report, indent=2), encoding="utf-8")
    if not dataset_report["passed"]:
        raise ValueError(f"Dataset validation failed: {dataset_report['errors']}")

    contract = load_feature_contract(Path(args.feature_contract))
    contract_features = set(feature_order(contract))
    required = [feature for feature in FEATURE_COLUMNS if feature in contract_features or feature in {"commentary_type", "tone"}]

    missing = [column for column in FEATURE_COLUMNS if column not in df.columns]
    if missing:
        raise ValueError(f"Missing ranker features: {missing}")

    contract_view = pd.DataFrame({feature: df[feature] for feature in feature_order(contract) if feature in df.columns})
    valid, errors = validate_feature_frame(contract_view, contract)
    if not valid:
        raise ValueError(f"Feature contract validation failed: {errors}")

    model, ndcg = train_ranker(df)

    model_path = out_dir / "template_ranker.joblib"
    metrics_path = out_dir / "template_ranker_metrics.json"
    metadata_path = out_dir / "template_ranker_metadata.json"

    joblib.dump(model, model_path)
    metrics_path.write_text(json.dumps({"ndcg": ndcg}, indent=2), encoding="utf-8")
    metadata_path.write_text(
        json.dumps(
            {
                "model": "lightgbm_ranker",
                "schemaVersion": contract.get("schemaVersion", "v1"),
                "schemaHash": contract.get("schemaHash"),
                "features": FEATURE_COLUMNS + ["template_key"],
                "contractBackedFeatures": required,
                "rows": int(len(df)),
                "trainedAt": datetime.now(timezone.utc).isoformat(),
                "artifacts": {
                    "model": str(model_path),
                    "metrics": str(metrics_path),
                    "datasetValidation": str(validation_path),
                },
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Saved template ranker to {model_path}")


if __name__ == "__main__":
    main()
