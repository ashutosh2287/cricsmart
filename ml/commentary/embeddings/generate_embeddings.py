from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

if __package__ in {None, ""}:
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[3]))

from ml.commentary.embeddings.embedding_metadata import (
    build_embedding_metadata,
    save_embedding_metadata,
)
from ml.commentary.preprocessing.feature_engineering import (
    RETRIEVAL_FEATURE_COLUMNS,
    build_retrieval_features,
)

DEFAULT_MODEL_NAME = "all-MiniLM-L6-v2"
DEFAULT_DATASET_PATH = "ml/commentary/datasets/commentary_dataset.csv"
DEFAULT_OUT_DIR = "ml/commentary/models"

REQUIRED_METADATA_FIELDS = [
    "match_id",
    "innings",
    "over",
    "ball",
    "commentary_text",
    "commentary_type",
    "pressure_level",
    "momentum_state",
    "tone",
    "wickets_lost",
]


def _load_sentence_transformer(model_name: str):
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as error:  # pragma: no cover
        raise RuntimeError(
            "sentence-transformers is required for transformer embeddings. "
            "Install ml/requirements.txt or use --fallback tfidf."
        ) from error
    return SentenceTransformer(model_name)


def _probability_band(probability: float) -> str:
    if probability >= 0.80:
        return "dominant"
    if probability >= 0.60:
        return "ahead"
    if probability >= 0.40:
        return "balanced"
    if probability >= 0.20:
        return "behind"
    return "critical"


def _encode_embeddings(texts: list[str], model_name: str, fallback: str) -> tuple[np.ndarray, dict[str, Any]]:
    if fallback == "tfidf":
        vectorizer = TfidfVectorizer(max_features=384, ngram_range=(1, 2))
        matrix = vectorizer.fit_transform(texts).toarray().astype("float32")
        return matrix, {"mode": "tfidf", "vectorizer": vectorizer}

    model = _load_sentence_transformer(model_name)
    matrix = np.asarray(model.encode(texts, normalize_embeddings=True), dtype="float32")
    return matrix, {"mode": "sentence-transformers", "model_name": model_name}


def _normalize_over_phase(value: Any) -> str:
    return str(value or "MIDDLE_OVERS")


def _build_embedding_rows(df: pd.DataFrame) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for record in df.to_dict(orient="records"):
        wp = float(record.get("win_probability", 0.5) or 0.5)
        row = {
            "match_id": str(record.get("match_id", "")),
            "innings": int(record.get("innings", 1) or 1),
            "over": int(record.get("over", 0) or 0),
            "ball": int(record.get("ball", 0) or 0),
            "commentary_text": str(record.get("commentary_text", "")),
            "commentary_type": str(record.get("commentary_type", "summary")),
            "pressure_level": str(record.get("pressure_level", "MEDIUM")),
            "momentum_state": str(record.get("momentum_state", "NEUTRAL")),
            "tone": str(record.get("tone", "neutral")),
            "wickets_lost": int(record.get("wickets_lost", 0) or 0),
            "over_phase": _normalize_over_phase(record.get("phase_of_match")),
            "probability_band": _probability_band(wp),
        }
        rows.append(row)
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate commentary embeddings for retrieval.")
    parser.add_argument("--data", default=DEFAULT_DATASET_PATH)
    parser.add_argument("--out-dir", default=DEFAULT_OUT_DIR)
    parser.add_argument("--model", default=DEFAULT_MODEL_NAME)
    parser.add_argument("--fallback", choices=["transformer", "tfidf"], default="transformer")
    args = parser.parse_args()

    data_path = Path(args.data)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    dataframe = pd.read_csv(data_path)
    if dataframe.empty:
        raise ValueError("Commentary dataset is empty")

    missing = [field for field in REQUIRED_METADATA_FIELDS if field not in dataframe.columns]
    if missing:
        raise ValueError(f"Dataset is missing required embedding metadata fields: {missing}")

    texts = dataframe["commentary_text"].fillna("").astype(str).tolist()
    embeddings, metadata = _encode_embeddings(texts, args.model, args.fallback)
    retrieval_features = np.asarray(
        [list(build_retrieval_features(record).values()) for record in dataframe.to_dict(orient="records")],
        dtype="float32",
    )

    embeddings_path = out_dir / "commentary_embeddings.npy"
    context_features_path = out_dir / "commentary_context_features.npy"
    np.save(embeddings_path, embeddings)
    np.save(context_features_path, retrieval_features)

    embedding_rows = _build_embedding_rows(dataframe)
    metadata_payload = build_embedding_metadata(
        embedding_model=metadata.get("model_name", args.model),
        dataset_version="1.0.0",
        embedding_dim=int(embeddings.shape[1]),
        context_dim=int(retrieval_features.shape[1]),
        rows=len(embedding_rows),
        retrieval_feature_columns=RETRIEVAL_FEATURE_COLUMNS,
    )
    metadata_payload.update(
        {
            "embeddingMode": metadata["mode"],
            "artifacts": {
                "embeddingsPath": str(embeddings_path.resolve()),
                "contextFeaturesPath": str(context_features_path.resolve()),
            },
            "embeddingRows": embedding_rows,
        }
    )
    metadata_path = out_dir / "embedding_metadata.json"
    save_embedding_metadata(metadata_payload, metadata_path)

    if metadata["mode"] == "tfidf":
        joblib.dump(metadata["vectorizer"], out_dir / "commentary_vectorizer.joblib")

    print(
        json.dumps(
            {
                "rows": len(embedding_rows),
                "embeddingDimension": int(embeddings.shape[1]),
                "contextDimension": int(retrieval_features.shape[1]),
                "embeddingsPath": str(embeddings_path),
                "metadataPath": str(metadata_path),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
