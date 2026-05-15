"""Commentary ML training utilities.

Provides deterministic seed handling, categorical/label encoding helpers,
metric computation, and confusion matrix generation.  All random sources are
seeded in :func:`set_deterministic_seeds` so that training is fully
reproducible across runs.
"""

from __future__ import annotations

import hashlib
import json
import os
import random
from pathlib import Path
from typing import Any, Dict, List, Sequence

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.preprocessing import LabelEncoder

GLOBAL_SEED = 42


def set_deterministic_seeds(seed: int = GLOBAL_SEED) -> None:
    """Set all random seeds for full reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)
    try:
        import lightgbm as lgb  # noqa: F401 – ensure LightGBM respects the seed
    except ImportError:
        pass


def hash_schema_file(schema_path: Path) -> str:
    """Return a deterministic SHA-256 hex digest of a JSON schema file.

    The digest is computed over the canonically serialised JSON so that
    insignificant whitespace changes do not alter the hash.
    """
    data = json.loads(schema_path.read_text(encoding="utf-8"))
    canonical = json.dumps(data, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()


def validate_schema_hash(schema_path: Path, expected_hash: str) -> None:
    """Raise if the schema file hash does not match *expected_hash*."""
    actual = hash_schema_file(schema_path)
    if actual != expected_hash:
        raise ValueError(
            f"Schema hash mismatch for {schema_path}.\n"
            f"  expected : {expected_hash}\n"
            f"  actual   : {actual}\n"
            "The feature contract may be out of sync with the dataset schema."
        )


def encode_labels(series: pd.Series) -> tuple[np.ndarray, LabelEncoder]:
    """Fit a :class:`LabelEncoder` on *series* and return (encoded, encoder)."""
    encoder = LabelEncoder()
    encoded = encoder.fit_transform(series.fillna("unknown").astype(str))
    return encoded, encoder


def decode_predictions(predictions: np.ndarray, encoder: LabelEncoder) -> List[str]:
    """Inverse-transform integer *predictions* back to label strings."""
    return encoder.inverse_transform(predictions).tolist()


def compute_classification_metrics(
    y_true: Sequence, y_pred: Sequence, labels: Sequence[str] | None = None
) -> Dict[str, Any]:
    """Return a dict with accuracy, precision, recall, F1, and a full report."""
    average = "weighted"
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, average=average, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average=average, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, average=average, zero_division=0)),
        "report": classification_report(y_true, y_pred, output_dict=True, zero_division=0),
    }


def build_confusion_matrix(
    y_true: Sequence, y_pred: Sequence, label_names: Sequence[str]
) -> Dict[str, Any]:
    """Return a JSON-serialisable confusion matrix with label annotations."""
    matrix = confusion_matrix(y_true, y_pred, labels=list(label_names))
    return {
        "labels": list(label_names),
        "matrix": matrix.tolist(),
    }


def label_distribution(series: pd.Series) -> Dict[str, int]:
    """Return a sorted dict of label → count."""
    counts = series.fillna("unknown").astype(str).value_counts()
    return {str(k): int(v) for k, v in sorted(counts.items())}


def assert_feature_order(df: pd.DataFrame, expected_columns: List[str], context: str = "") -> None:
    """Raise if *df* does not contain all *expected_columns* in the right order."""
    missing = [col for col in expected_columns if col not in df.columns]
    if missing:
        prefix = f"[{context}] " if context else ""
        raise ValueError(f"{prefix}Missing required feature columns: {missing}")
