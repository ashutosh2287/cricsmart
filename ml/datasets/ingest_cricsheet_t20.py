from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

import pandas as pd

PREPROCESSING_VERSION = "v1"


EVENT_TYPE_MAP = {
    "wides": "WD",
    "noballs": "NB",
    "byes": "BYE",
    "legbyes": "LB",
}


def parse_delivery_ball(ball_value: float) -> Tuple[int, int]:
    over = int(ball_value)
    ball_decimal = int(round((ball_value - over) * 10))
    ball = max(0, min(5, ball_decimal - 1 if ball_decimal > 0 else 0))
    return over, ball


def detect_event_type(runs_off_bat: int, wicket: bool, extras: Dict[str, Any]) -> str:
    if wicket:
        return "WICKET"
    if extras:
        for key, mapped in EVENT_TYPE_MAP.items():
            if extras.get(key, 0):
                return mapped
    if runs_off_bat >= 6:
        return "SIX"
    if runs_off_bat == 4:
        return "FOUR"
    return "RUN"


def load_matches(input_dir: Path) -> List[Path]:
    return sorted(list(input_dir.glob("*.json")))


def normalize_match(path: Path) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    info = payload.get("info", {})
    innings_list = payload.get("innings", [])

    format_value = (info.get("match_type") or "").upper()
    if format_value and format_value != "T20":
        return [], {}

    teams = info.get("teams") or []
    winner = (info.get("outcome") or {}).get("winner")

    rows: List[Dict[str, Any]] = []
    match_id = path.stem

    for innings_index, innings in enumerate(innings_list, start=1):
        innings_key = next(iter(innings.keys()), "")
        innings_data = innings.get(innings_key, {})
        batting_team = innings_data.get("team", "")
        bowling_team = next((t for t in teams if t != batting_team), "")
        deliveries = innings_data.get("deliveries", [])

        score = 0
        wickets = 0
        target = None
        if innings_index == 2:
            first_innings_runs = sum(
                d.get(str(next(iter(d))), {}).get("runs", {}).get("total", 0)
                for inn in innings_list[:1]
                for d in inn.get(next(iter(inn.keys())), {}).get("deliveries", [])
            )
            target = first_innings_runs + 1

        for delivery in deliveries:
            ball_key = next(iter(delivery.keys()))
            ball_data = delivery.get(ball_key, {})
            over, ball = parse_delivery_ball(float(ball_key))

            runs = ball_data.get("runs", {})
            extras = ball_data.get("extras", {})
            runs_off_bat = int(runs.get("batter", 0))
            total_runs = int(runs.get("total", 0))
            wicket = bool(ball_data.get("wickets"))
            if wicket:
                wickets += 1
            score += total_runs

            event_type = detect_event_type(runs_off_bat, wicket, extras)
            is_legal = event_type not in {"WD", "NB"}

            rows.append(
                {
                    "matchId": match_id,
                    "source": "historical",
                    "format": "T20",
                    "innings": innings_index,
                    "over": over,
                    "ball": ball,
                    "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
                    "battingTeam": batting_team,
                    "bowlingTeam": bowling_team,
                    "batsman": ball_data.get("batter", ""),
                    "nonStriker": ball_data.get("non_striker", ""),
                    "bowler": ball_data.get("bowler", ""),
                    "eventType": event_type,
                    "runs": runs_off_bat,
                    "totalRuns": total_runs,
                    "isLegalDelivery": is_legal,
                    "wicket": wicket,
                    "extra": bool(extras),
                    "extraType": next((EVENT_TYPE_MAP[k] for k in EVENT_TYPE_MAP if extras.get(k)), None),
                    "scoreAfterBall": score,
                    "wicketsAfterBall": wickets,
                    "target": target,
                    "matchWonByBattingSide": winner == batting_team if winner else None,
                }
            )

    summary = {
        "matchId": match_id,
        "format": "T20",
        "teamA": teams[0] if teams else "",
        "teamB": teams[1] if len(teams) > 1 else "",
        "winner": winner or "",
        "rows": len(rows),
    }
    return rows, summary


def write_manifest(out_dir: Path, match_count: int, row_count: int) -> None:
    manifest = {
        "datasetId": f"cricsmart-t20-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "source": "cricsheet",
        "matchCount": match_count,
        "format": "T20",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "preprocessingVersion": PREPROCESSING_VERSION,
        "files": [
            {
                "name": "normalized_deliveries",
                "path": str((out_dir / "normalized_deliveries.csv").resolve()),
                "rows": row_count,
            },
            {
                "name": "match_summary",
                "path": str((out_dir / "match_summary.csv").resolve()),
                "rows": match_count,
            },
        ],
    }
    (out_dir / "dataset_manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest Cricsheet T20 JSON to CricSmart normalized CSV.")
    parser.add_argument("--input", required=True, help="Directory containing Cricsheet JSON match files")
    parser.add_argument("--out", required=True, help="Output directory for processed dataset")
    args = parser.parse_args()

    input_dir = Path(args.input)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    all_rows: List[Dict[str, Any]] = []
    all_summaries: List[Dict[str, Any]] = []

    for match_file in load_matches(input_dir):
        rows, summary = normalize_match(match_file)
        if not rows:
            continue
        all_rows.extend(rows)
        if summary:
            all_summaries.append(summary)

    deliveries_df = pd.DataFrame(all_rows)
    summary_df = pd.DataFrame(all_summaries)

    deliveries_path = out_dir / "normalized_deliveries.csv"
    summary_path = out_dir / "match_summary.csv"

    deliveries_df.to_csv(deliveries_path, index=False)
    summary_df.to_csv(summary_path, index=False)

    write_manifest(out_dir, len(all_summaries), len(all_rows))

    print(f"Wrote {len(all_rows)} delivery rows to {deliveries_path}")
    print(f"Wrote {len(all_summaries)} match summaries to {summary_path}")


if __name__ == "__main__":
    main()
