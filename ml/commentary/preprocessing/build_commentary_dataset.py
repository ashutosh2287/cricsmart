from __future__ import annotations

import argparse
import json
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import pandas as pd

if __package__ in {None, ""}:
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[3]))

from ml.commentary.preprocessing.feature_engineering import (
    build_model_features,
    collapse_risk_from_score,
    compute_probability_swing,
    compute_wicket_cluster_score,
    derive_phase_of_match,
    momentum_state_from_score,
    pressure_level_from_score,
    safe_float,
)

OUTPUT_COLUMNS = [
    "match_id",
    "innings",
    "over",
    "ball",
    "runs",
    "wicket",
    "extras",
    "batting_team",
    "bowling_team",
    "striker",
    "non_striker",
    "bowler",
    "current_score",
    "wickets_lost",
    "required_rr",
    "current_rr",
    "target",
    "recent_runs",
    "recent_wickets",
    "dot_ball_streak",
    "partnership_runs",
    "partnership_balls",
    "momentum_state",
    "pressure_level",
    "collapse_risk",
    "boundary",
    "six",
    "four",
    "phase_of_match",
    "win_probability",
    "commentary_text",
    "commentary_type",
    "importance",
    "tone",
]

EXTRA_EVENT_MAP = {
    "wides": "WD",
    "noballs": "NB",
    "byes": "BYE",
    "legbyes": "LB",
}


def parse_delivery_ball(ball_value: str) -> tuple[int, int]:
    over_str, _, ball_str = str(ball_value).partition(".")
    return int(over_str), int(ball_str or "0")


def normalize_key(payload: dict[str, Any]) -> tuple[str, int, int, int] | None:
    match_id = str(payload.get("match_id") or payload.get("matchId") or "").strip()
    if not match_id:
        return None
    innings = int(safe_float(payload.get("innings"), 1.0))
    over = int(safe_float(payload.get("over")))
    ball = int(safe_float(payload.get("ball")))
    return match_id, innings, over, ball


def load_records(path: Path) -> Iterable[dict[str, Any]]:
    if path.suffix.lower() == ".csv":
        dataframe = pd.read_csv(path)
        return dataframe.to_dict(orient="records")
    if path.suffix.lower() == ".jsonl":
        return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        if isinstance(payload.get("rows"), list):
            return payload["rows"]
        return [payload]
    return []


def load_commentary_overrides(paths: list[Path]) -> dict[tuple[str, int, int, int], dict[str, Any]]:
    overrides: dict[tuple[str, int, int, int], dict[str, Any]] = {}
    for path in paths:
        if not path.exists():
            continue
        for record in load_records(path):
            key = normalize_key(record)
            if key is None:
                continue
            overrides[key] = {
                "commentary_text": record.get("commentary_text") or record.get("commentary") or record.get("text") or "",
                "commentary_type": record.get("commentary_type") or record.get("type") or "",
                "importance": record.get("importance") or "",
                "tone": record.get("tone") or "",
            }
    return overrides


def iter_match_files(input_dir: Path) -> list[Path]:
    if not input_dir.exists():
        return []
    return sorted(path for path in input_dir.rglob("*.json") if path.is_file())


def extract_innings_payload(innings: dict[str, Any]) -> tuple[str, list[tuple[int, int, dict[str, Any]]]]:
    if "overs" in innings:
        deliveries: list[tuple[int, int, dict[str, Any]]] = []
        for over_block in innings.get("overs", []):
            over_number = int(over_block.get("over", 0))
            for ball_index, ball_data in enumerate(over_block.get("deliveries", []), start=1):
                deliveries.append((over_number, ball_index, ball_data))
        return str(innings.get("team", "")), deliveries

    innings_key = next(iter(innings.keys()), "")
    innings_data = innings.get(innings_key, {})
    deliveries = []
    for delivery in innings_data.get("deliveries", []):
        ball_key = next(iter(delivery.keys()))
        ball_data = delivery[ball_key]
        over, ball = parse_delivery_ball(ball_key)
        deliveries.append((over, ball, ball_data))
    return str(innings_data.get("team", "")), deliveries


def first_innings_target(innings_list: list[dict[str, Any]]) -> int | None:
    total = 0
    found = False
    for innings in innings_list[:1]:
        _, deliveries = extract_innings_payload(innings)
        for _, _, ball_data in deliveries:
            total += int(ball_data.get("runs", {}).get("total", 0))
            found = True
    return total + 1 if found else None


def select_commentary_type(row: dict[str, Any], feature_row: dict[str, float]) -> str:
    probability_swing = feature_row["probability_swing"]
    if row["wicket"] and (probability_swing >= 45 or row["pressure_level"] in {"HIGH", "EXTREME"}):
        return "turning_point"
    if row["recent_wickets"] >= 2 and row["collapse_risk"] == "HIGH":
        return "collapse"
    if row["wicket"]:
        return "wicket"
    if row["boundary"]:
        return "boundary"
    if row["partnership_runs"] >= 40 and row["recent_wickets"] == 0:
        return "partnership"
    if row["pressure_level"] in {"HIGH", "EXTREME"}:
        return "pressure"
    if abs(feature_row["momentum_score"]) >= 35:
        return "momentum"
    return "ball"


