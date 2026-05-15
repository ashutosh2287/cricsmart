from __future__ import annotations

import argparse
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
# LightGBM binary predict_proba output index 1 is the positive class:
# batting team wins this match state.
POSITIVE_CLASS_INDEX = 1
DECISION_BOUNDARY = 0.5
# The max distance from 0.5 is 0.5, so scale by 2.0 to normalize confidence to [0, 1].
CONFIDENCE_SCALE_FACTOR = 2.0

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


def resolve_feature_columns(metadata: dict) -> list[str]:
    feature_columns = metadata.get("featureColumns", FEATURE_COLUMNS)
    if feature_columns != FEATURE_COLUMNS:
        raise ValueError(
            "Feature column contract mismatch between script and model metadata. "
            f"Script columns: {FEATURE_COLUMNS}; metadata columns: {feature_columns}"
        )
    return feature_columns


def parse_payload_args() -> dict:
    parser = argparse.ArgumentParser(
        description="Predict batting team win probability from a match-state payload."
    )
    parser.add_argument(
        "--payload-json",
        help="JSON object payload string (example: '{\"innings\":2,...}')",
    )
    parser.add_argument(
        "--payload-file",
        help="Path to a JSON file containing the payload object",
    )
    args = parser.parse_args()

    if args.payload_json and args.payload_file:
        raise ValueError("Provide only one of --payload-json or --payload-file")
    if args.payload_json:
        payload = json.loads(args.payload_json)
        if not isinstance(payload, dict):
            raise ValueError("--payload-json must decode to a JSON object")
        return payload
    if args.payload_file:
        payload = json.loads(Path(args.payload_file).read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("--payload-file must contain a JSON object")
        return payload
    return SAMPLE_PAYLOAD


def predict(payload: dict) -> dict:
    model, metadata = load_model_and_metadata()
    feature_columns = resolve_feature_columns(metadata)

    missing = [col for col in feature_columns if col not in payload]
    if missing:
        raise KeyError(
            f"Payload is missing required feature columns: {missing}. "
            f"Expected all of: {feature_columns}"
        )
    unexpected = [key for key in payload if key not in feature_columns]
    if unexpected:
        raise KeyError(
            f"Payload has unexpected feature columns: {unexpected}. "
            f"Expected only: {feature_columns}"
        )

    feature_values = [payload[col] for col in feature_columns]
    row = np.array([feature_values])

    prob = float(model.predict_proba(row)[0][POSITIVE_CLASS_INDEX])
    # Confidence: distance from the decision boundary (0.5), scaled to [0, 1].
    # A probability of 0 or 1 yields confidence 1.0; 0.5 yields 0.0.
    confidence = float(abs(prob - DECISION_BOUNDARY) * CONFIDENCE_SCALE_FACTOR)

    return {
        "battingTeamWinProbabilityPercent": round(prob * 100, 4),
        "confidence": round(confidence, 4),
        "modelVersion": metadata.get("modelVersion", "unknown"),
        "featureColumns": feature_columns,
        "trainedAt": metadata.get("trainedAt"),
        "metrics": metadata.get("metrics"),
    }


def main() -> None:
    payload = parse_payload_args()
    result = predict(payload)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
