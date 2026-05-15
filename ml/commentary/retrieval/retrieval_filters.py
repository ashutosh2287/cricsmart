"""Deterministic metadata filters for commentary retrieval.

Each filter accepts a record (dict) and an expected value and returns True
when the record passes the filter.  Filters are composable — chain them with
:func:`apply_filters` to avoid contextually incorrect commentary.
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional

__all__ = [
    "apply_filters",
    "build_filter_chain",
    "filter_phase_of_match",
    "filter_pressure_level",
    "filter_commentary_type",
    "filter_wickets_lost_band",
    "filter_over_band",
    "filter_momentum_state",
    "wickets_lost_band",
    "over_band",
]

Record = Dict[str, Any]
FilterFn = Callable[[Record], bool]


# ---------------------------------------------------------------------------
# Band helpers
# ---------------------------------------------------------------------------

def wickets_lost_band(wickets_lost: int) -> str:
    """Map a wicket count to its canonical band string."""
    if wickets_lost <= 2:
        return "0-2"
    if wickets_lost <= 5:
        return "3-5"
    if wickets_lost <= 8:
        return "6-8"
    return "9-10"


def over_band(over: int) -> str:
    """Map an over number (0-based) to its canonical band string."""
    if over < 6:
        return "0-5"
    if over < 16:
        return "6-15"
    return "16-20"


# ---------------------------------------------------------------------------
# Individual filter factories
# ---------------------------------------------------------------------------

def filter_phase_of_match(expected: str) -> FilterFn:
    """Return a filter that passes records whose phase_of_match equals *expected*."""
    def _filter(record: Record) -> bool:
        return record.get("phase_of_match") == expected
    return _filter


def filter_pressure_level(expected: str) -> FilterFn:
    """Return a filter that passes records whose pressure_level equals *expected*."""
    def _filter(record: Record) -> bool:
        return record.get("pressure_level") == expected
    return _filter


def filter_commentary_type(expected: str) -> FilterFn:
    """Return a filter that passes records whose commentary_type equals *expected*."""
    def _filter(record: Record) -> bool:
        return record.get("commentary_type") == expected
    return _filter


def filter_wickets_lost_band(expected: str) -> FilterFn:
    """Return a filter that passes records whose wickets_lost_band equals *expected*.

    The record is expected to have a ``wickets_lost_band`` field **or** a
    raw ``wickets_lost`` field that is converted on the fly.
    """
    def _filter(record: Record) -> bool:
        band = record.get("wickets_lost_band")
        if band is None:
            raw = record.get("wickets_lost", 0)
            try:
                band = wickets_lost_band(int(raw))
            except (TypeError, ValueError):
                return False
        return band == expected
    return _filter


def filter_over_band(expected: str) -> FilterFn:
    """Return a filter that passes records whose over_band equals *expected*.

    The record is expected to have an ``over_band`` field **or** a raw
    ``over`` field that is converted on the fly.
    """
    def _filter(record: Record) -> bool:
        band = record.get("over_band")
        if band is None:
            raw = record.get("over", 0)
            try:
                band = over_band(int(raw))
            except (TypeError, ValueError):
                return False
        return band == expected
    return _filter


def filter_momentum_state(expected: str) -> FilterFn:
    """Return a filter that passes records whose momentum_state equals *expected*."""
    def _filter(record: Record) -> bool:
        return record.get("momentum_state") == expected
    return _filter


# ---------------------------------------------------------------------------
# Filter chain builder
# ---------------------------------------------------------------------------

def build_filter_chain(
    *,
    phase_of_match: Optional[str] = None,
    pressure_level: Optional[str] = None,
    commentary_type: Optional[str] = None,
    wickets_lost_band_val: Optional[str] = None,
    over_band_val: Optional[str] = None,
    momentum_state: Optional[str] = None,
) -> List[FilterFn]:
    """Build an ordered list of active filter functions from optional arguments."""
    chain: List[FilterFn] = []
    if phase_of_match is not None:
        chain.append(filter_phase_of_match(phase_of_match))
    if pressure_level is not None:
        chain.append(filter_pressure_level(pressure_level))
    if commentary_type is not None:
        chain.append(filter_commentary_type(commentary_type))
    if wickets_lost_band_val is not None:
        chain.append(filter_wickets_lost_band(wickets_lost_band_val))
    if over_band_val is not None:
        chain.append(filter_over_band(over_band_val))
    if momentum_state is not None:
        chain.append(filter_momentum_state(momentum_state))
    return chain


def apply_filters(record: Record, filters: List[FilterFn]) -> bool:
    """Return True if *record* passes **all** filters in *filters*."""
    return all(fn(record) for fn in filters)
