from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List

import pandas as pd

ADVERTISEMENT_PATTERNS = (
    r"\bsubscribe\b",
    r"\bvisit\s+our\s+site\b",
    r"\bpromo\b",
    r"\badvertisement\b",
    r"\bdownload\s+app\b",
)

IRRELEVANT_PATTERNS = (
    r"^\s*$",
    r"^n/?a$",
    r"^null$",
    r"^undefined$",
)


@dataclass
class CleaningStats:
    input_rows: int = 0
    output_rows: int = 0
    dropped_duplicates: int = 0
    dropped_ads: int = 0
    dropped_irrelevant: int = 0
    dropped_malformed: int = 0
    normalized_player_names: int = 0
    punctuation_fixed: int = 0


PLAYER_ALIAS_MAP = {
    "virat kohli": "Virat Kohli",
    "v kohli": "Virat Kohli",
    "rohit sharma": "Rohit Sharma",
    "r sharma": "Rohit Sharma",
}


def normalize_text(value: str, stats: CleaningStats) -> str:
    before = value
    cleaned = re.sub(r"\s+", " ", value).strip()
    cleaned = cleaned.replace("..", ".").replace(" ,", ",")
    cleaned = re.sub(r"([.!?]){2,}", r"\1", cleaned)

    if cleaned != before:
        stats.punctuation_fixed += 1

    return cleaned


def normalize_player_name(value: str, stats: CleaningStats) -> str:
    normalized = PLAYER_ALIAS_MAP.get(value.strip().lower())
    if normalized and normalized != value:
        stats.normalized_player_names += 1
        return normalized
    return value.strip()


def should_drop_as_ad(value: str) -> bool:
    text = value.lower()
    return any(re.search(pattern, text) for pattern in ADVERTISEMENT_PATTERNS)


def should_drop_as_irrelevant(value: str) -> bool:
    text = value.strip().lower()
    return any(re.search(pattern, text) for pattern in IRRELEVANT_PATTERNS)


def clean_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, CleaningStats]:
    stats = CleaningStats(input_rows=len(df))

    required_columns = ["matchId", "innings", "over", "ball", "rawCommentary", "batter", "bowler"]
    for column in required_columns:
        if column not in df.columns:
            raise ValueError(f"Missing required column: {column}")

    malformed_mask = df[required_columns].isnull().any(axis=1)
    stats.dropped_malformed = int(malformed_mask.sum())
    df = df[~malformed_mask].copy()

    df["rawCommentary"] = df["rawCommentary"].astype(str).map(lambda value: normalize_text(value, stats))

    ad_mask = df["rawCommentary"].map(should_drop_as_ad)
    stats.dropped_ads = int(ad_mask.sum())
    df = df[~ad_mask].copy()

    irrelevant_mask = df["rawCommentary"].map(should_drop_as_irrelevant)
    stats.dropped_irrelevant = int(irrelevant_mask.sum())
    df = df[~irrelevant_mask].copy()

    df["batter"] = df["batter"].astype(str).map(lambda value: normalize_player_name(value, stats))
    df["bowler"] = df["bowler"].astype(str).map(lambda value: normalize_player_name(value, stats))

    before_dedupe = len(df)
    df = df.drop_duplicates(subset=["matchId", "innings", "over", "ball", "rawCommentary"])
    stats.dropped_duplicates = before_dedupe - len(df)

    df["cleanedCommentary"] = df["rawCommentary"]
    stats.output_rows = len(df)
    return df, stats


def write_stats(path: Path, stats: CleaningStats) -> None:
    path.write_text(json.dumps(asdict(stats), indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Clean commentary dataset with deterministic filters.")
    parser.add_argument("--input", required=True, help="Input CSV path")
    parser.add_argument("--out", required=True, help="Output cleaned CSV path")
    parser.add_argument("--stats", required=True, help="Output JSON stats path")
    args = parser.parse_args()

    input_path = Path(args.input)
    out_path = Path(args.out)
    stats_path = Path(args.stats)

    df = pd.read_csv(input_path)
    cleaned_df, stats = clean_dataframe(df)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    cleaned_df.to_csv(out_path, index=False)
    write_stats(stats_path, stats)

    print(f"Cleaned commentary rows: {stats.output_rows}/{stats.input_rows}")


if __name__ == "__main__":
    main()
