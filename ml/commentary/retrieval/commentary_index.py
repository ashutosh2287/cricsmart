from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.neighbors import NearestNeighbors


def normalize_rows(matrix: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return matrix / norms


def main() -> None:
    parser = argparse.ArgumentParser(description="Build commentary retrieval index.")
    parser.add_argument("--embeddings-dir", default="ml/commentary/embeddings/artifacts")
    parser.add_argument("--out", default="ml/commentary/retrieval/commentary_index.joblib")
    parser.add_argument("--embedding-weight", type=float, default=0.35)
    parser.add_argument("--context-weight", type=float, default=0.65)
    args = parser.parse_args()

    embeddings_dir = Path(args.embeddings_dir)
    embeddings = np.load(embeddings_dir / "commentary_embeddings.npy")
    context_features = np.load(embeddings_dir / "commentary_context_features.npy")
    metadata_rows = [
        json.loads(line)
        for line in (embeddings_dir / "commentary_metadata.jsonl").read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]

    hybrid_matrix = np.hstack(
        [
            normalize_rows(embeddings) * float(args.embedding_weight),
            normalize_rows(context_features) * float(args.context_weight),
        ]
    ).astype("float32")

    index = NearestNeighbors(metric="cosine", algorithm="brute")
    index.fit(hybrid_matrix)

    bundle = {
        "model": index,
        "hybrid_matrix": hybrid_matrix,
        "metadata": metadata_rows,
        "embedding_dim": int(embeddings.shape[1]),
        "context_dim": int(context_features.shape[1]),
        "embedding_weight": float(args.embedding_weight),
        "context_weight": float(args.context_weight),
    }
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, out_path)
    print(json.dumps({"rows": len(metadata_rows), "output": str(out_path.resolve())}, indent=2))


if __name__ == "__main__":
    main()
