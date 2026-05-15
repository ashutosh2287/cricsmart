from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict

import pandas as pd

from ml.commentary.datasets.schema import TONE_TAGS, SITUATION_TAGS, to_dataset_row

PREPROCESSING_VERSION = "commentary-c2-v1"
DATASET_VERSION = "c2.0.0"


def infer_tone(cleaned_commentary: str, wicket: bool, runs: int, pressure_level: str) -> str:
    text = cleaned_commentary.lower()

    if wicket:
        return "dramatic"
    if runs >= 6 or "massive" in text or "huge" in text:
        return "aggressive"
    if "milestone" in text or "fifty" in text or "hundred" in text:
        return "celebratory"
    if pressure_level in {"high", "extreme"}:
        return "tense"
    if "analysis" in text or "required rate" in text:
        return "analytical"
    return "calm"


def infer_category(cleaned_commentary: str, wicket: bool, collapse_risk: float, partnership_runs: int, phase: str) -> str:
    text = cleaned_commentary.lower()

    if wicket:
        return "wicket"
    if collapse_risk >= 0.65:
        return "collapse"
    if partnership_runs >= 35:
        return "partnership"
    if "milestone" in text or "fifty" in text:
        return "milestone"
    if phase == "deathOvers":
        return "deathOvers"
    if phase == "powerplay":
        return "powerplay"
    if "acceleration" in text:
        return "acceleration"
    if "rebuild" in text or "recovery" in text:
        return "recovery"
    if "turning" in text:
        return "turningPoint"
    if "clutch" in text:
        return "clutchMoment"
    if "momentum" in text:
        return "momentumReversal"
    if "pressure" in text:
        return "chasePressure"
    return "general"


def confidence_score(commentary_row: pd.Series, event_row: pd.Series) -> float:
    score = 0.4

    if commentary_row.get("batter", "") == event_row.get("batsman", ""):
        score += 0.25
    if commentary_row.get("bowler", "") == event_row.get("bowler", ""):
        score += 0.2
    if int(commentary_row.get("runs", -1)) == int(event_row.get("runs", -2)):
        score += 0.1
    if bool(commentary_row.get("wicket", False)) == bool(event_row.get("wicket", False)):
        score += 0.05

    return min(1.0, round(score, 3))


def alignment_status(confidence: float) -> str:
    if confidence >= 0.8:
        return "high_confidence"
    if confidence >= 0.6:
        return "medium_confidence"
    return "low_confidence"


def choose_best_event(commentary_row: pd.Series, candidates: pd.DataFrame) -> tuple[pd.Series | None, float, str]:
    if candidates.empty:
        return None, 0.0, "missing_event"

    scored = [
        (index, confidence_score(commentary_row, candidate))
        for index, candidate in candidates.iterrows()
    ]
    scored.sort(key=lambda item: item[1], reverse=True)

    best_index, best_confidence = scored[0]
    top_matches = [item for item in scored if abs(item[1] - best_confidence) < 1e-9]

    if len(top_matches) > 1 and best_confidence < 0.95:
        return candidates.loc[best_index], best_confidence, "ambiguous_match"

    return candidates.loc[best_index], best_confidence, alignment_status(best_confidence)


