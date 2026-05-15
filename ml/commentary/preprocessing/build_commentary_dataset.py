from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd

from ml.commentary.preprocessing.feature_engineering import build_feature_matrix
from ml.commentary.preprocessing.label_generators import apply_labels


REQUIRED_EVENT_COLUMNS = {
    "matchId",
    "innings",
    "over",
    "ball",
    "battingTeam",
    "bowlingTeam",
    "batsman",
    "nonStriker",
    "bowler",
    "runs",
    "wicket",
    "extra",
    "scoreAfterBall",
    "wicketsAfterBall",
    "target",
}


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        if pd.isna(value):
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if pd.isna(value):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _phase_for_over(over: int) -> str:
    if over < 6:
        return "powerplay"
    if over < 15:
        return "middle_overs"
    return "death_overs"


def _synthetic_commentary(row: Dict[str, Any]) -> str:
    runs = _safe_int(row.get("runs", 0))
    wicket = bool(row.get("wicket", False))
    pressure = str(row.get("pressure_level", "MEDIUM"))
    striker = str(row.get("striker", "batter"))
    bowler = str(row.get("bowler", "bowler"))

    if wicket:
        if pressure in {"HIGH", "EXTREME"}:
            return f"That could be a game-changing wicket by {bowler} under pressure."
        return f"{bowler} picks up a wicket and shifts the balance."

    if runs == 6:
        return f"Massive six from {striker} to swing momentum."
    if runs == 4 and pressure in {"HIGH", "EXTREME"}:
        return f"Massive boundary under pressure from {striker}."
    if runs == 4:
        return f"{striker} finds the fence with authority."
    if runs == 0 and pressure in {"HIGH", "EXTREME"}:
        return f"Dot ball from {bowler}, pressure keeps mounting."
    if runs == 0:
        return f"Tight line from {bowler}, no run conceded."
    if runs == 1:
        return f"{striker} rotates strike with a single."
    if runs == 2:
        return f"{striker} works hard and comes back for two."
    if runs == 3:
        return f"{striker} pushes hard and they get three."
    return f"{striker} adds {runs} run(s)."


def _compute_contextual_rows(events: pd.DataFrame) -> pd.DataFrame:
    frame = events.copy()
    frame = frame.sort_values(["matchId", "innings", "over", "ball"]).reset_index(drop=True)

    frame["ball_index"] = frame["over"] * 6 + frame["ball"]
    frame["balls_remaining"] = ((20 * 6) - frame["ball_index"]).clip(lower=0)
    frame["current_rr"] = (frame["scoreAfterBall"] * 6 / frame["ball_index"].clip(lower=1)).fillna(0.0)
    frame["required_runs"] = (frame["target"].fillna(0) - frame["scoreAfterBall"]).clip(lower=0)
    frame["required_rr"] = (
        (frame["required_runs"] * 6 / frame["balls_remaining"].replace(0, pd.NA))
        .fillna(0.0)
        .astype(float)
    )
    frame["phase_of_match"] = frame["over"].map(_phase_for_over)

    group = frame.groupby(["matchId", "innings"], dropna=False)
    frame["recent_runs"] = group["runs"].rolling(window=6, min_periods=1).sum().reset_index(level=[0, 1], drop=True)
    frame["recent_wickets"] = group["wicket"].rolling(window=6, min_periods=1).sum().reset_index(level=[0, 1], drop=True)

    # dot-ball streak
    streaks: List[int] = []
    current_key = None
    streak = 0
    for row in frame.to_dict(orient="records"):
        key = (row["matchId"], row["innings"])
        if key != current_key:
            current_key = key
            streak = 0
        if _safe_int(row.get("runs"), 0) == 0 and not bool(row.get("wicket", False)):
            streak += 1
        else:
            streak = 0
        streaks.append(streak)
    frame["dot_ball_streak"] = streaks

    # partnership
    p_runs: List[int] = []
    p_balls: List[int] = []
    partnership_runs = 0
    partnership_balls = 0
    current_key = None
    for row in frame.to_dict(orient="records"):
        key = (row["matchId"], row["innings"])
        if key != current_key:
            current_key = key
            partnership_runs = 0
            partnership_balls = 0
        if bool(row.get("wicket", False)):
            partnership_runs = 0
            partnership_balls = 0
        else:
            partnership_runs += _safe_int(row.get("runs"), 0)
            partnership_balls += 1
        p_runs.append(partnership_runs)
        p_balls.append(partnership_balls)
    frame["partnership_runs"] = p_runs
    frame["partnership_balls"] = p_balls

    frame["win_probability"] = (
        0.5
        + ((frame["current_rr"] - frame["required_rr"]) / 20.0).clip(lower=-0.35, upper=0.35)
        + ((10 - frame["wicketsAfterBall"]) / 100.0)
    ).clip(lower=0.02, upper=0.98)

    frame["collapse_risk"] = (
        frame["recent_wickets"] * 0.22
        + frame["wicketsAfterBall"] * 0.04
        + frame["dot_ball_streak"] * 0.05
    ).clip(lower=0.0, upper=1.0)
    return frame


