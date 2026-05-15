from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np

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

MODEL_PATH = Path(__file__).parent.parent / "models" / "win_probability_model.joblib"
METADATA_PATH = Path(__file__).parent.parent / "models" / "model_metadata.json"

SAMPLE_PAYLOAD = {
    "innings": 2,
    "over": 14,
    "ball": 3,
    "currentScore": 112.0,
    "wicketsLost": 3.0,
    "oversCompleted": 14.0,
    "ballsRemaining": 33.0,
    "targetValue": 168.0,
    "requiredRunRate": 10.18,
    "currentRunRate": 8.0,
    "recentRuns": 22.0,
    "recentWickets": 1.0,
    "phaseOfMatch": 2.0,
    "battingFirst": 0.0,
    "partnershipRuns": 34.0,
}


def load_model_and_metadata():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model artifact not found: {MODEL_PATH}. "
            "Train the model first with ml/training/train_win_probability.py."
        )
    model = joblib.load(MODEL_PATH)
    metadata: dict = {}
    if METADATA_PATH.exists():
        metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    return model, metadata


def predict(payload: dict) -> dict:
    model, metadata = load_model_and_metadata()

    feature_values = [payload[col] for col in FEATURE_COLUMNS]
    row = np.array([feature_values])

    prob = float(model.predict_proba(row)[0][1])
    confidence = float(min(1.0, abs(prob - 0.5) * 2))

    return {
        "battingWinProbability": round(prob * 100, 4),
        "confidence": round(confidence, 4),
        "modelVersion": metadata.get("modelVersion", "unknown"),
        "featureColumns": metadata.get("featureColumns", FEATURE_COLUMNS),
        "trainedAt": metadata.get("trainedAt"),
        "metrics": metadata.get("metrics"),
    }


def main() -> None:
    result = predict(SAMPLE_PAYLOAD)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
