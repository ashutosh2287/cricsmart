from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from ml.commentary.training.training_utils import (
    build_confusion_matrix,
    compute_classification_metrics,
    hash_schema_file,
    label_distribution,
    set_deterministic_seeds,
    validate_schema_hash,
)

DEFAULT_CONTRACT_PATH = Path("ml/commentary/models/feature_contract.json")
DEFAULT_SCHEMA_PATH = Path("ml/commentary/datasets/commentary_dataset_schema.json")

FEATURE_COLUMNS = [
    "innings",
    "over",
    "ball",
    "runs",
    "wicket",
    "extras",
    "current_score",
    "wickets_lost",
    "required_rr",
    "current_rr",
    "target",
    "balls_remaining",
    "recent_runs",
    "recent_wickets",
    "dot_ball_streak",
    "partnership_runs",
    "partnership_balls",
    "phase_of_match",
    "win_probability",
    "pressure_score",
    "momentum_score",
    "collapse_score",
    "partnership_strength",
    "boundary_frequency",
    "dot_ball_pressure",
    "probability_swing",
    "death_over_intensity",
]
TARGET_COLUMNS = ["commentary_type", "tone", "importance"]


def _ensure_columns(df: pd.DataFrame, columns: List[str], context: str) -> None:
    missing = [column for column in columns if column not in df.columns]
    if missing:
        raise ValueError(f"Missing required {context} columns: {missing}")


def _load_contract(contract_path: Path) -> Dict[str, Any]:
    return json.loads(contract_path.read_text(encoding="utf-8"))


def train_classifier(
    df: pd.DataFrame,
    schema_path: Path = DEFAULT_SCHEMA_PATH,
    contract_path: Path = DEFAULT_CONTRACT_PATH,
) -> tuple[Pipeline, Dict[str, Any]]:
    """Train the multi-output commentary context classifier.

    Validates the schema contract before training.  Returns the fitted
    pipeline and a metrics dict keyed by target column.  Each entry
    contains accuracy, precision, recall, F1, and a confusion matrix.
    """
    set_deterministic_seeds()

    # Schema contract validation
    if contract_path.exists() and schema_path.exists():
        contract = _load_contract(contract_path)
        validate_schema_hash(schema_path, contract["schemaHash"])

    _ensure_columns(df, FEATURE_COLUMNS + TARGET_COLUMNS, "dataset")

    features = df[FEATURE_COLUMNS].copy()
    labels = df[TARGET_COLUMNS].copy()

    categorical = [
        column for column in FEATURE_COLUMNS
        if pd.api.types.is_string_dtype(features[column]) or pd.api.types.is_object_dtype(features[column])
    ]
    numeric = [column for column in FEATURE_COLUMNS if column not in categorical]

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
        verbose=-1,
    )
    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", MultiOutputClassifier(base)),
        ]
    )
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    metrics: Dict[str, Any] = {}
    for index, target in enumerate(TARGET_COLUMNS):
        y_true = y_test[target].tolist()
        y_pred = list(predictions[:, index])
        label_names = sorted(set(y_true) | set(y_pred))
        metrics[target] = {
            **compute_classification_metrics(y_true, y_pred),
            "confusion_matrix": build_confusion_matrix(y_true, y_pred, label_names),
            "label_distribution": label_distribution(y_test[target]),
        }

    return model, metrics


def predict_with_confidence(
    model: Pipeline,
    features: pd.DataFrame,
) -> List[Dict[str, Any]]:
    """Return per-row predictions with per-target confidence scores.

    Each row result has the shape::

        {
          "commentary_type": "pressure",
          "commentary_type_confidence": 0.92,
          "tone": "tense",
          "tone_confidence": 0.81,
          "importance": "high",
          "importance_confidence": 0.74,
        }
    """
    frame = features.reindex(columns=FEATURE_COLUMNS, fill_value=0)
    predictions = model.predict(frame)
    # MultiOutputClassifier stores per-estimator predict_proba lists
    proba_list: List[np.ndarray] = model.predict_proba(frame)  # type: ignore[attr-defined]

    results: List[Dict[str, Any]] = []
    for row_idx in range(len(frame)):
        payload: Dict[str, Any] = {}
        for col_idx, target in enumerate(TARGET_COLUMNS):
            label = predictions[row_idx][col_idx]
            proba_row = proba_list[col_idx][row_idx]
            confidence = float(np.max(proba_row))
            payload[target] = label
            payload[f"{target}_confidence"] = round(confidence, 4)
        results.append(payload)
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Train commentary context classifier")
    parser.add_argument("--data", default="ml/commentary/datasets/processed/commentary_feature_matrix.csv")
    parser.add_argument("--out-dir", default="ml/commentary/models")
    parser.add_argument("--schema", default=str(DEFAULT_SCHEMA_PATH))
    parser.add_argument("--contract", default=str(DEFAULT_CONTRACT_PATH))
    args = parser.parse_args()

    data_path = Path(args.data)
    out_dir = Path(args.out_dir)
    schema_path = Path(args.schema)
    contract_path = Path(args.contract)
    out_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(data_path)
    model, metrics = train_classifier(df, schema_path=schema_path, contract_path=contract_path)

    model_path = out_dir / "classifier.joblib"
    metrics_path = out_dir / "classifier_metrics.json"
    metadata_path = out_dir / "classifier_metadata.json"
    training_summary_path = out_dir / "training_summary.json"

    joblib.dump(model, model_path)
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    schema_hash = hash_schema_file(schema_path) if schema_path.exists() else ""
    contract = _load_contract(contract_path) if contract_path.exists() else {}

    # Derive label mappings from training data
    label_mappings: Dict[str, List[str]] = {}
    for target in TARGET_COLUMNS:
        label_mappings[target] = sorted(df[target].dropna().astype(str).unique().tolist())

    metadata: Dict[str, Any] = {
        "model": "lightgbm_multioutput",
        "schemaVersion": contract.get("schemaVersion", ""),
        "featureContractHash": schema_hash,
        "datasetVersion": contract.get("datasetVersion", ""),
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "featureOrdering": FEATURE_COLUMNS,
        "targetColumns": TARGET_COLUMNS,
        "labelMappings": label_mappings,
        "rows": int(len(df)),
        "evaluationMetrics": {
            target: {
                "accuracy": metrics[target]["accuracy"],
                "precision": metrics[target]["precision"],
                "recall": metrics[target]["recall"],
                "f1": metrics[target]["f1"],
            }
            for target in TARGET_COLUMNS
        },
        "artifacts": {
            "model": str(model_path),
            "metrics": str(metrics_path),
        },
    }
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    training_summary: Dict[str, Any] = {
        "trainedAt": metadata["trainedAt"],
        "datasetStats": {
            "rows": int(len(df)),
            "columns": list(df.columns),
            "labelDistributions": {t: label_distribution(df[t]) for t in TARGET_COLUMNS},
        },
        "featureImportance": {},  # populated post-hoc if needed
        "evaluationMetrics": metadata["evaluationMetrics"],
        "labelMappings": label_mappings,
        "schemaVersion": metadata["schemaVersion"],
        "featureContractHash": schema_hash,
    }
    training_summary_path.write_text(json.dumps(training_summary, indent=2), encoding="utf-8")

    print(f"Saved classifier to {model_path}")
    print(f"Saved metadata to {metadata_path}")
    print(f"Saved training summary to {training_summary_path}")


if __name__ == "__main__":
    main()