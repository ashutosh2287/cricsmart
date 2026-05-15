import json
import pandas as pd
from pathlib import Path

# =========================================
# DATASET PATH
# =========================================

DATASET_PATH = Path("ml/datasets/raw/cricsheet/men_t20")

# =========================================
# STORAGE FOR TRAINING ROWS
# =========================================

rows = []

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

    teams = info.get("teams", [])

    outcome = info.get("outcome", {})
    winner = outcome.get("winner")

    # =========================================
    # FIRST INNINGS SCORE
    # =========================================

    innings1_total = 0

    first_innings = innings_list[0]

    for over_data in first_innings.get("overs", []):

        for delivery in over_data.get("deliveries", []):

            innings1_total += delivery["runs"]["total"]

    target = innings1_total + 1

    # =========================================
    # SECOND INNINGS
    # =========================================

    second_innings = innings_list[1]

    batting_team = second_innings.get("team")

    batting_team_won = 1 if batting_team == winner else 0

    score = 0
    wickets = 0
    legal_balls = 0

    # =========================================
    # PROCESS EVERY BALL
    # =========================================

    for over_data in second_innings.get("overs", []):

        over_number = over_data.get("over", 0)

        deliveries = over_data.get("deliveries", [])

        for ball_index, delivery in enumerate(deliveries):

            # =========================================
            # RUNS
            # =========================================

            runs = delivery["runs"]["total"]

            score += runs

            # =========================================
            # WICKETS
            # =========================================

            if "wickets" in delivery:
                wickets += len(delivery["wickets"])

            # =========================================
            # LEGAL BALL CHECK
            # wides/no-balls don't count
            # =========================================

            extras = delivery.get("extras", {})

            is_wide = "wides" in extras
            is_noball = "noballs" in extras

            if not is_wide and not is_noball:
                legal_balls += 1

            # =========================================
            # MATCH STATE FEATURES
            # =========================================

            balls_remaining = max(120 - legal_balls, 0)

            runs_needed = max(target - score, 0)

            current_rr = (
                score / (legal_balls / 6)
                if legal_balls > 0 else 0
            )

            required_rr = (
                runs_needed / (balls_remaining / 6)
                if balls_remaining > 0 else 0
            )

            # =========================================
            # LAST BALL INFO
            # =========================================

            wicket_last_ball = 1 if "wickets" in delivery else 0

            boundary_last_ball = 1 if runs >= 4 else 0

            # =========================================
            # SAVE TRAINING ROW
            # =========================================

            row = {
                "match_id": file_path.stem,

                "batting_team": batting_team,

                "innings": 2,

                "over": over_number,

                "ball": ball_index + 1,

                "score": score,

                "wickets": wickets,

                "target": target,

                "runs_needed": runs_needed,

                "balls_remaining": balls_remaining,

                "current_run_rate": round(current_rr, 2),

                "required_run_rate": round(required_rr, 2),

                "last_ball_runs": runs,

                "wicket_last_ball": wicket_last_ball,

                "boundary_last_ball": boundary_last_ball,

                # ML LABEL
                "batting_team_won": batting_team_won
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