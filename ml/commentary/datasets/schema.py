from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PressureLevel = Literal["LOW", "MEDIUM", "HIGH", "EXTREME"]
MomentumState = Literal["BATTING", "BOWLING", "NEUTRAL"]
CommentaryType = Literal["boundary", "wicket", "pressure", "momentum", "partnership", "collapse", "turning_point", "summary"]
Tone = Literal["neutral", "dramatic", "energetic", "analytical", "celebratory", "tense"]
Importance = Literal["low", "medium", "high"]


class CommentaryDatasetVersion(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    source: str
    preprocessing_version: str
    dataset_version: str
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    row_count: int = Field(ge=0)


class CommentaryDatasetRow(BaseModel):
    model_config = ConfigDict(extra="allow")

    match_id: str
    innings: int = Field(ge=1)
    over: int = Field(ge=0)
    ball: int = Field(ge=0, le=5)
    batting_team: str
    bowling_team: str
    striker: str
    non_striker: str
    bowler: str
    runs: int = Field(ge=0)
    wicket: bool
    extras: int = Field(ge=0)
    current_score: int = Field(ge=0)
    wickets_lost: int = Field(ge=0, le=10)
    required_rr: float = Field(ge=0)
    current_rr: float = Field(ge=0)
    target: int = Field(ge=0)
    balls_remaining: int = Field(ge=0)
    recent_runs: int = Field(ge=0)
    recent_wickets: int = Field(ge=0)
    dot_ball_streak: int = Field(ge=0)
    partnership_runs: int = Field(ge=0)
    partnership_balls: int = Field(ge=0)
    phase_of_match: str
    win_probability: float = Field(ge=0, le=1)
    momentum_state: MomentumState
    pressure_level: PressureLevel
    collapse_risk: float = Field(ge=0, le=1)
    commentary_text: str
    commentary_type: CommentaryType
    tone: Tone
    importance: Importance


def to_dataset_row(payload: dict) -> CommentaryDatasetRow:
    return CommentaryDatasetRow.model_validate(payload)

