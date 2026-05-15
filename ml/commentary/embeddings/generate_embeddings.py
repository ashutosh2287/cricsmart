from __future__ import annotations

import argparse
import json
from pathlib import Path
<<<<<<< HEAD
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

if __package__ in {None, ""}:
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[3]))

from ml.commentary.preprocessing.feature_engineering import (
    RETRIEVAL_FEATURE_COLUMNS,
    build_retrieval_features,
)

DEFAULT_MODEL_NAME = "all-MiniLM-L6-v2"


def load_sentence_transformer(model_name: str):
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as error:  # pragma: no cover - optional dependency path
        raise RuntimeError(
            "sentence-transformers is required for transformer embeddings. "
            "Install ml/requirements.txt or use --fallback tfidf."
        ) from error
    return SentenceTransformer(model_name)


def compute_embeddings(texts: list[str], model_name: str, fallback: str) -> tuple[np.ndarray, dict[str, Any]]:
    if fallback == "tfidf":
        vectorizer = TfidfVectorizer(max_features=384, ngram_range=(1, 2))
        matrix = vectorizer.fit_transform(texts).toarray().astype("float32")
        return matrix, {"mode": "tfidf", "vectorizer": vectorizer}

    model = load_sentence_transformer(model_name)
    matrix = np.asarray(model.encode(texts, normalize_embeddings=True), dtype="float32")
    return matrix, {"mode": "sentence-transformers", "model_name": model_name}


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate commentary embeddings for retrieval.")
    parser.add_argument("--data", default="ml/commentary/datasets/commentary_dataset.csv")
    parser.add_argument("--out-dir", default="ml/commentary/embeddings/artifacts")
    parser.add_argument("--model", default=DEFAULT_MODEL_NAME)
    parser.add_argument("--fallback", choices=["transformer", "tfidf"], default="transformer")
    args = parser.parse_args()

    data_path = Path(args.data)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    dataframe = pd.read_csv(data_path)
    if dataframe.empty:
        raise ValueError("Commentary dataset is empty")

    texts = dataframe["commentary_text"].fillna("").astype(str).tolist()
    embeddings, metadata = compute_embeddings(texts, args.model, args.fallback)
    retrieval_features = np.asarray(
        [list(build_retrieval_features(record).values()) for record in dataframe.to_dict(orient="records")],
        dtype="float32",
    )

    np.save(out_dir / "commentary_embeddings.npy", embeddings)
    np.save(out_dir / "commentary_context_features.npy", retrieval_features)

    metadata_fields = [
        "match_id",
        "innings",
        "over",
        "ball",
        "pressure_level",
        "momentum_state",
        "collapse_risk",
        "phase_of_match",
        "commentary_type",
        "importance",
        "tone",
        "commentary_text",
        "win_probability",
    ]
    metadata_rows = dataframe[metadata_fields].to_dict(orient="records")
    metadata_path = out_dir / "commentary_metadata.jsonl"
    metadata_path.write_text(
        "\n".join(json.dumps(row, ensure_ascii=False) for row in metadata_rows),
        encoding="utf-8",
    )

    manifest = {
        "rows": len(metadata_rows),
        "embeddingDimension": int(embeddings.shape[1]),
        "contextDimension": int(retrieval_features.shape[1]),
        "embeddingMode": metadata["mode"],
        "embeddingModel": metadata.get("model_name", "tfidf"),
        "retrievalFeatureColumns": RETRIEVAL_FEATURE_COLUMNS,
        "embeddingsPath": str((out_dir / "commentary_embeddings.npy").resolve()),
        "contextFeaturesPath": str((out_dir / "commentary_context_features.npy").resolve()),
        "metadataPath": str(metadata_path.resolve()),
    }
    (out_dir / "embedding_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    if metadata["mode"] == "tfidf":
        joblib.dump(metadata["vectorizer"], out_dir / "commentary_vectorizer.joblib")

    print(json.dumps(manifest, indent=2))
=======
from typing import Dict, List

import numpy as np
import pandas as pd

MODEL_NAME = "all-MiniLM-L6-v2"


def _load_encoder(model_name: str):
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        raise RuntimeError(
            "sentence-transformers is required. Install with: pip install sentence-transformers"
        ) from exc
    return SentenceTransformer(model_name)


def _build_texts(df: pd.DataFrame) -> List[str]:
    rows = []
    for _, row in df.iterrows():
        text = str(row.get("commentary_text", "")).strip()
        context = (
            f"type={row.get('commentary_type','summary')} "
            f"tone={row.get('tone','neutral')} "
            f"pressure={row.get('pressure_level','MEDIUM')} "
            f"phase={row.get('phase_of_match','middle_overs')} "
            f"over={row.get('over',0)} "
            f"wickets={row.get('wickets_lost',0)}"
        )
        rows.append(f"{text} || {context}")
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate commentary embeddings")
    parser.add_argument("--data", default="ml/commentary/datasets/commentary_dataset.csv")
    parser.add_argument("--out-dir", default="ml/commentary/models")
    parser.add_argument("--model", default=MODEL_NAME)
    args = parser.parse_args()

    df = pd.read_csv(Path(args.data))
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    encoder = _load_encoder(args.model)
    texts = _build_texts(df)
    vectors = encoder.encode(texts, show_progress_bar=True, normalize_embeddings=True)
    vectors = np.asarray(vectors, dtype=np.float32)

    vectors_path = out_dir / "commentary_embeddings.npy"
    metadata_path = out_dir / "commentary_embeddings_metadata.json"
    rows_path = out_dir / "commentary_embeddings_rows.parquet"

    np.save(vectors_path, vectors)
    df.to_parquet(rows_path, index=False)
    metadata_path.write_text(
        json.dumps(
            {
                "model": args.model,
                "rows": int(len(df)),
                "dim": int(vectors.shape[1]) if vectors.size else 0,
                "vectors": str(vectors_path),
                "rowsFile": str(rows_path),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Saved embeddings to {vectors_path}")
>>>>>>> origin/copilot/train-commentary-ml-system


if __name__ == "__main__":
    main()
<<<<<<< HEAD
=======

>>>>>>> origin/copilot/train-commentary-ml-system
