"""Build and persist a FAISS-backed commentary retrieval index."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import numpy as np

if __package__ in {None, ""}:
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[3]))

from ml.commentary.embeddings.embedding_metadata import (
    DEFAULT_SIMILARITY_THRESHOLDS,
    load_embedding_metadata,
)
from ml.commentary.embeddings.embedding_utils import normalize_embeddings
from ml.commentary.retrieval.retrieval_filters import over_band, wickets_lost_band


_DEFAULT_MODELS_DIR = "ml/commentary/models"
_DEFAULT_OUT_DIR = "ml/commentary/models/retrieval"


def _load_faiss():
    try:
        import faiss  # type: ignore[import]

        return faiss
    except ImportError as err:  # pragma: no cover
        raise RuntimeError(
            "faiss-cpu is required to build the retrieval index. Install ml/requirements.txt."
        ) from err


def build_composite_matrix(
    embeddings: np.ndarray,
    context_features: np.ndarray,
    *,
    embedding_weight: float,
    context_weight: float,
) -> np.ndarray:
    emb_norm = normalize_embeddings(embeddings) * embedding_weight
    ctx_norm = normalize_embeddings(context_features) * context_weight
    composite = np.hstack([emb_norm, ctx_norm]).astype("float32")
    norms = np.linalg.norm(composite, axis=1, keepdims=True)
    norms[norms == 0.0] = 1.0
    return (composite / norms).astype("float32")


def _normalize_record(idx: int, row: dict[str, Any]) -> dict[str, Any]:
    wickets = int(row.get("wickets_lost", 0))
    over = int(row.get("over", 0))
    normalized = dict(row)
    normalized["index"] = idx
    normalized["id"] = f"{row.get('match_id', '')}:{row.get('innings', 1)}:{over}:{row.get('ball', 0)}"
    normalized["wickets_lost_band"] = row.get("wickets_lost_band") or wickets_lost_band(wickets)
    normalized["over_band"] = row.get("over_band") or over_band(over)
    normalized["phase_of_match"] = row.get("phase_of_match") or row.get("over_phase", "MIDDLE_OVERS")
    normalized["over_phase"] = row.get("over_phase") or normalized["phase_of_match"]
    return normalized


def main() -> None:
    parser = argparse.ArgumentParser(description="Build FAISS commentary retrieval index")
    parser.add_argument("--models-dir", default=_DEFAULT_MODELS_DIR)
    parser.add_argument("--out-dir", default=_DEFAULT_OUT_DIR)
    parser.add_argument("--embedding-weight", type=float, default=0.35)
    parser.add_argument("--context-weight", type=float, default=0.65)
    args = parser.parse_args()

    models_dir = Path(args.models_dir)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    embeddings_path = models_dir / "commentary_embeddings.npy"
    context_path = models_dir / "commentary_context_features.npy"
    metadata_path = models_dir / "embedding_metadata.json"

    embeddings = np.load(embeddings_path).astype("float32")
    context_features = np.load(context_path).astype("float32")
    metadata = load_embedding_metadata(metadata_path)
    records_raw = metadata.get("embeddingRows", [])

    if not records_raw:
        raise ValueError("embedding_metadata.json does not contain embeddingRows")
    if len(embeddings) != len(records_raw):
        raise ValueError("Embeddings and metadata rows length mismatch")

    records = [_normalize_record(idx, row) for idx, row in enumerate(records_raw)]
    composite = build_composite_matrix(
        embeddings,
        context_features,
        embedding_weight=float(args.embedding_weight),
        context_weight=float(args.context_weight),
    )

    faiss = _load_faiss()
    index = faiss.IndexFlatIP(composite.shape[1])
    index.add(composite)

    index_path = out_dir / "commentary_retrieval.faiss"
    faiss.write_index(index, str(index_path))

    index_metadata = {
        "size": len(records),
        "embeddingDim": int(embeddings.shape[1]),
        "contextDim": int(context_features.shape[1]),
        "compositeDim": int(composite.shape[1]),
        "embeddingWeight": float(args.embedding_weight),
        "contextWeight": float(args.context_weight),
        "indexPath": str(index_path.resolve()),
        "deterministicOrdering": "score_desc_then_id_asc",
        "requiredFilters": [
            "phase_of_match",
            "pressure_level",
            "commentary_type",
            "wickets_lost_band",
            "over_band",
            "momentum_state",
        ],
        "similarityThresholds": DEFAULT_SIMILARITY_THRESHOLDS,
        "embeddingIds": [record["id"] for record in records],
        "records": records,
    }

    out_metadata_path = out_dir / "commentary_retrieval_metadata.json"
    out_metadata_path.write_text(json.dumps(index_metadata, indent=2), encoding="utf-8")

    print(
        json.dumps(
            {
                "rows": len(records),
                "indexPath": str(index_path),
                "metadataPath": str(out_metadata_path),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
