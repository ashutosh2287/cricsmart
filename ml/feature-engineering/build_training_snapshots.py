from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd


REQUIRED_COLUMNS = {
    "matchId",
    "innings",
    "over",
    "ball",
    "scoreAfterBall",
    "wicketsAfterBall",
    "target",
    "runs",
    "wicket",
    "battingTeam",
    "matchWonByBattingSide",
}


def safe_div(num: float, den: float) -> float:
    return float(num / den) if den > 0 else 0.0


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Input data missing required columns: {sorted(missing)}")

    frame = df.copy()
    frame["ballIndex"] = frame["over"] * 6 + frame["ball"]
    frame["ballsRemaining"] = np.where(
        frame["innings"] == 2,
        (20 * 6) - frame["ballIndex"],
        (20 * 6) - frame["ballIndex"],
    )
    frame["currentScore"] = frame["scoreAfterBall"]
    frame["wicketsLost"] = frame["wicketsAfterBall"]
    frame["oversCompleted"] = frame["over"] + (frame["ball"] / 6.0)
    frame["targetValue"] = frame["target"].fillna(0)
    frame["requiredRuns"] = np.where(
        frame["innings"] == 2,
        np.maximum(frame["targetValue"] - frame["currentScore"], 0),
        0,
    )
    frame["requiredRunRate"] = frame.apply(
        lambda r: safe_div(r["requiredRuns"] * 6.0, r["ballsRemaining"]), axis=1
    )
    frame["currentRunRate"] = frame.apply(
        lambda r: safe_div(r["currentScore"] * 6.0, max(r["ballIndex"], 1)), axis=1
    )

    frame["recentRuns"] = (
        frame.groupby(["matchId", "innings"])["runs"]
        .rolling(window=6, min_periods=1)
        .sum()
        .reset_index(level=[0, 1], drop=True)
    )
    frame["recentWickets"] = (
        frame.groupby(["matchId", "innings"])["wicket"]
        .rolling(window=6, min_periods=1)
        .sum()
        .reset_index(level=[0, 1], drop=True)
    )

    frame["phaseOfMatch"] = np.select(
        [frame["over"] < 6, frame["over"] < 15],
        [0, 1],
        default=2,
    )
    frame["battingFirst"] = (frame["innings"] == 1).astype(int)
    frame["partnershipRuns"] = frame["recentRuns"]

    frame["labelBattingTeamWon"] = frame["matchWonByBattingSide"].fillna(False).astype(int)

    return frame[
        [
            "matchId",
            "innings",
            "over",
            "ball",
            "currentScore",
            "wicketsLost",
            "oversCompleted",
            "ballsRemaining",
            "targetValue",
            "requiredRunRate",
            "currentRunRate",
            "recentRuns",
            "recentWickets",
            "phaseOfMatch",
            "battingFirst",
            "partnershipRuns",
            "labelBattingTeamWon",
        ]
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Build ML training snapshots from normalized deliveries.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    input_path = Path(args.input)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(input_path)
    snapshots = build_features(df)
    snapshots.to_csv(out_path, index=False)

    print(f"Wrote {len(snapshots)} snapshot rows to {out_path}")


if __name__ == "__main__":
    main()
