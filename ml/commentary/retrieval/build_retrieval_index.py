"""Build and persist a FAISS-backed commentary retrieval index.

The index combines sentence-transformer text embeddings with numeric context
features into a hybrid vector, then builds a flat FAISS inner-product index
over the normalised composite vectors.

Artefacts written to ``--out-dir`` (default: ``ml/commentary/models/retrieval/``):

* ``commentary_retrieval.faiss``  — FAISS index
* ``commentary_retrieval_metadata.json``  — index metadata + all records
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

if __package__ in {None, ""}:
    import sys
    sys.path.append(str(Path(__file__).resolve().parents[3]))

from ml.commentary.embeddings.embedding_metadata import (
    DEFAULT_SIMILARITY_THRESHOLDS,
    EMBEDDING_METADATA_VERSION,
    SCHEMA_VERSION,
)
from ml.commentary.embeddings.embedding_utils import CONTEXT_DIM, EMBEDDING_DIM, normalize_embeddings
from ml.commentary.retrieval.retrieval_filters import over_band, wickets_lost_band

_FAISS_AVAILABLE = False
try:
    import faiss  # type: ignore[import]
    _FAISS_AVAILABLE = True
except ImportError:  # pragma: no cover
    pass


def _load_faiss():
    if not _FAISS_AVAILABLE:
        raise RuntimeError(
            "faiss-cpu is required to build the retrieval index. "
            "Install ml/requirements.txt."
        )
    import faiss as _faiss  # noqa: PLC0415
    return _faiss


def build_composite_matrix(
    embeddings: np.ndarray,
    context_features: np.ndarray,
    *,
    embedding_weight: float = 0.35,
    context_weight: float = 0.65,
) -> np.ndarray:
    """Build a normalised composite matrix from text embeddings and context features."""
    emb_norm = normalize_embeddings(embeddings) * embedding_weight
    ctx_norm = normalize_embeddings(context_features) * context_weight
    composite = np.hstack([emb_norm, ctx_norm]).astype("float32")
    # Final L2 normalisation so that inner-product search equals cosine similarity.
    norms = np.linalg.norm(composite, axis=1, keepdims=True)
    norms[norms == 0.0] = 1.0
    return (composite / norms).astype("float32")


def build_faiss_index(composite_matrix: np.ndarray):
    """Create and populate a flat inner-product FAISS index."""
    faiss = _load_faiss()
    dim = composite_matrix.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(composite_matrix)  # type: ignore[arg-type]
    return index


def build_records(rows_df) -> list[dict]:
    """Convert a DataFrame of commentary rows into retrieval record dicts."""
    records = []
    for idx, row in enumerate(rows_df.to_dict(orient="records")):
        wl = int(row.get("wickets_lost", 0))
        ov = int(row.get("over", 0))
        record = {
            "id": (
                f"{row.get('match_id', '')}:"
                f"{row.get('innings', 1)}:"
                f"{ov}:"
                f"{row.get('ball', 0)}"
            ),
            "index": idx,
            "match_id": str(row.get("match_id", "")),
            "innings": int(row.get("innings", 1)),
            "over": ov,
            "ball": int(row.get("ball", 0)),
            "commentary_text": str(row.get("commentary_text", "")),
            "commentary_type": str(row.get("commentary_type", "summary")),
            "pressure_level": str(row.get("pressure_level", "MEDIUM")),
            "momentum_state": str(row.get("momentum_state", "NEUTRAL")),
            "tone": str(row.get("tone", "neutral")),
            "wickets_lost": wl,
            "wickets_lost_band": wickets_lost_band(wl),
            "over_phase": str(row.get("phase_of_match", "MIDDLE_OVERS")),
            "phase_of_match": str(row.get("phase_of_match", "MIDDLE_OVERS")),
            "over_band": over_band(ov),
            "probability_band": _probability_band(float(row.get("win_probability", 0.5))),
        }
        records.append(record)
    return records


def _probability_band(win_probability: float) -> str:
    if win_probability >= 0.80:
        return "dominant"
    if win_probability >= 0.60:
        return "ahead"
    if win_probability >= 0.40:
        return "balanced"
    if win_probability >= 0.20:
        return "behind"
    return "critical"


def main() -> None:
    parser = argparse.ArgumentParser(description="Build FAISS commentary retrieval index")
    parser.add_argument("--embeddings-dir", default="ml/commentary/embeddings/artifacts",
                        help="Directory containing commentary_embeddings.npy, "
                             "commentary_context_features.npy, and commentary_metadata.jsonl")
    parser.add_argument("--out-dir", default="ml/commentary/models/retrieval",
                        help="Output directory for the FAISS index and metadata")
    parser.add_argument("--embedding-weight", type=float, default=0.35)
    parser.add_argument("--context-weight", type=float, default=0.65)
    args = parser.parse_args()

    embeddings_dir = Path(args.embeddings_dir)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    embeddings = np.load(embeddings_dir / "commentary_embeddings.npy").astype("float32")
    context_features = np.load(embeddings_dir / "commentary_context_features.npy").astype("float32")
    metadata_rows = [
        json.loads(line)
        for line in (embeddings_dir / "commentary_metadata.jsonl").read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]

    if len(embeddings) != len(metadata_rows):
        raise ValueError(
            f"Embedding count ({len(embeddings)}) does not match "
            f"metadata row count ({len(metadata_rows)})."
        )

    import pandas as pd  # noqa: PLC0415 – lightweight local import
    rows_df = pd.DataFrame(metadata_rows)
    records = build_records(rows_df)

    composite = build_composite_matrix(
        embeddings,
        context_features,
        embedding_weight=args.embedding_weight,
        context_weight=args.context_weight,
    )

    index = build_faiss_index(composite)
    faiss = _load_faiss()

    index_path = out_dir / "commentary_retrieval.faiss"
    faiss.write_index(index, str(index_path))

    index_metadata = {
        "metadataVersion": EMBEDDING_METADATA_VERSION,
        "schemaVersion": SCHEMA_VERSION,
        "size": len(records),
        "embeddingDim": int(embeddings.shape[1]),
        "contextDim": int(context_features.shape[1]),
        "compositeDim": int(composite.shape[1]),
        "embeddingWeight": args.embedding_weight,
        "contextWeight": args.context_weight,
        "indexPath": str(index_path.resolve()),
        "deterministicOrdering": "score_desc_then_id_asc",
        "requiredFilters": [
            "phase_of_match",
            "pressure_level",
            "wickets_lost_band",
            "over_band",
            "commentary_type",
        ],
        "similarityThresholds": DEFAULT_SIMILARITY_THRESHOLDS,
        "records": records,
    }
    metadata_path = out_dir / "commentary_retrieval_metadata.json"
    metadata_path.write_text(json.dumps(index_metadata, indent=2), encoding="utf-8")

    summary = {
        "rows": len(records),
        "compositeDim": int(composite.shape[1]),
        "indexPath": str(index_path),
        "metadataPath": str(metadata_path),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
