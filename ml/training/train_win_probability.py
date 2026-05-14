from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, log_loss
from sklearn.model_selection import train_test_split


FEATURE_COLUMNS = [
    "innings",
    "over",
    "ball",
    "currentScore",
    "wicketsLost",
    "oversCompleted",
    "ballsRemaining",
    "targetValue",
    "requiredRunRate",
    "currentRunRate",
    "recentRuns",
    "recentWickets",
    "phaseOfMatch",
    "battingFirst",
    "partnershipRuns",
]

LABEL_COLUMN = "labelBattingTeamWon"
MODEL_VERSION = "win-probability-lgbm-v1"


def main() -> None:
    parser = argparse.ArgumentParser(description="Train CricSmart win probability model.")
    parser.add_argument("--data", required=True)
    parser.add_argument("--out-dir", required=True)
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(args.data)
    if df.empty:
        raise ValueError("Training dataset is empty")

    x = df[FEATURE_COLUMNS]
    y = df[LABEL_COLUMN].astype(int)

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42, stratify=y
    )

    model = lgb.LGBMClassifier(
        objective="binary",
        n_estimators=300,
        learning_rate=0.04,
        num_leaves=31,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
    )
    model.fit(x_train, y_train)

    pred_proba = model.predict_proba(x_test)[:, 1]
    pred_label = (pred_proba >= 0.5).astype(int)

    metrics = {
        "accuracy": float(accuracy_score(y_test, pred_label)),
        "log_loss": float(log_loss(y_test, pred_proba)),
        "calibration_mean": float(np.mean(pred_proba)),
        "prediction_stability_std": float(np.std(pred_proba)),
    }

    model_path = out_dir / "win_probability_model.joblib"
    metadata_path = out_dir / "model_metadata.json"

    joblib.dump(model, model_path)

    metadata = {
        "modelVersion": MODEL_VERSION,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "featureColumns": FEATURE_COLUMNS,
        "labelColumn": LABEL_COLUMN,
        "framework": "lightgbm",
        "metrics": metrics,
        "artifact": str(model_path),
    }

    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(json.dumps({"model": str(model_path), "metadata": str(metadata_path), "metrics": metrics}, indent=2))


if __name__ == "__main__":
    main()