def select_tone(row: dict[str, Any], commentary_type: str) -> str:
    if commentary_type in {"turning_point", "wicket"} or row["pressure_level"] == "EXTREME":
        return "dramatic"
    if commentary_type == "boundary" or row["six"]:
        return "energetic"
    if commentary_type in {"pressure", "partnership", "collapse"}:
        return "analytical"
    return "neutral"


def select_importance(row: dict[str, Any], commentary_type: str) -> str:
    if commentary_type in {"turning_point", "wicket", "collapse"} or row["pressure_level"] == "EXTREME":
        return "high"
    if commentary_type in {"boundary", "pressure", "partnership", "momentum"}:
        return "medium"
    return "low"


def generate_commentary_text(row: dict[str, Any], commentary_type: str, tone: str) -> str:
    striker = row["striker"] or "the batter"
    bowler = row["bowler"] or "the bowler"
    if commentary_type == "turning_point":
        return f"Huge twist in the contest as {bowler} breaks through with the pressure peaking around {striker}."
    if commentary_type == "collapse":
        return f"Another blow for {row['batting_team']}; the innings is wobbling and the pressure keeps climbing."
    if commentary_type == "wicket":
        return f"{bowler} strikes and removes {striker}, a timely wicket for {row['bowling_team']}."
    if commentary_type == "boundary":
        shot = "maximum" if row["six"] else "boundary"
        return f"{striker} finds the {shot}, injecting fresh momentum into the innings."
    if commentary_type == "partnership":
        return f"This stand is taking shape for {row['batting_team']} as the pair steadily rebuilds momentum."
    if commentary_type == "pressure":
        return f"The pressure is {row['pressure_level'].lower()} right now as {row['batting_team']} tries to manage the rate."
    if commentary_type == "momentum":
        direction = "swinging towards the batters" if row["momentum_state"] == "BATTING" else "shifting back to the bowling side"
        return f"Momentum is {direction}, and every delivery is nudging the contest further."
    suffix = "with calm control" if tone == "neutral" else "with the contest tightening"
    return f"{striker} takes {int(row['runs'])} from the ball {suffix}."


def estimate_win_probability(row: dict[str, Any], feature_row: dict[str, float]) -> float:
    batting_dominance = feature_row["batting_dominance"]
    pressure_score = feature_row["pressure_score"]
    base = 50.0 + (batting_dominance - pressure_score) * 0.35 + feature_row["momentum_score"] * 0.18
    if row["wicket"]:
        base -= 14.0
    if row["boundary"]:
        base += 8.0
    if safe_float(row["innings"]) >= 2 and safe_float(row["target"]) > 0:
        chase_gap = safe_float(row["current_rr"]) - safe_float(row["required_rr"])
        base += chase_gap * 4.5
    return round(max(1.0, min(99.0, base)), 4)


