from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable

import pandas as pd


def narrative_quality(texts: Iterable[str]) -> float:
    cleaned = [text.strip() for text in texts if str(text).strip()]
    if not cleaned:
        return 0.0
    average_length = sum(len(text.split()) for text in cleaned) / len(cleaned)
    punctuation_bonus = sum(1 for text in cleaned if any(mark in text for mark in "!?,")) / len(cleaned)
    return round(min(1.0, average_length / 16.0 + punctuation_bonus * 0.15), 4)


def repetition_rate(texts: Iterable[str]) -> float:
    cleaned = [text.strip().lower() for text in texts if str(text).strip()]
    if not cleaned:
        return 0.0
    unique = len(set(cleaned))
    return round(1.0 - (unique / len(cleaned)), 4)


def contextual_accuracy(dataframe: pd.DataFrame) -> float:
    if "predicted_commentary_type" not in dataframe.columns:
        return 0.0
    return round(
        float((dataframe["predicted_commentary_type"].astype(str) == dataframe["commentary_type"].astype(str)).mean()),
        4,
    )


def pressure_alignment(dataframe: pd.DataFrame) -> float:
    if "predicted_pressure_level" not in dataframe.columns:
        return 0.0
    return round(
        float((dataframe["predicted_pressure_level"].astype(str) == dataframe["pressure_level"].astype(str)).mean()),
        4,
    )


def tone_accuracy(dataframe: pd.DataFrame) -> float:
    if "predicted_tone" not in dataframe.columns:
        return 0.0
    return round(float((dataframe["predicted_tone"].astype(str) == dataframe["tone"].astype(str)).mean()), 4)


def commentary_diversity(texts: Iterable[str]) -> float:
    cleaned = [text.strip().lower() for text in texts if str(text).strip()]
    if not cleaned:
        return 0.0
    tokens = [token for text in cleaned for token in text.split()]
    if not tokens:
        return 0.0
    return round(len(set(tokens)) / len(tokens), 4)


def evaluate_commentary_dataset(dataframe: pd.DataFrame) -> dict[str, float]:
    texts = dataframe["commentary_text"].fillna("").astype(str).tolist()
    return {
        "narrative_quality": narrative_quality(texts),
        "repetition_rate": repetition_rate(texts),
        "contextual_accuracy": contextual_accuracy(dataframe),
        "pressure_alignment": pressure_alignment(dataframe),
        "tone_accuracy": tone_accuracy(dataframe),
        "commentary_diversity": commentary_diversity(texts),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate CricSmart commentary outputs.")
    parser.add_argument("--data", default="ml/commentary/datasets/commentary_dataset.csv")
    parser.add_argument("--out", default="ml/commentary/evaluation/commentary_metrics.json")
    args = parser.parse_args()

    dataframe = pd.read_csv(args.data)
    metrics = evaluate_commentary_dataset(dataframe)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
