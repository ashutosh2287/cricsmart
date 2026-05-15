"""Shared utilities for commentary embedding operations."""

from __future__ import annotations

from typing import Any, Dict, List

import numpy as np

__all__ = [
    "normalize_embeddings",
    "cosine_similarity",
    "build_composite_vector",
    "EMBEDDING_DIM",
    "CONTEXT_DIM",
]

# Canonical embedding dimensions for the all-MiniLM-L6-v2 model.
EMBEDDING_DIM = 384
# Canonical context feature dimension (must equal len(RETRIEVAL_FEATURE_COLUMNS)).
CONTEXT_DIM = 14


def normalize_embeddings(matrix: np.ndarray) -> np.ndarray:
    """L2-normalise each row of *matrix* in-place and return it.

    Rows with zero norm are left unchanged (they remain zero vectors).
    """
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0.0] = 1.0
    return (matrix / norms).astype("float32")


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Return the cosine similarity between two 1-D vectors."""
    norm_a = float(np.linalg.norm(a))
    norm_b = float(np.linalg.norm(b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def build_composite_vector(
    embedding: np.ndarray,
    context_features: np.ndarray,
    *,
    embedding_weight: float = 0.35,
    context_weight: float = 0.65,
) -> np.ndarray:
    """Concatenate a normalised text embedding with normalised context features.

    The resulting vector preserves the weighted contribution of each component
    so that the hybrid NearestNeighbors search balances semantic similarity
    with contextual match quality.

    Args:
        embedding: 1-D text embedding of shape (EMBEDDING_DIM,).
        context_features: 1-D context feature vector of shape (CONTEXT_DIM,).
        embedding_weight: Weight applied to the normalised embedding.
        context_weight: Weight applied to the normalised context features.

    Returns:
        A 1-D float32 array of shape (EMBEDDING_DIM + CONTEXT_DIM,).
    """
    emb_norm = normalize_embeddings(embedding.reshape(1, -1))[0]
    ctx_norm = normalize_embeddings(context_features.reshape(1, -1))[0]
    return np.concatenate([emb_norm * embedding_weight, ctx_norm * context_weight]).astype("float32")


def scores_from_distances(distances: np.ndarray) -> List[float]:
    """Convert cosine distances (from NearestNeighbors) to similarity scores."""
    return [round(float(1.0 - d), 6) for d in distances]


def deduplicate_results(
    results: List[Dict[str, Any]],
    *,
    max_duplicates: int = 2,
) -> List[Dict[str, Any]]:
    """Suppress excessive duplicates from retrieval results.

    A duplicate is defined as a result whose *commentary_text* (normalised to
    lower-case, stripped) has already appeared more than *max_duplicates*
    times.  Order is preserved.
    """
    seen: Dict[str, int] = {}
    filtered: List[Dict[str, Any]] = []
    for item in results:
        key = str(item.get("text", item.get("commentary_text", ""))).lower().strip()
        count = seen.get(key, 0)
        if count < max_duplicates:
            filtered.append(item)
            seen[key] = count + 1
    return filtered
