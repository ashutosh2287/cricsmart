from __future__ import annotations

import json
from collections import deque
from pathlib import Path

import pandas as pd

# =========================================
# DATASET PATH
# =========================================

DATASET_PATH = Path("ml/datasets/raw/cricsheet/men_t20")

# =========================================
# STORAGE FOR TRAINING ROWS
# =========================================

rows = []

# =========================================
# PHASE HELPER
# =========================================


def phase_of_match(over_number: int) -> int:
    """Return phase index: 0 = powerplay (overs 0-5), 1 = middle (overs 6-14), 2 = death (overs 15-19)."""
    if over_number <= 5:
        return 0
    if over_number <= 14:
        return 1
    return 2


# =========================================
# LOOP THROUGH ALL MATCH FILES
# =========================================

for file_path in DATASET_PATH.glob("*.json"):

    print(f"\nProcessing match: {file_path.name}")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            match = json.load(f)

    except Exception as e:
        print(f"Failed to load {file_path.name}: {e}")
        continue

    # =========================================
    # MATCH INFO
    # =========================================

    info = match.get("info", {})
    innings_list = match.get("innings", [])

    # Skip invalid matches
    if len(innings_list) < 2:
        print("Skipped (not enough innings)")
        continue

    outcome = info.get("outcome", {})
    winner = outcome.get("winner")

    # =========================================
    # FIRST INNINGS TOTAL (to derive target for 2nd innings)
    # =========================================

    innings1_total = 0

    for over_data in innings_list[0].get("overs", []):
        for delivery in over_data.get("deliveries", []):
            innings1_total += delivery["runs"]["total"]

    target = innings1_total + 1

    # =========================================
    # PROCESS BOTH INNINGS
    # =========================================

    for innings_index, innings_data in enumerate(innings_list[:2]):

        innings_number = innings_index + 1
        batting_team = innings_data.get("team")
        batting_team_won = 1 if batting_team == winner else 0
        batting_first = 1 if innings_number == 1 else 0

        # Per-innings running state
        score = 0
        wickets = 0
        legal_balls = 0
        partnership_runs = 0

        # Sliding window of (total_runs, is_wicket) for last 12 legal balls
        recent_window: deque[tuple[int, int]] = deque()

        # =========================================
        # PROCESS EVERY BALL
        # =========================================

        for over_data in innings_data.get("overs", []):

            over_number = over_data.get("over", 0)
            deliveries = over_data.get("deliveries", [])

            for ball_index, delivery in enumerate(deliveries):

                # =========================================
                # RUNS
                # =========================================

                runs = delivery["runs"]["total"]
                batter_runs = delivery["runs"].get("batter", 0)

                score += runs

                # =========================================
                # WICKETS
                # =========================================

                is_wicket = 1 if "wickets" in delivery else 0

                if is_wicket:
                    wickets += len(delivery["wickets"])

                # =========================================
                # LEGAL BALL CHECK
                # wides/no-balls don't count as legal deliveries
                # =========================================

                extras = delivery.get("extras", {})
                is_wide = "wides" in extras
                is_noball = "noballs" in extras
                is_legal = not is_wide and not is_noball

                if is_legal:
                    legal_balls += 1
                    recent_window.append((runs, is_wicket))
                    if len(recent_window) > 12:
                        recent_window.popleft()

                # =========================================
                # PARTNERSHIP TRACKING
                # Accumulate batter runs (excluding the delivery on which a
                # wicket falls); reset to 0 after a wicket.
                # =========================================

                if not is_wicket:
                    partnership_runs += batter_runs
                row_partnership = partnership_runs
                if is_wicket:
                    partnership_runs = 0

                # =========================================
                # DERIVED FEATURES
                # =========================================

                balls_remaining = max(120 - legal_balls, 0)
                overs_completed = legal_balls // 6

                current_rr = (score / (legal_balls / 6)) if legal_balls > 0 else 0.0

                if innings_number == 2:
                    runs_needed = max(target - score, 0)
                    required_rr = (
                        runs_needed / (balls_remaining / 6)
                        if balls_remaining > 0 else 0.0
                    )
                    target_value = target
                else:
                    required_rr = 0.0
                    target_value = 0

                recent_runs = sum(r for r, _ in recent_window)
                recent_wickets = sum(w for _, w in recent_window)

                # =========================================
                # SAVE TRAINING ROW
                # =========================================

                row = {
                    "match_id": file_path.stem,
                    "innings": innings_number,
                    "over": over_number,
                    "ball": ball_index + 1,
                    "currentScore": score,
                    "wicketsLost": wickets,
                    "oversCompleted": overs_completed,
                    "ballsRemaining": balls_remaining,
                    "targetValue": target_value,
                    "requiredRunRate": round(required_rr, 4),
                    "currentRunRate": round(current_rr, 4),
                    "recentRuns": recent_runs,
                    "recentWickets": recent_wickets,
                    "phaseOfMatch": phase_of_match(over_number),
                    "battingFirst": batting_first,
                    "partnershipRuns": row_partnership,
                    # ML LABEL
                    "labelBattingTeamWon": batting_team_won,
                }

                rows.append(row)

# =========================================
# CREATE DATAFRAME
# =========================================

df = pd.DataFrame(rows)

# =========================================
# OUTPUT FOLDER
# =========================================

output_dir = Path("ml/datasets/processed")

output_dir.mkdir(parents=True, exist_ok=True)

# =========================================
# SAVE CSV
# =========================================

output_file = output_dir / "win_probability_dataset.csv"

df.to_csv(output_file, index=False)

# =========================================
# DONE
# =========================================

print("\n===================================")
print("DATASET GENERATION COMPLETE")
print("===================================")

print(f"Total rows created: {len(df)}")

print(f"Dataset saved to:")
print(output_file)

print("\nSample rows:")
print(df.head())