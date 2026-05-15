from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

if __package__ in {None, ""}:
    import sys
    sys.path.append(str(Path(__file__).resolve().parents[3]))

from ml.commentary.retrieval.retrieve_commentary import load_retrieval_index, retrieve_similar_commentary

_DEFAULT_INDEX_DIR = "ml/commentary/models/retrieval"
_DEFAULT_MODEL = "all-MiniLM-L6-v2"

# Cached bundle so repeated calls in the same process don't reload the index.
_BUNDLE_CACHE: Dict[str, Any] = {}


def _get_bundle(index_dir: str) -> Dict[str, Any]:
    if index_dir not in _BUNDLE_CACHE:
        _BUNDLE_CACHE[index_dir] = load_retrieval_index(Path(index_dir))
    return _BUNDLE_CACHE[index_dir]


def _get_encoder(model_name: str):
    try:
        from sentence_transformers import SentenceTransformer  # noqa: PLC0415
    except ImportError as err:
        raise RuntimeError(
            "sentence-transformers is required. Install ml/requirements.txt."
        ) from err
    return SentenceTransformer(model_name)


def retrieve_examples(
    query_text: str,
    context_features: Optional[np.ndarray] = None,
    *,
    index_dir: str = _DEFAULT_INDEX_DIR,
    model_name: str = _DEFAULT_MODEL,
    top_k: int = 5,
    phase_of_match: Optional[str] = None,
    pressure_level: Optional[str] = None,
    wickets_lost_band: Optional[str] = None,
    over_band: Optional[str] = None,
    commentary_type: Optional[str] = None,
    momentum_state: Optional[str] = None,
    min_similarity: float = 0.70,
) -> List[Dict[str, Any]]:
    """Runtime retrieval inference entry point.

    Loads the retrieval index (cached after first call), encodes the query
    text, applies metadata filters, and returns deterministically ordered
    top-k results.

    Falls back to an empty list if the index is unavailable or similarity
    is below *min_similarity* for all candidates.

    Args:
        query_text: The current commentary text or narrative description.
        context_features: Optional pre-computed context feature vector (1-D,
            shape (context_dim,)).  When *None*, uses a zero vector.
        index_dir: Directory containing the FAISS index artefacts.
        model_name: Sentence-transformer model to encode the query.
        top_k: Maximum number of results to return.
        phase_of_match: Optional metadata filter.
        pressure_level: Optional metadata filter.
        wickets_lost_band: Optional metadata filter.
        over_band: Optional metadata filter.
        commentary_type: Optional metadata filter.
        momentum_state: Optional metadata filter.
        min_similarity: Minimum cosine similarity.  Results below this are
            discarded; if no results meet the threshold the planner falls
            back to deterministic templates.

    Returns:
        Up to *top_k* deterministically ranked retrieval results, or ``[]``
        on any retrieval failure (index missing, low similarity, etc.).
    """
    try:
        bundle = _get_bundle(index_dir)
    except (FileNotFoundError, RuntimeError):
        # Fallback: index unavailable — deterministic planner takes over.
        return []

    try:
        encoder = _get_encoder(model_name)
        query_embedding = np.asarray(
            encoder.encode([query_text], normalize_embeddings=True), dtype=np.float32
        )[0]
    except Exception:  # noqa: BLE001
        return []

    try:
        return retrieve_similar_commentary(
            bundle,
            query_embedding,
            context_features,
            top_k=top_k,
            phase_of_match=phase_of_match,
            pressure_level=pressure_level,
            wickets_lost_band_val=wickets_lost_band,
            over_band_val=over_band,
            commentary_type=commentary_type,
            momentum_state=momentum_state,
            min_similarity=min_similarity,
        )
    except Exception:  # noqa: BLE001
        return []


def main() -> None:
    parser = argparse.ArgumentParser(description="Runtime retrieval inference")
    parser.add_argument("--query", required=True)
    parser.add_argument("--index-dir", default=_DEFAULT_INDEX_DIR)
    parser.add_argument("--phase", default=None)
    parser.add_argument("--pressure", default=None)
    parser.add_argument("--wickets-lost-band", default=None, dest="wickets_lost_band")
    parser.add_argument("--over-band", default=None, dest="over_band")
    parser.add_argument("--commentary-type", default=None)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--min-similarity", type=float, default=0.70)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    results = retrieve_examples(
        args.query,
        index_dir=args.index_dir,
        top_k=args.top_k,
        phase_of_match=args.phase,
        pressure_level=args.pressure,
        wickets_lost_band=args.wickets_lost_band,
        over_band=args.over_band,
        commentary_type=args.commentary_type,
        min_similarity=args.min_similarity,
    )
    Path(args.out).write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Wrote {len(results)} retrieval examples to {args.out}")


if __name__ == "__main__":
    main()


