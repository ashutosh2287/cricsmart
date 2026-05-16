"""Retrieve similar commentary examples using the FAISS retrieval index.

Main function: retrieve_similar_commentary()

This module is the primary entry point for semantic commentary retrieval.
All outputs are deterministically ordered: same inputs always produce the
same ranked results.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

if __package__ in {None, ""}:
    import sys
    sys.path.append(str(Path(__file__).resolve().parents[3]))

from ml.commentary.retrieval.retrieval_utils import filter_and_rank

_DEFAULT_INDEX_DIR = "ml/commentary/models/retrieval"
_DEFAULT_MODEL = "all-MiniLM-L6-v2"


def _load_faiss():
    try:
        import faiss  # type: ignore[import]
        return faiss
    except ImportError as err:
        raise RuntimeError(
            "faiss-cpu is required for commentary retrieval. Install ml/requirements.txt."
        ) from err


def load_retrieval_index(index_dir: Path) -> Dict[str, Any]:
    """Load the FAISS index and its metadata records from *index_dir*.

    Returns a bundle dict with keys: ``index``, ``records``,
    ``embedding_weight``, ``context_weight``, ``embedding_dim``,
    ``context_dim``.
    """
    faiss = _load_faiss()
    index_path = index_dir / "commentary_retrieval.faiss"
    metadata_path = index_dir / "commentary_retrieval_metadata.json"

    if not index_path.exists() or not metadata_path.exists():
        raise FileNotFoundError(
            f"Retrieval index artefacts not found in {index_dir}. "
            "Run build_retrieval_index.py first."
        )

    index = faiss.read_index(str(index_path))
    meta = json.loads(metadata_path.read_text(encoding="utf-8"))
    return {
        "index": index,
        "records": meta.get("records", []),
        "embedding_weight": float(meta.get("embeddingWeight", 0.35)),
        "context_weight": float(meta.get("contextWeight", 0.65)),
        "embedding_dim": int(meta.get("embeddingDim", 384)),
        "context_dim": int(meta.get("contextDim", 14)),
        "similarity_thresholds": meta.get("similarityThresholds", {}),
    }


def _build_query_vector(
    embedding: np.ndarray,
    context_feat: np.ndarray,
    embedding_weight: float,
    context_weight: float,
) -> np.ndarray:
    """Build and L2-normalise a composite query vector."""
    def _norm(v: np.ndarray) -> np.ndarray:
        n = float(np.linalg.norm(v))
        return v / n if n > 0.0 else v

    composite = np.concatenate([
        _norm(embedding) * embedding_weight,
        _norm(context_feat) * context_weight,
    ]).astype("float32")
    n = float(np.linalg.norm(composite))
    return composite / n if n > 0.0 else composite


def retrieve_similar_commentary(
    bundle: Dict[str, Any],
    query_embedding: np.ndarray,
    query_context: Optional[np.ndarray] = None,
    *,
    top_k: int = 5,
    phase_of_match: Optional[str] = None,
    pressure_level: Optional[str] = None,
    wickets_lost_band_val: Optional[str] = None,
    over_band_val: Optional[str] = None,
    commentary_type: Optional[str] = None,
    momentum_state: Optional[str] = None,
    min_similarity: float = 0.70,
    max_duplicates: int = 2,
) -> List[Dict[str, Any]]:
    """Retrieve top-k similar commentary examples from the FAISS index.

    Args:
        bundle: Index bundle returned by :func:`load_retrieval_index`.
        query_embedding: Text embedding of the query (1-D, shape (embedding_dim,)).
        query_context: Optional context feature vector (1-D, shape (context_dim,)).
            When *None*, a zero vector is used.
        top_k: Maximum number of results to return after filtering.
        phase_of_match: Optional metadata filter.
        pressure_level: Optional metadata filter.
        wickets_lost_band_val: Optional metadata filter.
        over_band_val: Optional metadata filter.
        commentary_type: Optional metadata filter.
        momentum_state: Optional metadata filter.
        min_similarity: Minimum cosine similarity threshold.
        max_duplicates: Maximum allowed duplicate texts in results.

    Returns:
        Up to *top_k* deterministically ordered retrieval results.  Each item
        contains the record metadata plus a ``score`` field.
    """
    index = bundle["index"]
    records: List[Dict[str, Any]] = bundle["records"]
    embedding_weight: float = bundle["embedding_weight"]
    context_weight: float = bundle["context_weight"]
    context_dim: int = bundle["context_dim"]

    if not records:
        return []

    if query_context is None:
        query_context = np.zeros(context_dim, dtype="float32")

    query_vec = _build_query_vector(
        query_embedding.astype("float32"),
        query_context.astype("float32"),
        embedding_weight,
        context_weight,
    ).reshape(1, -1)

    n_candidates = min(top_k * 10, len(records))
    distances, indices = index.search(query_vec, n_candidates)

    candidates: List[Dict[str, Any]] = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < 0:
            continue
        item = dict(records[idx])
        item["score"] = round(float(dist), 6)  # inner-product = cosine sim after normalisation
        candidates.append(item)

    return filter_and_rank(
        candidates,
        phase_of_match=phase_of_match,
        pressure_level=pressure_level,
        commentary_type=commentary_type,
        wickets_lost_band_val=wickets_lost_band_val,
        over_band_val=over_band_val,
        momentum_state=momentum_state,
        min_similarity=min_similarity,
        max_duplicates=max_duplicates,
        top_k=top_k,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Retrieve similar commentary examples")
    parser.add_argument("--query", required=True, help="Query commentary text")
    parser.add_argument("--index-dir", default=_DEFAULT_INDEX_DIR)
    parser.add_argument("--model", default=_DEFAULT_MODEL)
    parser.add_argument("--phase", default=None)
    parser.add_argument("--pressure", default=None)
    parser.add_argument("--wickets-lost-band", default=None, dest="wickets_lost_band")
    parser.add_argument("--over-band", default=None, dest="over_band")
    parser.add_argument("--commentary-type", default=None)
    parser.add_argument("--min-similarity", type=float, default=0.70)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    from sentence_transformers import SentenceTransformer  # noqa: PLC0415

    model = SentenceTransformer(args.model)
    query_embedding = np.asarray(
        model.encode([args.query], normalize_embeddings=True), dtype=np.float32
    )[0]

    bundle = load_retrieval_index(Path(args.index_dir))
    results = retrieve_similar_commentary(
        bundle,
        query_embedding,
        top_k=args.top_k,
        phase_of_match=args.phase,
        pressure_level=args.pressure,
        wickets_lost_band_val=args.wickets_lost_band,
        over_band_val=args.over_band,
        commentary_type=args.commentary_type,
        min_similarity=args.min_similarity,
    )
    Path(args.out).write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Wrote {len(results)} retrieval examples to {args.out}")


if __name__ == "__main__":
    main()
