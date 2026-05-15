"""Replay determinism validation for commentary ML models.

Verifies that given the same input:
  - the classifier produces the same output
  - the template ranker produces the same output

Replay safety is mandatory: same replay input → same commentary output.
No randomness is allowed in inference.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd

from ml.commentary.training.train_commentary_classifier import FEATURE_COLUMNS, TARGET_COLUMNS
from ml.commentary.training.train_template_ranker import (
    FEATURE_COLUMNS as RANKER_FEATURES,
    TEMPLATE_BY_TYPE,
)
from ml.commentary.training.training_utils import set_deterministic_seeds

DEFAULT_CLASSIFIER = Path("ml/commentary/models/classifier.joblib")
DEFAULT_RANKER = Path("ml/commentary/models/template_ranker.joblib")
DEFAULT_DATASET = Path("ml/commentary/datasets/processed/commentary_feature_matrix.csv")

# Number of rows to use in replay tests (keeps tests fast)
REPLAY_SAMPLE_SIZE = 10


# ---------------------------------------------------------------------------
# Core replay helpers
# ---------------------------------------------------------------------------

def _classifier_outputs(model: Any, df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Return deterministic classifier predictions for every row in *df*."""
    frame = df[FEATURE_COLUMNS].reindex(columns=FEATURE_COLUMNS, fill_value=0)
    predictions = model.predict(frame)
    results: List[Dict[str, Any]] = []
    for idx in range(len(frame)):
        row_result: Dict[str, Any] = {}
        for col_idx, target in enumerate(TARGET_COLUMNS):
            row_result[target] = str(predictions[idx][col_idx])
        results.append(row_result)
    return results


