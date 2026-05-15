from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np

if __package__ in {None, ""}:
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[3]))

from ml.commentary.preprocessing.feature_engineering import (
    RETRIEVAL_FEATURE_COLUMNS,
    build_retrieval_query_features,
)


def normalize_rows(matrix: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return matrix / norms


def retrieve_similar_commentary(
    *,
    pressure: str = "MEDIUM",
    momentum: str = "NEUTRAL",
    wickets: int = 0,
    over_phase: str = "MIDDLE_OVERS",
    probability_swing: float = 0.0,
    top_k: int = 5,
    index_path: str = "ml/commentary/retrieval/commentary_index.joblib",
    **extra_context: Any,
) -> list[dict[str, Any]]:
    bundle = joblib.load(index_path)
    query_features = build_retrieval_query_features(
        {
            "pressure": pressure,
            "momentum": momentum,
            "wickets": wickets,
            "over_phase": over_phase,
            "probability_swing": probability_swing,
            **extra_context,
        }
    )
    context_vector = np.asarray([[query_features[name] for name in RETRIEVAL_FEATURE_COLUMNS]], dtype="float32")
    context_vector = normalize_rows(context_vector) * float(bundle["context_weight"])
    embedding_vector = np.zeros((1, int(bundle["embedding_dim"])), dtype="float32") * float(bundle["embedding_weight"])
    query_vector = np.hstack([embedding_vector, context_vector]).astype("float32")

    distances, indices = bundle["model"].kneighbors(query_vector, n_neighbors=min(top_k, len(bundle["metadata"])))
    results: list[dict[str, Any]] = []
    for distance, idx in zip(distances[0], indices[0], strict=False):
        row = dict(bundle["metadata"][int(idx)])
        row["score"] = round(1.0 - float(distance), 4)
        results.append(row)
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Retrieve similar commentary examples.")
    parser.add_argument("--pressure", default="MEDIUM")
    parser.add_argument("--momentum", default="NEUTRAL")
    parser.add_argument("--wickets", type=int, default=0)
    parser.add_argument("--over-phase", default="MIDDLE_OVERS")
    parser.add_argument("--probability-swing", type=float, default=0.0)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--index", default="ml/commentary/retrieval/commentary_index.joblib")
    args = parser.parse_args()

    results = retrieve_similar_commentary(
        pressure=args.pressure,
        momentum=args.momentum,
        wickets=args.wickets,
        over_phase=args.over_phase,
        probability_swing=args.probability_swing,
        top_k=args.top_k,
        index_path=args.index,
    )
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
