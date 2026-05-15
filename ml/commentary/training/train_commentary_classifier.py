from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

import joblib
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.compose import ColumnTransformer
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from ml.commentary.evaluation.dataset_validation import validate_dataset
from ml.commentary.models.feature_contract import feature_order, load_feature_contract, validate_feature_frame


TARGET_COLUMNS = ["commentary_type", "tone", "importance"]


def _ensure_columns(df: pd.DataFrame, columns: List[str], context: str) -> None:
    missing = [column for column in columns if column not in df.columns]
    if missing:
        raise ValueError(f"Missing required {context} columns: {missing}")


def train_classifier(df: pd.DataFrame, feature_columns: list[str]) -> tuple[Pipeline, Dict[str, Dict]]:
    _ensure_columns(df, feature_columns + TARGET_COLUMNS, "dataset")

    features = df[feature_columns].copy()
    labels = df[TARGET_COLUMNS].copy()

    categorical = [column for column in feature_columns if features[column].dtype == "object"]
    numeric = [column for column in feature_columns if column not in categorical]

    x_train, x_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=42, stratify=labels["commentary_type"]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("numeric", "passthrough", numeric),
        ]
    )
    base = LGBMClassifier(
        n_estimators=250,
        learning_rate=0.05,
        num_leaves=31,
        random_state=42,
    )
    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", MultiOutputClassifier(base)),
        ]
    )
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    metrics: Dict[str, Dict] = {}
    for index, target in enumerate(TARGET_COLUMNS):
        report = classification_report(y_test[target], predictions[:, index], output_dict=True, zero_division=0)
        metrics[target] = report

    return model, metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train commentary context classifier")
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
    features = feature_order(contract)

    valid, errors = validate_feature_frame(df[features], contract)
    if not valid:
        raise ValueError(f"Feature contract validation failed: {errors}")

    model, metrics = train_classifier(df, features)

    model_path = out_dir / "classifier.joblib"
    metrics_path = out_dir / "classifier_metrics.json"
    metadata_path = out_dir / "classifier_metadata.json"

    joblib.dump(model, model_path)
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    metadata_path.write_text(
        json.dumps(
            {
                "model": "lightgbm_multioutput",
                "schemaVersion": contract.get("schemaVersion", "v1"),
                "schemaHash": contract.get("schemaHash"),
                "features": features,
                "targets": TARGET_COLUMNS,
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
    print(f"Saved classifier to {model_path}")


if __name__ == "__main__":
    main()
