from __future__ import annotations

from typing import Any, Dict

import pandas as pd


PRESSURE_LEVELS = ("LOW", "MEDIUM", "HIGH", "EXTREME")
MOMENTUM_STATES = ("BATTING", "BOWLING", "NEUTRAL")
COMMENTARY_TYPES = (
    "boundary",
    "wicket",
    "pressure",
    "momentum",
    "partnership",
    "collapse",
    "turning_point",
    "summary",
)
TONE_LABELS = ("neutral", "dramatic", "energetic", "analytical", "celebratory", "tense")
IMPORTANCE_LEVELS = ("low", "medium", "high")


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


def infer_pressure_level(row: Dict[str, Any]) -> str:
    required_rr = _safe_float(row.get("required_rr", row.get("requiredRunRate", 0.0)))
    wickets_lost = _safe_int(row.get("wickets_lost", row.get("wickets", 0)))
    over = _safe_int(row.get("over", 0))
    dot_ball_streak = _safe_int(row.get("dot_ball_streak", 0))

    score = required_rr * 5.0 + wickets_lost * 2.5 + dot_ball_streak * 3.0
    if over >= 16:
        score += 8.0

    if score >= 45:
        return "EXTREME"
    if score >= 30:
        return "HIGH"
    if score >= 16:
        return "MEDIUM"
    return "LOW"


def infer_momentum_state(row: Dict[str, Any]) -> str:
    recent_runs = _safe_int(row.get("recent_runs", 0))
    recent_wickets = _safe_int(row.get("recent_wickets", 0))
    runs = _safe_int(row.get("runs", 0))
    boundaries = 1 if runs in {4, 6} else 0

    score = recent_runs + boundaries * 5 - recent_wickets * 8
    if score >= 14:
        return "BATTING"
    if score <= -6:
        return "BOWLING"
    return "NEUTRAL"


def infer_commentary_type(row: Dict[str, Any]) -> str:
    runs = _safe_int(row.get("runs", 0))
    wicket = bool(row.get("wicket", False))
    pressure_level = str(row.get("pressure_level", "MEDIUM")).upper()
    collapse_risk = _safe_float(row.get("collapse_risk", 0.0))
    partnership_runs = _safe_int(row.get("partnership_runs", 0))
    over = _safe_int(row.get("over", 0))

    if wicket:
        if collapse_risk >= 0.6:
            return "collapse"
        if over >= 16 or pressure_level in {"HIGH", "EXTREME"}:
            return "turning_point"
        return "wicket"
    if runs in {4, 6}:
        return "boundary"
    if pressure_level in {"HIGH", "EXTREME"}:
        return "pressure"
    if partnership_runs >= 35:
        return "partnership"
    if str(row.get("momentum_state", "NEUTRAL")).upper() != "NEUTRAL":
        return "momentum"
    return "summary"


def infer_tone(row: Dict[str, Any]) -> str:
    commentary_type = str(row.get("commentary_type", "summary"))
    pressure_level = str(row.get("pressure_level", "MEDIUM")).upper()
    runs = _safe_int(row.get("runs", 0))

    if commentary_type in {"wicket", "turning_point", "collapse"}:
        return "dramatic"
    if commentary_type == "boundary":
        return "celebratory" if pressure_level in {"HIGH", "EXTREME"} else "energetic"
    if commentary_type == "pressure":
        return "tense"
    if commentary_type in {"momentum", "partnership"}:
        return "analytical"
    if runs == 0 and pressure_level in {"HIGH", "EXTREME"}:
        return "tense"
    return "neutral"


def infer_importance(row: Dict[str, Any]) -> str:
    commentary_type = str(row.get("commentary_type", "summary"))
    pressure_level = str(row.get("pressure_level", "MEDIUM")).upper()

    if commentary_type in {"turning_point", "collapse"}:
        return "high"
    if commentary_type in {"wicket", "boundary"} and pressure_level in {"HIGH", "EXTREME"}:
        return "high"
    if commentary_type in {"pressure", "momentum", "partnership", "wicket", "boundary"}:
        return "medium"
    return "low"


def generate_labels(row: Dict[str, Any]) -> Dict[str, Any]:
    output = dict(row)
    output["pressure_level"] = infer_pressure_level(output)
    output["momentum_state"] = infer_momentum_state(output)
    output["commentary_type"] = infer_commentary_type(output)
    output["tone"] = infer_tone(output)
    output["importance"] = infer_importance(output)
    return output


def apply_labels(df: pd.DataFrame) -> pd.DataFrame:
    records = [generate_labels(row) for row in df.to_dict(orient="records")]
    return pd.DataFrame(records)

