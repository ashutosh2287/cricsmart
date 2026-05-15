from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import pandas as pd

ALLOWED_PHASES = {"POWERPLAY", "MIDDLE_OVERS", "DEATH_OVERS"}
ALLOWED_COMMENTARY_TYPES = {
    "ball",
    "over-summary",
    "pressure-summary",
    "momentum-summary",
    "turning-point",
    "boundary",
    "wicket",
    "pressure",
    "momentum",
    "partnership",
    "collapse",
    "turning_point",
    "summary",
}


def _label_imbalance(series: pd.Series) -> dict[str, Any]:
    counts = series.astype(str).value_counts(dropna=False)
    total = int(counts.sum())
    if total == 0:
        return {"ok": False, "reason": "empty_label_distribution", "counts": {}}
    max_ratio = float(counts.max() / total)
    return {
        "ok": max_ratio <= 0.95,
        "maxClassRatio": round(max_ratio, 4),
        "counts": {str(k): int(v) for k, v in counts.to_dict().items()},
    }


def validate_dataset(df: pd.DataFrame) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    missing_total = int(df.isna().sum().sum())
    if missing_total > 0:
        errors.append(f"missing_values_detected:{missing_total}")

    if "phase_of_match" in df.columns:
        invalid_phase = sorted(set(df["phase_of_match"].dropna().astype(str)) - ALLOWED_PHASES)
        if invalid_phase:
            errors.append(f"invalid_phases:{invalid_phase}")

    if "commentary_type" in df.columns:
        invalid_types = sorted(set(df["commentary_type"].dropna().astype(str)) - ALLOWED_COMMENTARY_TYPES)
        if invalid_types:
            errors.append(f"invalid_commentary_types:{invalid_types}")

    if all(col in df.columns for col in ["match_id", "innings", "over", "ball"]):
        duplicates = int(df.duplicated(subset=["match_id", "innings", "over", "ball"]).sum())
        if duplicates > 0:
            errors.append(f"duplicate_rows:{duplicates}")
    else:
        duplicates = int(df.duplicated().sum())
        if duplicates > 0:
            errors.append(f"duplicate_rows:{duplicates}")

    if "commentary_type" in df.columns:
        imbalance = _label_imbalance(df["commentary_type"])
        if not imbalance["ok"]:
            errors.append("label_imbalance_exceeds_95pct")
    else:
        imbalance = {"ok": False, "reason": "missing_commentary_type"}
        errors.append("missing_commentary_type")

    impossible_checks: list[str] = []
    if "wickets_lost" in df.columns and (df["wickets_lost"] > 10).any():
        impossible_checks.append("wickets_lost_gt_10")
    if "over" in df.columns and (df["over"] < 0).any():
        impossible_checks.append("over_lt_0")
    if "ball" in df.columns and ((df["ball"] < 0) | (df["ball"] > 5)).any():
        impossible_checks.append("ball_out_of_range_0_5")
    if "runs" in df.columns and (df["runs"] < 0).any():
        impossible_checks.append("runs_lt_0")
    if impossible_checks:
        errors.append(f"impossible_match_states:{impossible_checks}")

    drift_candidates = [
        "pressure_score",
        "momentum_score",
        "collapse_score",
        "partnership_strength",
        "probability_swing",
        "death_over_intensity",
    ]
    drift_report: dict[str, Any] = {}
    for feature in drift_candidates:
        if feature not in df.columns:
            continue
        series = pd.to_numeric(df[feature], errors="coerce")
        std = float(series.std(skipna=True)) if not series.empty else 0.0
        mean = float(series.mean(skipna=True)) if not series.empty else 0.0
        drift_report[feature] = {"mean": round(mean, 4), "std": round(std, 4)}
        if std == 0 and len(series.dropna()) > 1:
            warnings.append(f"feature_drift_constant_feature:{feature}")

    passed = len(errors) == 0
    return {
        "passed": passed,
        "rowCount": int(len(df)),
        "errors": errors,
        "warnings": warnings,
        "labelImbalance": imbalance,
        "featureDrift": drift_report,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate commentary dataset quality before training")
    parser.add_argument("--data", default="ml/commentary/datasets/processed/commentary_feature_matrix.csv")
    parser.add_argument("--out", default="ml/commentary/evaluation/dataset_validation_report.json")
    args = parser.parse_args()

    frame = pd.read_csv(args.data)
    report = validate_dataset(frame)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))

    if not report["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
