from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import lightgbm as lgb
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

if __package__ in {None, ""}:
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[3]))

from ml.commentary.preprocessing.feature_engineering import FEATURE_COLUMNS, build_model_features

MODEL_VERSION = "commentary-ranker-lgbm-v1"
TARGET_COLUMNS = ["commentary_type", "tone", "importance", "template_category"]


def derive_template_category(row: pd.Series) -> str:
    phase = str(row.get("phase_of_match", "MIDDLE_OVERS")).lower()
    commentary_type = str(row.get("commentary_type", "ball")).lower()
    tone = str(row.get("tone", "neutral")).lower()
    return f"{commentary_type}:{phase}:{tone}"


def make_classifier(class_count: int):
    if class_count < 2:
        return DummyClassifier(strategy="most_frequent")
    return lgb.LGBMClassifier(
        objective="multiclass",
        n_estimators=250,
        learning_rate=0.05,
        num_leaves=31,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Train CricSmart commentary ranker.")
    parser.add_argument("--data", default="ml/commentary/datasets/commentary_dataset.csv")
    parser.add_argument("--out-dir", default="ml/commentary/models")
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    dataframe = pd.read_csv(args.data)
    if dataframe.empty:
        raise ValueError("Commentary dataset is empty")
    if "template_category" not in dataframe.columns:
        dataframe["template_category"] = dataframe.apply(derive_template_category, axis=1)

    feature_frame = pd.DataFrame(
        [build_model_features(record) for record in dataframe.to_dict(orient="records")],
        columns=FEATURE_COLUMNS,
    )

    models: dict[str, Any] = {}
    encoders: dict[str, list[str]] = {}
    metrics: dict[str, Any] = {}

    for target in TARGET_COLUMNS:
        labels = dataframe[target].fillna("unknown").astype(str)
        encoder = LabelEncoder()
        encoded = encoder.fit_transform(labels)
        x_train, x_test, y_train, y_test = train_test_split(
            feature_frame,
            encoded,
            test_size=0.2,
            random_state=42,
            stratify=encoded if len(set(encoded)) > 1 else None,
        )
        classifier = make_classifier(len(encoder.classes_))
        classifier.fit(x_train, y_train)
        predicted = classifier.predict(x_test)
        models[target] = classifier
        encoders[target] = encoder.classes_.tolist()
        metrics[target] = {
            "accuracy": float(accuracy_score(y_test, predicted)),
            "classes": encoder.classes_.tolist(),
        }

    model_bundle = {
        "modelVersion": MODEL_VERSION,
        "featureColumns": FEATURE_COLUMNS,
        "targetColumns": TARGET_COLUMNS,
        "models": models,
        "labelEncodings": encoders,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
    }
    model_path = out_dir / "commentary_ranker.joblib"
    metadata_path = out_dir / "commentary_ranker_metadata.json"
    joblib.dump(model_bundle, model_path)
    metadata_path.write_text(
        json.dumps(
            {
                "modelVersion": MODEL_VERSION,
                "trainedAt": model_bundle["trainedAt"],
                "featureColumns": FEATURE_COLUMNS,
                "targetColumns": TARGET_COLUMNS,
                "metrics": metrics,
                "artifact": str(model_path.resolve()),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(json.dumps({"model": str(model_path.resolve()), "metadata": str(metadata_path.resolve()), "metrics": metrics}, indent=2))


if __name__ == "__main__":
    main()
