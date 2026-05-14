from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

TONE_TAGS = (
    "dramatic",
    "aggressive",
    "analytical",
    "celebratory",
    "tense",
    "calm",
)

SITUATION_TAGS = (
    "wicket",
    "collapse",
    "partnership",
    "milestone",
    "chasePressure",
    "deathOvers",
    "powerplay",
    "recovery",
    "acceleration",
    "turningPoint",
    "clutchMoment",
    "momentumReversal",
)

PhaseOfMatch = Literal["powerplay", "middleOvers", "deathOvers", "superOver", "chaseClimax"]
PressureLevel = Literal["low", "medium", "high", "extreme"]
MomentumState = Literal["surging", "stable", "stalling", "collapsing"]
CommentaryTone = Literal[*TONE_TAGS]
CommentaryCategory = Literal[*SITUATION_TAGS, "general"]


class CommentaryDatasetVersion(BaseModel):
    source: str
    preprocessingVersion: str
    datasetVersion: str
    generatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    rowCount: int = Field(ge=0)


class CommentaryDatasetRow(BaseModel):
    # Match metadata
    matchId: str
    tournament: str
    format: str
    innings: int = Field(ge=1)
    over: int = Field(ge=0)
    ball: int = Field(ge=0, le=5)
    phaseOfMatch: PhaseOfMatch

    # Ball event metadata
    batter: str
    bowler: str
    runs: int = Field(ge=0)
    extras: int = Field(ge=0)
    wicket: bool
    dismissalType: Optional[str] = None
    boundaryType: Optional[Literal["FOUR", "SIX"]] = None

    # Match context signals
    currentScore: int = Field(ge=0)
    wickets: int = Field(ge=0, le=10)
    target: Optional[int] = Field(default=None, ge=0)
    requiredRunRate: float = Field(ge=0)
    currentRunRate: float = Field(ge=0)
    pressureLevel: PressureLevel
    momentumState: MomentumState
    partnershipRuns: int = Field(ge=0)
    recentBoundaries: int = Field(ge=0)
    collapseRisk: float = Field(ge=0, le=1)

    # Narrative signals
    inningsNarrative: str
    partnershipNarrative: str
    chaseNarrative: str
    momentumNarrative: str

    # Commentary data
    rawCommentary: str
    cleanedCommentary: str
    commentaryTone: CommentaryTone
    commentaryCategory: CommentaryCategory

    # Dataset lineage
    source: str
    preprocessingVersion: str
    datasetVersion: str
    generatedAt: str

    @field_validator("generatedAt")
    @classmethod
    def validate_datetime(cls, value: str) -> str:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value


def to_dataset_row(payload: dict) -> CommentaryDatasetRow:
    return CommentaryDatasetRow.model_validate(payload)
