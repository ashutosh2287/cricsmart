"""Feature engineering for commentary intelligence.

Generates pressure, momentum, narrative, phase, and partnership features
from aligned commentary + ball event rows.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


@dataclass
class FeatureRow:
    match_id: str
    innings: int
    over: int
    ball: int
    pressure_index: float
    momentum_score: float
    narrative_state: str
    phase: str
    partnership_runs: int


def generate_features(rows: Iterable[dict]) -> list[FeatureRow]:
    out: list[FeatureRow] = []
    for row in rows:
        out.append(
            FeatureRow(
                match_id=str(row.get("match_id", "")),
                innings=int(row.get("innings", 1)),
                over=int(row.get("over", 0)),
                ball=int(row.get("ball", 0)),
                pressure_index=float(row.get("pressure_index", 0.0)),
                momentum_score=float(row.get("momentum_score", 0.0)),
                narrative_state=str(row.get("narrative_state", "balanced")),
                phase=str(row.get("phase", "middleOvers")),
                partnership_runs=int(row.get("partnership_runs", 0)),
            )
        )
    return out