def normalize_match(path: Path, overrides: dict[tuple[str, int, int, int], dict[str, Any]], total_overs: int) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    info = payload.get("info", {})
    innings_list = payload.get("innings", [])
    teams = info.get("teams") or []
    target = first_innings_target(innings_list)
    match_id = path.stem
    rows: list[dict[str, Any]] = []

    for innings_index, innings in enumerate(innings_list, start=1):
        batting_team, deliveries = extract_innings_payload(innings)
        bowling_team = next((team for team in teams if team != batting_team), "")

        current_score = 0
        wickets_lost = 0
        legal_balls = 0
        dot_ball_streak = 0
        partnership_runs = 0
        partnership_balls = 0
        recent_legal: deque[dict[str, int]] = deque(maxlen=6)

        for over, ball, ball_data in deliveries:
            runs_data = ball_data.get("runs", {})
            extras_data = ball_data.get("extras", {})
            total_runs = int(runs_data.get("total", 0))
            extras = int(sum(int(value) for value in extras_data.values())) if extras_data else 0
            wicket = 1 if bool(ball_data.get("wickets")) else 0
            current_score += total_runs
            wickets_lost += wicket

            extra_type = next((label for key, label in EXTRA_EVENT_MAP.items() if extras_data.get(key, 0)), "")
            boundary = 1 if total_runs in {4, 6} else 0
            four = 1 if total_runs == 4 else 0
            six = 1 if total_runs == 6 else 0
            is_legal = extra_type not in {"WD", "NB"}

            if is_legal:
                legal_balls += 1
                partnership_balls += 1
                recent_legal.append({"runs": total_runs, "wicket": wicket})
                if total_runs == 0:
                    dot_ball_streak += 1
                else:
                    dot_ball_streak = 0
            partnership_runs += total_runs

            over_progress = legal_balls / 6 if legal_balls else 0.0
            current_rr = round((current_score / over_progress) if over_progress else 0.0, 4)
            balls_remaining = max(total_overs * 6 - legal_balls, 0)
            required_rr = 0.0
            innings_target = target if innings_index == 2 else None
            if innings_target and balls_remaining > 0:
                required_rr = round(max(innings_target - current_score, 0) / balls_remaining * 6, 4)

            recent_runs = sum(item["runs"] for item in recent_legal)
            recent_wickets = sum(item["wicket"] for item in recent_legal)
            phase_of_match = derive_phase_of_match(float(over))

            row = {
                "match_id": match_id,
                "innings": innings_index,
                "over": over,
                "ball": ball,
                "runs": total_runs,
                "wicket": wicket,
                "extras": extras,
                "batting_team": batting_team,
                "bowling_team": bowling_team,
                "striker": ball_data.get("batter", ""),
                "non_striker": ball_data.get("non_striker", ""),
                "bowler": ball_data.get("bowler", ""),
                "current_score": current_score,
                "wickets_lost": wickets_lost,
                "required_rr": required_rr,
                "current_rr": current_rr,
                "target": innings_target or 0,
                "recent_runs": recent_runs,
                "recent_wickets": recent_wickets,
                "dot_ball_streak": dot_ball_streak,
                "partnership_runs": partnership_runs,
                "partnership_balls": partnership_balls,
                "boundary": boundary,
                "six": six,
                "four": four,
                "phase_of_match": phase_of_match,
            }
            feature_row = build_model_features(row)
            probability_swing = compute_probability_swing(
                pressure_score=feature_row["pressure_score"],
                momentum_score=feature_row["momentum_score"],
                wicket=float(wicket),
                boundary=float(boundary),
                recent_wickets=float(recent_wickets),
            )
            row["momentum_state"] = momentum_state_from_score(feature_row["momentum_score"])
            row["pressure_level"] = pressure_level_from_score(feature_row["pressure_score"])
            row["collapse_risk"] = collapse_risk_from_score(
                compute_wicket_cluster_score(float(recent_wickets), float(wickets_lost))
            )
            row["win_probability"] = estimate_win_probability(row, feature_row)

            override = overrides.get((match_id, innings_index, over, ball), {})
            commentary_type = override.get("commentary_type") or select_commentary_type(row, feature_row | {"probability_swing": probability_swing})
            tone = override.get("tone") or select_tone(row, commentary_type)
            importance = override.get("importance") or select_importance(row, commentary_type)
            row["commentary_text"] = override.get("commentary_text") or generate_commentary_text(row, commentary_type, tone)
            row["commentary_type"] = commentary_type
            row["importance"] = importance
            row["tone"] = tone
            rows.append({column: row[column] for column in OUTPUT_COLUMNS})

            if wicket:
                partnership_runs = 0
                partnership_balls = 0

    return rows


def write_manifest(output_path: Path, rows: list[dict[str, Any]], source_match_count: int) -> None:
    manifest = {
        "dataset": output_path.name,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "rowCount": len(rows),
        "matchCount": source_match_count,
        "columns": OUTPUT_COLUMNS,
    }
    output_path.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build CricSmart commentary dataset with one row per ball.")
    parser.add_argument("--cricsheet-dir", default="ml/datasets/raw/cricsheet", help="Directory with Cricsheet JSON files")
    parser.add_argument("--commentary-source", action="append", default=[], help="Optional commentary CSV/JSON/JSONL source")
    parser.add_argument("--synthetic-source", action="append", default=[], help="Optional synthetic commentary source")
    parser.add_argument("--live-source", action="append", default=[], help="Optional live commentary source")
    parser.add_argument("--out", default="ml/commentary/datasets/commentary_dataset.csv", help="Output dataset path")
    parser.add_argument("--max-matches", type=int, default=0, help="Optional cap for number of matches to process")
    parser.add_argument("--overs", type=int, default=20, help="Expected overs for target/rr calculations")
    args = parser.parse_args()

    output_path = Path(args.out)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    override_paths = [Path(item) for item in [*args.commentary_source, *args.synthetic_source, *args.live_source]]
    overrides = load_commentary_overrides(override_paths)

    match_files = iter_match_files(Path(args.cricsheet_dir))
    if args.max_matches > 0:
        match_files = match_files[: args.max_matches]

    all_rows: list[dict[str, Any]] = []
    for match_path in match_files:
        all_rows.extend(normalize_match(match_path, overrides, args.overs))

    dataframe = pd.DataFrame(all_rows, columns=OUTPUT_COLUMNS)
    dataframe.to_csv(output_path, index=False)
    write_manifest(output_path, all_rows, len(match_files))
    print(f"Wrote {len(all_rows)} commentary rows to {output_path}")


if __name__ == "__main__":
    main()
