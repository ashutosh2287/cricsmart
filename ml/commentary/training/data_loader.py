"""Commentary ML data loader.

Loads the canonical commentary dataset, validates the schema contract,
applies deterministic feature ordering, and splits into train/validation/test
sets.  The split is always reproducible: same dataset → same splits.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd
from sklearn.model_selection import train_test_split

from ml.commentary.training.training_utils import (
    assert_feature_order,
    set_deterministic_seeds,
    validate_schema_hash,
)

# ---------------------------------------------------------------------------
# Paths relative to repository root
# ---------------------------------------------------------------------------
DEFAULT_DATASET_PATH = Path("ml/commentary/datasets/processed/commentary_feature_matrix.csv")
DEFAULT_SCHEMA_PATH = Path("ml/commentary/datasets/commentary_dataset_schema.json")
DEFAULT_CONTRACT_PATH = Path("ml/commentary/models/feature_contract.json")

CLASSIFIER_FEATURE_COLUMNS: List[str] = [
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

TARGET_COLUMNS: List[str] = ["commentary_type", "tone", "importance"]

RANKER_FEATURE_COLUMNS: List[str] = [
    "pressure_score",
    "momentum_score",
    "collapse_score",
    "partnership_strength",
    "death_over_intensity",
    "phase_of_match",
    "commentary_type",
    "tone",
]


def load_feature_contract(contract_path: Path = DEFAULT_CONTRACT_PATH) -> Dict:
    """Load and return the feature contract JSON."""
    return json.loads(contract_path.read_text(encoding="utf-8"))


def validate_dataset_schema(
    df: pd.DataFrame,
    contract: Dict,
    schema_path: Path = DEFAULT_SCHEMA_PATH,
) -> None:
    """Validate dataset against schema and feature contract.

    1. Checks schema file hash matches contract.
    2. Checks all classifier feature columns are present.
    3. Checks all target columns are present.
    """
    validate_schema_hash(schema_path, contract["schemaHash"])
    assert_feature_order(df, contract["classifierFeatures"], context="classifier features")
    assert_feature_order(df, contract["targetColumns"], context="target columns")


def load_dataset(
    dataset_path: Path = DEFAULT_DATASET_PATH,
    contract_path: Path = DEFAULT_CONTRACT_PATH,
    schema_path: Path = DEFAULT_SCHEMA_PATH,
    validate: bool = True,
) -> pd.DataFrame:
    """Load the canonical dataset, optionally validating its schema contract.

    The returned DataFrame preserves the deterministic row order from the CSV
    (ordered by match_id / innings / over / ball as written by the build step).
    """
    set_deterministic_seeds()

    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    df = pd.read_csv(dataset_path)

    if df.empty:
        raise ValueError(f"Dataset is empty: {dataset_path}")

    if validate:
        contract = load_feature_contract(contract_path)
        validate_dataset_schema(df, contract, schema_path)

    return df


def split_dataset(
    df: pd.DataFrame,
    feature_columns: List[str] = CLASSIFIER_FEATURE_COLUMNS,
    target_columns: List[str] = TARGET_COLUMNS,
    test_size: float = 0.15,
    val_size: float = 0.15,
    seed: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Split dataset into train / validation / test sets (reproducible).

    Returns:
        x_train, x_val, x_test, y_train, y_val, y_test
    """
    assert_feature_order(df, feature_columns, context="split_dataset")
    assert_feature_order(df, target_columns, context="split_dataset targets")

    features = df[feature_columns].copy()
    labels = df[target_columns].copy()

    # First carve out the test split, then split the remainder into train/val.
    x_tmp, x_test, y_tmp, y_test = train_test_split(
        features,
        labels,
        test_size=test_size,
        random_state=seed,
        stratify=labels["commentary_type"],
    )
    relative_val = val_size / (1.0 - test_size)
    x_train, x_val, y_train, y_val = train_test_split(
        x_tmp,
        y_tmp,
        test_size=relative_val,
        random_state=seed,
        stratify=y_tmp["commentary_type"],
    )
    return x_train, x_val, x_test, y_train, y_val, y_test


def load_and_split(
    dataset_path: Path = DEFAULT_DATASET_PATH,
    contract_path: Path = DEFAULT_CONTRACT_PATH,
    schema_path: Path = DEFAULT_SCHEMA_PATH,
    feature_columns: List[str] = CLASSIFIER_FEATURE_COLUMNS,
    target_columns: List[str] = TARGET_COLUMNS,
    validate: bool = True,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Convenience: load dataset and return train/val/test splits in one call."""
    df = load_dataset(dataset_path, contract_path, schema_path, validate=validate)
    return split_dataset(df, feature_columns, target_columns)
