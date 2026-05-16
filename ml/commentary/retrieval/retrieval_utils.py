"""Retrieval utilities: scoring, deduplication, thresholding, and sorting.

All operations are deterministic.  Given the same inputs the same outputs
are always produced — a requirement for replay-safe commentary generation.
"""

from __future__ import annotations

from typing import Any, Dict, List

import numpy as np

from ml.commentary.retrieval.retrieval_filters import (
    FilterFn,
    apply_filters,
    build_filter_chain,
)

__all__ = [
    "normalize_scores",
    "deterministic_sort",
    "apply_similarity_threshold",
    "suppress_duplicates",
    "filter_and_rank",
]

_MIN_SIMILARITY_DEFAULT = 0.70
_MAX_DUPLICATES_DEFAULT = 2


# ---------------------------------------------------------------------------
# Score helpers
# ---------------------------------------------------------------------------

def normalize_scores(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Re-scale similarity scores to [0, 1] across *results*.

    If all scores are equal the normalised score is set to 1.0.  The
    original ``score`` value is preserved as ``raw_score``.
    """
    scores = np.array([float(item.get("score", 0.0)) for item in results], dtype="float32")
    lo, hi = float(scores.min()), float(scores.max())
    span = hi - lo
    for item, raw in zip(results, scores.tolist()):
        item["raw_score"] = round(raw, 6)
        item["score"] = round(float((raw - lo) / span) if span > 0.0 else 1.0, 6)
    return results


# ---------------------------------------------------------------------------
# Deterministic ordering
# ---------------------------------------------------------------------------

def deterministic_sort(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sort *results* by descending score then ascending id for stable ordering.

    The same input sequence always produces the same output sequence —
    identical scores are broken by the record id string.
    """
    return sorted(
        results,
        key=lambda item: (-float(item.get("score", 0.0)), str(item.get("id", ""))),
    )


# ---------------------------------------------------------------------------
# Threshold + deduplication
# ---------------------------------------------------------------------------

def apply_similarity_threshold(
    results: List[Dict[str, Any]],
    *,
    min_similarity: float = _MIN_SIMILARITY_DEFAULT,
) -> List[Dict[str, Any]]:
    """Remove results whose similarity score is below *min_similarity*."""
    return [item for item in results if float(item.get("score", 0.0)) >= min_similarity]


def suppress_duplicates(
    results: List[Dict[str, Any]],
    *,
    max_duplicates: int = _MAX_DUPLICATES_DEFAULT,
) -> List[Dict[str, Any]]:
    """Remove excess duplicates while preserving the ordering of *results*.

    Two items are considered duplicates when their normalised
    ``commentary_text`` (or ``text``) values are identical.
    """
    seen: Dict[str, int] = {}
    out: List[Dict[str, Any]] = []
    for item in results:
        key = str(item.get("commentary_text", item.get("text", ""))).lower().strip()
        count = seen.get(key, 0)
        if count < max_duplicates:
            out.append(item)
            seen[key] = count + 1
    return out


# ---------------------------------------------------------------------------
# Combined pipeline
# ---------------------------------------------------------------------------

def filter_and_rank(
    candidates: List[Dict[str, Any]],
    *,
    filters: List[FilterFn] | None = None,
    phase_of_match: str | None = None,
    pressure_level: str | None = None,
    commentary_type: str | None = None,
    wickets_lost_band_val: str | None = None,
    over_band_val: str | None = None,
    momentum_state: str | None = None,
    min_similarity: float = _MIN_SIMILARITY_DEFAULT,
    max_duplicates: int = _MAX_DUPLICATES_DEFAULT,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """Apply filters, threshold, deduplication, and deterministic sorting.

    This is the canonical post-processing pipeline for retrieval results.
    All steps are deterministic; replay safety is guaranteed.

    Args:
        candidates: Raw retrieval results from the index query.
        filters: Pre-built filter functions.  When *None*, filters are built
            from the remaining keyword arguments.
        phase_of_match: Optional metadata filter.
        pressure_level: Optional metadata filter.
        commentary_type: Optional metadata filter.
        wickets_lost_band_val: Optional metadata filter.
        over_band_val: Optional metadata filter.
        momentum_state: Optional metadata filter.
        min_similarity: Minimum acceptable similarity score.
        max_duplicates: Maximum allowed occurrences of identical texts.
        top_k: Maximum number of results to return.

    Returns:
        Up to *top_k* deterministically ordered, filtered, deduplicated results.
    """
    active_filters: List[FilterFn] = filters if filters is not None else build_filter_chain(
        phase_of_match=phase_of_match,
        pressure_level=pressure_level,
        commentary_type=commentary_type,
        wickets_lost_band_val=wickets_lost_band_val,
        over_band_val=over_band_val,
        momentum_state=momentum_state,
    )

    filtered = [item for item in candidates if apply_filters(item, active_filters)]
    above_threshold = apply_similarity_threshold(filtered, min_similarity=min_similarity)
    deduplicated = suppress_duplicates(above_threshold, max_duplicates=max_duplicates)
    sorted_results = deterministic_sort(deduplicated)
    return sorted_results[:top_k]