def build_dataset(events_df: pd.DataFrame, commentary_df: pd.DataFrame | None = None) -> pd.DataFrame:
    missing = REQUIRED_EVENT_COLUMNS - set(events_df.columns)
    if missing:
        raise ValueError(f"Input events missing required columns: {sorted(missing)}")

    context_df = _compute_contextual_rows(events_df)

    rows: List[Dict[str, Any]] = []
    for row in context_df.to_dict(orient="records"):
        payload: Dict[str, Any] = {
            "match_id": row.get("matchId", ""),
            "innings": _safe_int(row.get("innings"), 1),
            "over": _safe_int(row.get("over"), 0),
            "ball": _safe_int(row.get("ball"), 0),
            "batting_team": row.get("battingTeam", ""),
            "bowling_team": row.get("bowlingTeam", ""),
            "striker": row.get("batsman", ""),
            "non_striker": row.get("nonStriker", ""),
            "bowler": row.get("bowler", ""),
            "runs": _safe_int(row.get("runs"), 0),
            "wicket": bool(row.get("wicket", False)),
            "extras": _safe_int(row.get("extra"), 0),
            "current_score": _safe_int(row.get("scoreAfterBall"), 0),
            "wickets_lost": _safe_int(row.get("wicketsAfterBall"), 0),
            "required_rr": round(_safe_float(row.get("required_rr"), 0.0), 4),
            "current_rr": round(_safe_float(row.get("current_rr"), 0.0), 4),
            "target": _safe_int(row.get("target"), 0),
            "balls_remaining": _safe_int(row.get("balls_remaining"), 0),
            "recent_runs": _safe_int(row.get("recent_runs"), 0),
            "recent_wickets": _safe_int(row.get("recent_wickets"), 0),
            "dot_ball_streak": _safe_int(row.get("dot_ball_streak"), 0),
            "partnership_runs": _safe_int(row.get("partnership_runs"), 0),
            "partnership_balls": _safe_int(row.get("partnership_balls"), 0),
            "phase_of_match": row.get("phase_of_match", "middle_overs"),
            "win_probability": round(_safe_float(row.get("win_probability"), 0.5), 4),
            "collapse_risk": round(_safe_float(row.get("collapse_risk"), 0.0), 4),
        }
        rows.append(payload)

    dataset = pd.DataFrame(rows)
    dataset = apply_labels(dataset)

    if commentary_df is not None and not commentary_df.empty:
        optional = commentary_df.rename(
            columns={
                "matchId": "match_id",
                "rawCommentary": "raw_commentary",
                "cleanedCommentary": "cleaned_commentary",
            }
        )
        merge_cols = ["match_id", "innings", "over", "ball"]
        useful_cols = [column for column in ["raw_commentary", "cleaned_commentary"] if column in optional.columns]
        optional = optional[merge_cols + useful_cols].drop_duplicates(subset=merge_cols)
        dataset = dataset.merge(optional, how="left", on=merge_cols)
        dataset["commentary_text"] = dataset["cleaned_commentary"].fillna(dataset["raw_commentary"])
    else:
        dataset["commentary_text"] = pd.NA

    dataset["commentary_text"] = dataset.apply(
        lambda row: row["commentary_text"] if isinstance(row["commentary_text"], str) and row["commentary_text"].strip() else _synthetic_commentary(row.to_dict()),
        axis=1,
    )

    dataset = build_feature_matrix(dataset)
    dataset["momentum_state"] = dataset["momentum_state"].fillna("NEUTRAL")
    dataset["pressure_level"] = dataset["pressure_level"].fillna("MEDIUM")
    return dataset


def main() -> None:
    parser = argparse.ArgumentParser(description="Build canonical one-row-per-ball commentary dataset")
    parser.add_argument("--events", required=True, help="Path to normalized deliveries CSV")
    parser.add_argument("--commentary", required=False, help="Optional cleaned commentary CSV")
    parser.add_argument(
        "--out",
        default="ml/commentary/datasets/commentary_dataset.csv",
        help="Output canonical dataset CSV path",
    )
    parser.add_argument(
        "--processed-out",
        default="ml/commentary/datasets/processed/commentary_feature_matrix.csv",
        help="Output processed feature matrix CSV path",
    )
    args = parser.parse_args()

    events_df = pd.read_csv(Path(args.events))
    commentary_df = pd.read_csv(Path(args.commentary)) if args.commentary else None

    dataset = build_dataset(events_df, commentary_df)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(out_path, index=False)

    processed_path = Path(args.processed_out)
    processed_path.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(processed_path, index=False)

    print(f"Wrote commentary dataset rows: {len(dataset)} to {out_path}")
    print(f"Wrote feature matrix rows: {len(dataset)} to {processed_path}")


if __name__ == "__main__":
    main()