def align_rows(commentary_df: pd.DataFrame, events_df: pd.DataFrame) -> pd.DataFrame:
    indexed_events = events_df.groupby(["matchId", "innings", "over", "ball"], dropna=False)

    generated_at = datetime.now(timezone.utc).isoformat()

    rows = []
    for _, row in commentary_df.iterrows():
        key = (
            row.get("matchId", ""),
            row.get("innings", 1),
            row.get("over", 0),
            row.get("ball", 0),
        )

        try:
            candidates = indexed_events.get_group(key)
        except KeyError:
            candidates = pd.DataFrame(columns=events_df.columns)

        matched_event, confidence, status = choose_best_event(row, candidates)
        event_data = matched_event.to_dict() if matched_event is not None else {}

        runs = int(row.get("runs", 0) if not pd.isna(row.get("runs")) else 0)
        extras = int(event_data.get("extraRuns", 0) if pd.notna(event_data.get("extraRuns")) else row.get("extras", 0))
        wicket = bool(row.get("wicket", False))

        pressure_level = row.get("pressureLevel", "medium") if isinstance(row.get("pressureLevel"), str) else "medium"
        if pressure_level not in {"low", "medium", "high", "extreme"}:
            pressure_level = "medium"

        phase = row.get("phaseOfMatch", "middleOvers") if isinstance(row.get("phaseOfMatch"), str) else "middleOvers"
        if phase not in {"powerplay", "middleOvers", "deathOvers", "superOver", "chaseClimax"}:
            phase = "middleOvers"

        cleaned_commentary = str(row.get("cleanedCommentary", row.get("rawCommentary", ""))).strip()
        tone = infer_tone(cleaned_commentary, wicket, runs, pressure_level)
        category = infer_category(
            cleaned_commentary,
            wicket,
            float(row.get("collapseRisk", 0) if not pd.isna(row.get("collapseRisk")) else 0),
            int(row.get("partnershipRuns", 0) if not pd.isna(row.get("partnershipRuns")) else 0),
            phase,
        )

        if tone not in TONE_TAGS:
            tone = "calm"
        if category not in SITUATION_TAGS:
            category = "general"

        canonical_row = to_dataset_row(
            {
                "matchId": row.get("matchId", ""),
                "tournament": row.get("tournament", "unknown"),
                "format": row.get("format", "T20"),
                "innings": int(row.get("innings", 1)),
                "over": int(row.get("over", 0)),
                "ball": int(row.get("ball", 0)),
                "phaseOfMatch": phase,
                "batter": row.get("batter", event_data.get("batsman", "")),
                "bowler": row.get("bowler", event_data.get("bowler", "")),
                "runs": runs,
                "extras": extras,
                "wicket": wicket,
                "dismissalType": row.get("dismissalType") or event_data.get("dismissalKind"),
                "boundaryType": "SIX" if runs == 6 else "FOUR" if runs == 4 else None,
                "currentScore": int(event_data.get("scoreAfterBall", 0) if pd.notna(event_data.get("scoreAfterBall")) else 0),
                "wickets": int(event_data.get("wicketsAfterBall", 0) if pd.notna(event_data.get("wicketsAfterBall")) else 0),
                "target": None if pd.isna(event_data.get("target")) else int(event_data.get("target")),
                "requiredRunRate": float(row.get("requiredRunRate", 0) if not pd.isna(row.get("requiredRunRate")) else 0),
                "currentRunRate": float(row.get("currentRunRate", 0) if not pd.isna(row.get("currentRunRate")) else 0),
                "pressureLevel": pressure_level,
                "momentumState": row.get("momentumState", "stable") if row.get("momentumState") in {"surging", "stable", "stalling", "collapsing"} else "stable",
                "partnershipRuns": int(row.get("partnershipRuns", 0) if not pd.isna(row.get("partnershipRuns")) else 0),
                "recentBoundaries": int(row.get("recentBoundaries", 0) if not pd.isna(row.get("recentBoundaries")) else 0),
                "collapseRisk": float(row.get("collapseRisk", 0) if not pd.isna(row.get("collapseRisk")) else 0),
                "inningsNarrative": row.get("inningsNarrative", "balanced innings"),
                "partnershipNarrative": row.get("partnershipNarrative", "partnership in progress"),
                "chaseNarrative": row.get("chaseNarrative", "chase context unavailable"),
                "momentumNarrative": row.get("momentumNarrative", "momentum stable"),
                "rawCommentary": row.get("rawCommentary", ""),
                "cleanedCommentary": cleaned_commentary,
                "commentaryTone": tone,
                "commentaryCategory": category,
                "source": row.get("source", "cricsheet"),
                "preprocessingVersion": PREPROCESSING_VERSION,
                "datasetVersion": DATASET_VERSION,
                "generatedAt": generated_at,
            }
        ).model_dump()

        canonical_row["alignmentStatus"] = status
        canonical_row["alignmentConfidence"] = confidence
        rows.append(canonical_row)

    return pd.DataFrame(rows)


def write_manifest(path: Path, source: str, row_count: int) -> None:
    payload: Dict[str, object] = {
        "source": source,
        "preprocessingVersion": PREPROCESSING_VERSION,
        "datasetVersion": DATASET_VERSION,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "rowCount": int(row_count),
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Align cleaned commentary rows to ball events and emit canonical dataset rows.")
    parser.add_argument("--commentary", required=True, help="Cleaned commentary CSV")
    parser.add_argument("--events", required=True, help="Normalized ball events CSV")
    parser.add_argument("--out", required=True, help="Output aligned CSV")
    parser.add_argument("--manifest", required=True, help="Output dataset manifest JSON")
    parser.add_argument("--source", default="cricsheet", help="Dataset source label")
    args = parser.parse_args()

    commentary_df = pd.read_csv(Path(args.commentary))
    events_df = pd.read_csv(Path(args.events))

    aligned_df = align_rows(commentary_df, events_df)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    aligned_df.to_csv(out_path, index=False)

    write_manifest(Path(args.manifest), args.source, len(aligned_df))

    print(f"Aligned rows: {len(aligned_df)}")


if __name__ == "__main__":
    main()
