from __future__ import annotations

from collections.abc import Hashable, Iterable, Mapping
from typing import Any, Dict, List

import pandas as pd

__all__ = ["build_feature_row", "build_feature_rows", "build_feature_matrix"]


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if pd.isna(value):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        if pd.isna(value):
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _clip(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def build_feature_row(row: Mapping[Hashable, Any]) -> Dict[str, Any]:
    required_rr = _safe_float(row.get("required_rr", 0.0))
    current_rr = _safe_float(row.get("current_rr", 0.0))
    wickets_lost = _safe_int(row.get("wickets_lost", 0))
    over = _safe_int(row.get("over", 0))
    runs = _safe_int(row.get("runs", 0))
    recent_runs = _safe_int(row.get("recent_runs", 0))
    recent_wickets = _safe_int(row.get("recent_wickets", 0))
    dot_ball_streak = _safe_int(row.get("dot_ball_streak", 0))
    partnership_runs = _safe_int(row.get("partnership_runs", 0))
    partnership_balls = _safe_int(row.get("partnership_balls", 0))
    balls_remaining = _safe_int(row.get("balls_remaining", 0))
    win_probability = _safe_float(row.get("win_probability", 0.5))

    pressure_score = _clip(required_rr * 6.0 + wickets_lost * 3.0 + dot_ball_streak * 2.5, 0.0, 100.0)
    momentum_score = _clip((recent_runs * 2.0 + (5.0 if runs in {4, 6} else 0.0)) - (recent_wickets * 12.0), -100.0, 100.0)
    collapse_score = _clip(recent_wickets * 18.0 + wickets_lost * 4.0 + dot_ball_streak * 5.0, 0.0, 100.0)
    partnership_strength = _clip((partnership_runs * 1.4) + (max(partnership_balls, 1) * 0.2), 0.0, 100.0)
    boundary_frequency = _clip((1.0 if runs in {4, 6} else 0.0) + max(recent_runs - 6, 0) / 18.0, 0.0, 1.0)
    dot_ball_pressure = _clip(dot_ball_streak / 6.0, 0.0, 1.0)
    probability_swing = _clip(abs(win_probability - 0.5) * 2.0, 0.0, 1.0)
    death_over_intensity = _clip((max(over - 14, 0) / 6.0) + ((required_rr - current_rr) / 12.0), 0.0, 1.0)

    output = {str(key): value for key, value in row.items()}
    output["pressure_score"] = round(pressure_score, 4)
    output["momentum_score"] = round(momentum_score, 4)
    output["collapse_score"] = round(collapse_score, 4)
    output["partnership_strength"] = round(partnership_strength, 4)
    output["boundary_frequency"] = round(boundary_frequency, 4)
    output["dot_ball_pressure"] = round(dot_ball_pressure, 4)
    output["probability_swing"] = round(probability_swing, 4)
    output["death_over_intensity"] = round(death_over_intensity, 4)
    output["balls_remaining_norm"] = round(_clip(balls_remaining / 120.0, 0.0, 1.0), 4)
    output["is_death_over"] = int(over >= 16)
    output["is_chase"] = int(_safe_int(row.get("innings", 1)) == 2)
    return output


def build_feature_rows(rows: Iterable[Mapping[Hashable, Any]]) -> List[Dict[str, Any]]:
    return [build_feature_row(row) for row in rows]


def build_feature_matrix(df: pd.DataFrame) -> pd.DataFrame:
    return pd.DataFrame(build_feature_rows(df.to_dict(orient="records")))
