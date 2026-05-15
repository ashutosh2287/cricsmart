from __future__ import annotations

from typing import Any, Mapping

FEATURE_COLUMNS = [
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
    "recent_runs",
    "recent_wickets",
    "dot_ball_streak",
    "partnership_runs",
    "partnership_balls",
    "boundary",
    "six",
    "four",
    "phase_id",
    "pressure_score",
    "momentum_score",
    "wicket_cluster_score",
    "chase_pressure",
    "partnership_stability",
    "death_over_intensity",
    "batting_dominance",
    "probability_swing",
]

RETRIEVAL_FEATURE_COLUMNS = [
    "phase_id",
    "pressure_score",
    "momentum_score",
    "wickets_lost",
    "recent_runs",
    "recent_wickets",
    "dot_ball_streak",
    "partnership_runs",
    "partnership_stability",
    "death_over_intensity",
    "batting_dominance",
    "probability_swing",
]

PHASE_TO_ID = {
    "POWERPLAY": 0.0,
    "MIDDLE_OVERS": 1.0,
    "DEATH_OVERS": 2.0,
}
PRESSURE_TO_SCORE = {
    "LOW": 20.0,
    "MEDIUM": 45.0,
    "HIGH": 70.0,
    "EXTREME": 90.0,
}
MOMENTUM_TO_SCORE = {
    "BATTING": 65.0,
    "NEUTRAL": 0.0,
    "BOWLING": -65.0,
}


def clamp(value: float, minimum: float = 0.0, maximum: float = 100.0) -> float:
    return max(minimum, min(maximum, value))


