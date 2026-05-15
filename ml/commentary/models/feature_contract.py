from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


DEFAULT_FEATURE_CONTRACT_PATH = Path("ml/commentary/models/feature_contract.json")


def compute_schema_hash(contract: dict[str, Any]) -> str:
    normalized = {key: contract[key] for key in contract.keys() if key != "schemaHash"}
    payload = json.dumps(normalized, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def load_feature_contract(path: Path | str = DEFAULT_FEATURE_CONTRACT_PATH) -> dict[str, Any]:
    contract_path = Path(path)
    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    expected = str(contract.get("schemaHash", "")).strip()
    actual = compute_schema_hash(contract)
    if expected and expected != actual:
        raise ValueError(f"Feature contract schema hash mismatch: expected={expected}, actual={actual}")
    contract["schemaHash"] = actual
    return contract


def feature_order(contract: dict[str, Any]) -> list[str]:
    return [str(feature["name"]) for feature in contract.get("features", [])]


def validate_feature_frame(df: pd.DataFrame, contract: dict[str, Any]) -> tuple[bool, list[str]]:
    errors: list[str] = []
    ordered_features = feature_order(contract)

    for feature in ordered_features:
        if feature not in df.columns:
            errors.append(f"missing_feature:{feature}")

    extra = [column for column in df.columns if column not in ordered_features]
    if extra:
        errors.append(f"unexpected_features:{extra}")

    expected_order = ordered_features
    received_order = [column for column in df.columns if column in expected_order]
    if received_order != expected_order:
        errors.append("feature_order_mismatch")

    spec_by_name = {item["name"]: item for item in contract.get("features", [])}

    for feature in ordered_features:
        if feature not in df.columns:
            continue
        series = df[feature]
        if series.isna().any():
            errors.append(f"nan_values:{feature}")

        spec = spec_by_name.get(feature, {})
        ftype = spec.get("type")

        if ftype in {"float", "int"}:
            numeric = pd.to_numeric(series, errors="coerce")
            if numeric.isna().any():
                errors.append(f"non_numeric_values:{feature}")
            if ftype == "int" and (numeric % 1 != 0).any():
                errors.append(f"non_int_values:{feature}")
        if ftype == "categorical":
            allowed = set(str(value) for value in spec.get("categories", []))
            observed = set(str(value) for value in series.astype(str).unique())
            invalid = sorted(observed - allowed)
            if invalid:
                errors.append(f"invalid_categories:{feature}:{invalid}")

        values = pd.to_numeric(series, errors="coerce")
        if np.isnan(values.to_numpy()).any():
            errors.append(f"nan_values_after_cast:{feature}")

    return len(errors) == 0, errors