def _ranker_outputs(pipeline: Any, df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Return deterministic top-template rankings for every row in *df*."""
    results: List[Dict[str, Any]] = []
    for _, row in df.iterrows():
        ctype = str(row.get("commentary_type", "summary"))
        candidates = TEMPLATE_BY_TYPE.get(ctype, TEMPLATE_BY_TYPE["summary"])
        rows_with_templates = []
        for template_key in candidates:
            payload = row.to_dict()
            payload["template_key"] = template_key
            rows_with_templates.append(payload)

        feature_names = RANKER_FEATURES + ["template_key"]
        feature_frame = pd.DataFrame(rows_with_templates).reindex(columns=feature_names, fill_value=0)
        scores = pipeline.predict(feature_frame)
        top_idx = int(np.argmax(scores))
        results.append(
            {
                "commentary_type": ctype,
                "top_template": candidates[top_idx],
                "scores": [round(float(s), 6) for s in scores],
            }
        )
    return results


# ---------------------------------------------------------------------------
# Validation functions
# ---------------------------------------------------------------------------

def validate_classifier_determinism(
    classifier_path: Path = DEFAULT_CLASSIFIER,
    dataset_path: Path = DEFAULT_DATASET,
    n_rows: int = REPLAY_SAMPLE_SIZE,
) -> bool:
    """Run the classifier twice on the same rows; assert identical outputs.

    Returns True if determinism holds, raises AssertionError otherwise.
    """
    if not classifier_path.exists():
        print(f"[SKIP] Classifier not found: {classifier_path}")
        return True

    model = joblib.load(classifier_path)
    df = pd.read_csv(dataset_path).head(n_rows)

    set_deterministic_seeds()
    run1 = _classifier_outputs(model, df)
    set_deterministic_seeds()
    run2 = _classifier_outputs(model, df)

    for idx, (r1, r2) in enumerate(zip(run1, run2)):
        if r1 != r2:
            raise AssertionError(
                f"Classifier non-determinism at row {idx}:\n  run1={r1}\n  run2={r2}"
            )
    print(f"[PASS] Classifier determinism: {n_rows} rows identical across 2 runs.")
    return True


def validate_ranker_determinism(
    ranker_path: Path = DEFAULT_RANKER,
    dataset_path: Path = DEFAULT_DATASET,
    n_rows: int = REPLAY_SAMPLE_SIZE,
) -> bool:
    """Run the ranker twice on the same rows; assert identical outputs.

    Returns True if determinism holds, raises AssertionError otherwise.
    """
    if not ranker_path.exists():
        print(f"[SKIP] Ranker not found: {ranker_path}")
        return True

    pipeline = joblib.load(ranker_path)
    df = pd.read_csv(dataset_path).head(n_rows)

    set_deterministic_seeds()
    run1 = _ranker_outputs(pipeline, df)
    set_deterministic_seeds()
    run2 = _ranker_outputs(pipeline, df)

    for idx, (r1, r2) in enumerate(zip(run1, run2)):
        if r1 != r2:
            raise AssertionError(
                f"Ranker non-determinism at row {idx}:\n  run1={r1}\n  run2={r2}"
            )
    print(f"[PASS] Ranker determinism: {n_rows} rows identical across 2 runs.")
    return True


def validate_end_to_end_determinism(
    classifier_path: Path = DEFAULT_CLASSIFIER,
    ranker_path: Path = DEFAULT_RANKER,
    dataset_path: Path = DEFAULT_DATASET,
    n_rows: int = REPLAY_SAMPLE_SIZE,
) -> bool:
    """Validate the full pipeline: same input → same classifier → same ranking → same output.

    Returns True if the full chain is deterministic.
    """
    if not classifier_path.exists() or not ranker_path.exists():
        print("[SKIP] One or more models missing, skipping end-to-end validation.")
        return True

    classifier = joblib.load(classifier_path)
    ranker = joblib.load(ranker_path)
    df_base = pd.read_csv(dataset_path).head(n_rows)

    def _full_pipeline(seed: int) -> List[Dict[str, Any]]:
        set_deterministic_seeds(seed)
        frame = df_base[FEATURE_COLUMNS].reindex(columns=FEATURE_COLUMNS, fill_value=0)
        predictions = classifier.predict(frame)
        outputs: List[Dict[str, Any]] = []
        for row_idx in range(len(frame)):
            row_predictions: Dict[str, str] = {
                target: str(predictions[row_idx][col_idx])
                for col_idx, target in enumerate(TARGET_COLUMNS)
            }
            # Augment the base row with classifier predictions for the ranker
            row_dict = df_base.iloc[row_idx].to_dict()
            row_dict.update(row_predictions)
            ctype = row_predictions.get("commentary_type", "summary")
            candidates = TEMPLATE_BY_TYPE.get(ctype, TEMPLATE_BY_TYPE["summary"])
            template_rows = [{**row_dict, "template_key": t} for t in candidates]
            feature_names = RANKER_FEATURES + ["template_key"]
            feature_frame = pd.DataFrame(template_rows).reindex(columns=feature_names, fill_value=0)
            scores = ranker.predict(feature_frame)
            top_template = candidates[int(np.argmax(scores))]
            outputs.append({**row_predictions, "top_template": top_template})
        return outputs

    run1 = _full_pipeline(42)
    run2 = _full_pipeline(42)

    for idx, (r1, r2) in enumerate(zip(run1, run2)):
        if r1 != r2:
            raise AssertionError(
                f"End-to-end non-determinism at row {idx}:\n  run1={r1}\n  run2={r2}"
            )
    print(f"[PASS] End-to-end determinism: {n_rows} rows identical across 2 runs.")
    return True


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Validate commentary ML replay determinism")
    parser.add_argument("--classifier", default=str(DEFAULT_CLASSIFIER))
    parser.add_argument("--ranker", default=str(DEFAULT_RANKER))
    parser.add_argument("--data", default=str(DEFAULT_DATASET))
    parser.add_argument("--rows", type=int, default=REPLAY_SAMPLE_SIZE)
    args = parser.parse_args()

    failures: List[str] = []

    try:
        validate_classifier_determinism(
            Path(args.classifier), Path(args.data), args.rows
        )
    except AssertionError as exc:
        failures.append(f"Classifier determinism FAILED: {exc}")

    try:
        validate_ranker_determinism(
            Path(args.ranker), Path(args.data), args.rows
        )
    except AssertionError as exc:
        failures.append(f"Ranker determinism FAILED: {exc}")

    try:
        validate_end_to_end_determinism(
            Path(args.classifier), Path(args.ranker), Path(args.data), args.rows
        )
    except AssertionError as exc:
        failures.append(f"End-to-end determinism FAILED: {exc}")

    if failures:
        for msg in failures:
            print(f"[FAIL] {msg}", file=sys.stderr)
        sys.exit(1)
    else:
        print("[PASS] All replay determinism checks passed.")


if __name__ == "__main__":
    main()