def safe_float(value: Any, default: float = 0.0) -> float:
    if value in (None, ""):
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_divide(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator


def derive_phase_of_match(over: float) -> str:
    if over < 6:
        return "POWERPLAY"
    if over >= 16:
        return "DEATH_OVERS"
    return "MIDDLE_OVERS"


def compute_pressure_score(
    *,
    innings: float,
    required_rr: float,
    current_rr: float,
    wickets_lost: float,
    target: float,
    current_score: float,
    over: float,
) -> float:
    target_gap = max(target - current_score, 0.0) if innings >= 2 and target > 0 else 0.0
    chase_gap = max(required_rr - current_rr, 0.0)
    innings_pressure = over * 1.6 if innings >= 2 else max(current_rr - 8.0, 0.0) * 5.5
    return round(
        clamp(
            chase_gap * 14.0
            + wickets_lost * 4.5
            + safe_divide(target_gap, 2.5)
            + innings_pressure,
            0.0,
            100.0,
        ),
        4,
    )


def compute_momentum_score(
    *,
    recent_runs: float,
    recent_wickets: float,
    dot_ball_streak: float,
    boundary: float,
    wicket: float,
    batting_dominance: float,
) -> float:
    score = (
        recent_runs * 4.0
        + boundary * 18.0
        + batting_dominance * 0.35
        - recent_wickets * 28.0
        - dot_ball_streak * 5.5
        - wicket * 22.0
    )
    return round(clamp(score, -100.0, 100.0), 4)


def compute_wicket_cluster_score(recent_wickets: float, wickets_lost: float) -> float:
    return round(clamp(recent_wickets * 28.0 + wickets_lost * 3.0, 0.0, 100.0), 4)


def compute_chase_pressure(
    *, innings: float, required_rr: float, current_rr: float, over: float
) -> float:
    if innings < 2:
        return 0.0
    return round(clamp((required_rr - current_rr) * 12.0 + over * 2.5, 0.0, 100.0), 4)


def compute_partnership_stability(
    *, partnership_runs: float, partnership_balls: float, recent_wickets: float
) -> float:
    strike_value = safe_divide(partnership_runs * 100.0, max(partnership_balls, 1.0))
    stability = strike_value * 0.55 + partnership_runs * 0.6 - recent_wickets * 18.0
    return round(clamp(stability, 0.0, 100.0), 4)


def compute_death_over_intensity(over: float, pressure_score: float) -> float:
    death_weight = 0.0 if over < 16 else (over - 15.0) * 12.0
    return round(clamp(death_weight + pressure_score * 0.4, 0.0, 100.0), 4)


def compute_batting_dominance(
    *, current_rr: float, required_rr: float, recent_runs: float, recent_wickets: float
) -> float:
    balance = current_rr * 8.5 + recent_runs * 2.0 - required_rr * 4.5 - recent_wickets * 15.0
    return round(clamp(balance, 0.0, 100.0), 4)


def compute_probability_swing(
    *,
    pressure_score: float,
    momentum_score: float,
    wicket: float,
    boundary: float,
    recent_wickets: float,
) -> float:
    swing = abs(momentum_score) * 0.45 + pressure_score * 0.25 + wicket * 20.0 + boundary * 10.0 + recent_wickets * 6.0
    return round(clamp(swing, 0.0, 100.0), 4)


def pressure_level_from_score(score: float) -> str:
    if score >= 85:
        return "EXTREME"
    if score >= 65:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    return "LOW"


def momentum_state_from_score(score: float) -> str:
    if score >= 25:
        return "BATTING"
    if score <= -25:
        return "BOWLING"
    return "NEUTRAL"


def collapse_risk_from_score(score: float) -> str:
    if score >= 70:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    return "LOW"


def build_model_features(row: Mapping[str, Any]) -> dict[str, float]:
    innings = safe_float(row.get("innings"), 1.0)
    over = safe_float(row.get("over"))
    ball = safe_float(row.get("ball"))
    runs = safe_float(row.get("runs"))
    wicket = safe_float(row.get("wicket"))
    extras = safe_float(row.get("extras"))
    current_score = safe_float(row.get("current_score"))
    wickets_lost = safe_float(row.get("wickets_lost"))
    required_rr = safe_float(row.get("required_rr"))
    current_rr = safe_float(row.get("current_rr"))
    recent_runs = safe_float(row.get("recent_runs"))
    recent_wickets = safe_float(row.get("recent_wickets"))
    dot_ball_streak = safe_float(row.get("dot_ball_streak"))
    partnership_runs = safe_float(row.get("partnership_runs"))
    partnership_balls = safe_float(row.get("partnership_balls"))
    target = safe_float(row.get("target"))
    boundary = safe_float(row.get("boundary"))
    six = safe_float(row.get("six"))
    four = safe_float(row.get("four"))

    phase = str(row.get("phase_of_match") or derive_phase_of_match(over)).upper()
    phase_id = PHASE_TO_ID.get(phase, PHASE_TO_ID[derive_phase_of_match(over)])

    batting_dominance = compute_batting_dominance(
        current_rr=current_rr,
        required_rr=required_rr,
        recent_runs=recent_runs,
        recent_wickets=recent_wickets,
    )
    pressure_score = safe_float(row.get("pressure_score")) or compute_pressure_score(
        innings=innings,
        required_rr=required_rr,
        current_rr=current_rr,
        wickets_lost=wickets_lost,
        target=target,
        current_score=current_score,
        over=over,
    )
    momentum_score = safe_float(row.get("momentum_score"))
    if momentum_score == 0.0 and str(row.get("momentum_state") or "").upper() in MOMENTUM_TO_SCORE:
        momentum_score = MOMENTUM_TO_SCORE[str(row.get("momentum_state")).upper()]
    if momentum_score == 0.0:
        momentum_score = compute_momentum_score(
            recent_runs=recent_runs,
            recent_wickets=recent_wickets,
            dot_ball_streak=dot_ball_streak,
            boundary=boundary,
            wicket=wicket,
            batting_dominance=batting_dominance,
        )

    wicket_cluster_score = safe_float(row.get("wicket_cluster_score")) or compute_wicket_cluster_score(
        recent_wickets=recent_wickets,
        wickets_lost=wickets_lost,
    )
    chase_pressure = safe_float(row.get("chase_pressure")) or compute_chase_pressure(
        innings=innings,
        required_rr=required_rr,
        current_rr=current_rr,
        over=over,
    )
    partnership_stability = safe_float(row.get("partnership_stability")) or compute_partnership_stability(
        partnership_runs=partnership_runs,
        partnership_balls=partnership_balls,
        recent_wickets=recent_wickets,
    )
    death_over_intensity = safe_float(row.get("death_over_intensity")) or compute_death_over_intensity(
        over=over,
        pressure_score=pressure_score,
    )
    probability_swing = safe_float(row.get("probability_swing")) or compute_probability_swing(
        pressure_score=pressure_score,
        momentum_score=momentum_score,
        wicket=wicket,
        boundary=boundary,
        recent_wickets=recent_wickets,
    )

    return {
        "innings": innings,
        "over": over,
        "ball": ball,
        "runs": runs,
        "wicket": wicket,
        "extras": extras,
        "current_score": current_score,
        "wickets_lost": wickets_lost,
        "required_rr": required_rr,
        "current_rr": current_rr,
        "recent_runs": recent_runs,
        "recent_wickets": recent_wickets,
        "dot_ball_streak": dot_ball_streak,
        "partnership_runs": partnership_runs,
        "partnership_balls": partnership_balls,
        "boundary": boundary,
        "six": six,
        "four": four,
        "phase_id": phase_id,
        "pressure_score": pressure_score,
        "momentum_score": momentum_score,
        "wicket_cluster_score": wicket_cluster_score,
        "chase_pressure": chase_pressure,
        "partnership_stability": partnership_stability,
        "death_over_intensity": death_over_intensity,
        "batting_dominance": batting_dominance,
        "probability_swing": probability_swing,
    }


def build_retrieval_features(row: Mapping[str, Any]) -> dict[str, float]:
    features = build_model_features(row)
    return {name: features[name] for name in RETRIEVAL_FEATURE_COLUMNS}


def build_retrieval_query_features(query: Mapping[str, Any]) -> dict[str, float]:
    phase_value = str(query.get("phase_of_match") or query.get("over_phase") or "MIDDLE_OVERS").upper()
    pressure_value = str(query.get("pressure") or query.get("pressure_level") or "MEDIUM").upper()
    momentum_value = str(query.get("momentum") or query.get("momentum_state") or "NEUTRAL").upper()

    features = {
        "phase_id": PHASE_TO_ID.get(phase_value, 1.0),
        "pressure_score": safe_float(query.get("pressure_score"), PRESSURE_TO_SCORE.get(pressure_value, 45.0)),
        "momentum_score": safe_float(query.get("momentum_score"), MOMENTUM_TO_SCORE.get(momentum_value, 0.0)),
        "wickets_lost": safe_float(query.get("wickets") or query.get("wickets_lost")),
        "recent_runs": safe_float(query.get("recent_runs")),
        "recent_wickets": safe_float(query.get("recent_wickets")),
        "dot_ball_streak": safe_float(query.get("dot_ball_streak")),
        "partnership_runs": safe_float(query.get("partnership_runs")),
        "partnership_stability": safe_float(query.get("partnership_stability")),
        "death_over_intensity": safe_float(query.get("death_over_intensity")),
        "batting_dominance": safe_float(query.get("batting_dominance")),
        "probability_swing": safe_float(query.get("probability_swing")),
    }
    if features["partnership_stability"] == 0.0:
        features["partnership_stability"] = compute_partnership_stability(
            partnership_runs=features["partnership_runs"],
            partnership_balls=safe_float(query.get("partnership_balls")),
            recent_wickets=features["recent_wickets"],
        )
    if features["death_over_intensity"] == 0.0:
        over = 17.0 if phase_value == "DEATH_OVERS" else 10.0
        features["death_over_intensity"] = compute_death_over_intensity(
            over=over,
            pressure_score=features["pressure_score"],
        )
    if features["batting_dominance"] == 0.0:
        features["batting_dominance"] = clamp(50.0 + features["momentum_score"] * 0.45, 0.0, 100.0)
    return features
