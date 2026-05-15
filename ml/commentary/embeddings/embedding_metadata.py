"""Embedding metadata contract and versioning utilities."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from ml.commentary.preprocessing.feature_engineering import RETRIEVAL_FEATURE_COLUMNS

__all__ = [
    "EMBEDDING_METADATA_VERSION",
    "SCHEMA_VERSION",
    "DEFAULT_SIMILARITY_THRESHOLDS",
    "load_embedding_metadata",
    "build_embedding_metadata",
    "save_embedding_metadata",
]

EMBEDDING_METADATA_VERSION = "1.0.0"
SCHEMA_VERSION = "1.0.0"

# Retrieval thresholds per Sprint C Step 12.
DEFAULT_SIMILARITY_THRESHOLDS: Dict[str, Any] = {
    "min_similarity": 0.70,
    "max_duplicates": 2,
    "fallback_strategy": "deterministic_templates",
}


def build_embedding_metadata(
    *,
    embedding_model: str = "all-MiniLM-L6-v2",
    dataset_version: str = "1.0.0",
    embedding_dim: int = 384,
    context_dim: int = 14,
    rows: int = 0,
    embedding_weight: float = 0.35,
    context_weight: float = 0.65,
    retrieval_feature_columns: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Build a complete embedding metadata record.

    This record is the source-of-truth for reproducibility.  It should be
    stored alongside the embedding artifacts and loaded at inference time to
    validate compatibility.
    """
    return {
        "metadataVersion": EMBEDDING_METADATA_VERSION,
        "schemaVersion": SCHEMA_VERSION,
        "embeddingModel": embedding_model,
        "datasetVersion": dataset_version,
        "embeddingDimension": embedding_dim,
        "contextDimension": context_dim,
        "rows": rows,
        "retrievalConfig": {
            "embeddingWeight": embedding_weight,
            "contextWeight": context_weight,
            "retrievalFeatureColumns": retrieval_feature_columns or RETRIEVAL_FEATURE_COLUMNS,
            "deterministicOrdering": "score_desc_then_id_asc",
        },
        "similarityThresholds": DEFAULT_SIMILARITY_THRESHOLDS,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
    }


def save_embedding_metadata(
    metadata: Dict[str, Any],
    out_path: Path,
) -> None:
    """Persist *metadata* as pretty-printed JSON at *out_path*."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")


def load_embedding_metadata(path: Path) -> Dict[str, Any]:
    """Load and return embedding metadata from *path*.

    Raises ``FileNotFoundError`` if the file does not exist.
    Raises ``ValueError`` if the metadata version is unrecognised.
    """
    if not path.exists():
        raise FileNotFoundError(f"Embedding metadata not found: {path}")
    data: Dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    version = data.get("metadataVersion", "")
    if version != EMBEDDING_METADATA_VERSION:
        raise ValueError(
            f"Unsupported embedding metadata version '{version}'. "
            f"Expected '{EMBEDDING_METADATA_VERSION}'."
        )
    return data
