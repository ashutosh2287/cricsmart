from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd


def parse_ball_key(ball_key: str) -> tuple[int, int]:
    value = float(ball_key)
    over = int(value)
    ball_decimal = int(round((value - over) * 10))
    ball = max(0, min(5, ball_decimal - 1 if ball_decimal > 0 else 0))
    return over, ball


def extract_rows(match_file: Path) -> List[Dict[str, Any]]:
    payload = json.loads(match_file.read_text(encoding="utf-8"))
    info = payload.get("info", {})
    tournament = info.get("event", {}).get("name") or info.get("competition") or "unknown"
    match_format = (info.get("match_type") or "T20").upper()

    rows: List[Dict[str, Any]] = []
    for innings_index, innings in enumerate(payload.get("innings", []), start=1):
        innings_key = next(iter(innings.keys()), "")
        innings_data = innings.get(innings_key, {})

        for delivery in innings_data.get("deliveries", []):
            ball_key = next(iter(delivery.keys()))
            ball_data = delivery.get(ball_key, {})

            over, ball = parse_ball_key(ball_key)
            runs = int(ball_data.get("runs", {}).get("batter", 0))
            extras = int(ball_data.get("runs", {}).get("extras", 0))
            wickets = ball_data.get("wickets") or []
            dismissal = wickets[0].get("kind") if wickets else None

            commentary_text = (
                ball_data.get("commentary")
                or ball_data.get("remark")
                or ball_data.get("notes")
                or ""
            )

            rows.append(
                {
                    "matchId": match_file.stem,
                    "tournament": tournament,
                    "format": match_format,
                    "innings": innings_index,
                    "over": over,
                    "ball": ball,
                    "batter": ball_data.get("batter", ""),
                    "bowler": ball_data.get("bowler", ""),
                    "runs": runs,
                    "extras": extras,
                    "wicket": bool(wickets),
                    "dismissalType": dismissal,
                    "rawCommentary": str(commentary_text).strip(),
                    "source": "cricsheet",
                    "ingestedAt": datetime.now(timezone.utc).isoformat(),
                }
            )

    return rows


def write_manifest(path: Path, row_count: int, source: str) -> None:
    payload = {
        "source": source,
        "preprocessingVersion": "commentary-c2-v1",
        "datasetVersion": "c2.0.0",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "rowCount": row_count,
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest Cricsheet commentary-like payload into flat rows")
    parser.add_argument("--input", required=True, help="Directory containing Cricsheet JSON files")
    parser.add_argument("--out", required=True, help="Output CSV path")
    parser.add_argument("--manifest", required=True, help="Output manifest JSON")
    args = parser.parse_args()

    input_dir = Path(args.input)
    files = sorted(input_dir.glob("*.json"))

    rows: List[Dict[str, Any]] = []
    for match_file in files:
        rows.extend(extract_rows(match_file))

    df = pd.DataFrame(rows)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)

    write_manifest(Path(args.manifest), len(df), "cricsheet")

    print(f"Ingested commentary rows: {len(df)}")


if __name__ == "__main__":
    main()
