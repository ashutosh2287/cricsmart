"""Lightweight retrieval index scaffold.

This module is intentionally provider-agnostic and can be wired to
sentence-transformers + FAISS in production environments.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors


@dataclass
class RetrievalRecord:
    id: str
    text: str
    tags: list[str]
    phase_of_match: str
    pressure_level: str
    wickets_lost: int
    over: int


def build_index(records: list[RetrievalRecord], vectors: np.ndarray) -> Dict[str, Any]:
    if len(records) != len(vectors):
        raise ValueError("Records and vectors length mismatch")

    model = NearestNeighbors(metric="cosine", n_neighbors=min(20, max(1, len(records))))
    model.fit(vectors)
    return {
        "size": len(records),
        "records": [record.__dict__ for record in records],
        "backend": "sklearn-nearest-neighbors",
        "nn_model": model,
    }


def retrieve_similar_commentary(
    index: Dict[str, Any],
    query_vector: np.ndarray,
    *,
    top_k: int = 5,
    phase_of_match: str | None = None,
    pressure_level: str | None = None,
    over_band: tuple[int, int] | None = None,
) -> List[Dict[str, Any]]:
    model: NearestNeighbors = index["nn_model"]
    records: List[Dict[str, Any]] = index["records"]
    distances, indices = model.kneighbors(query_vector.reshape(1, -1), n_neighbors=min(top_k * 3, len(records)))

    out: List[Dict[str, Any]] = []
    for distance, idx in zip(distances[0], indices[0]):
        record = records[int(idx)]
        if phase_of_match and record.get("phase_of_match") != phase_of_match:
            continue
        if pressure_level and record.get("pressure_level") != pressure_level:
            continue
        if over_band:
            if not (over_band[0] <= int(record.get("over", 0)) <= over_band[1]):
                continue
        item = dict(record)
        item["score"] = float(1.0 - distance)
        out.append(item)
        if len(out) >= top_k:
            break
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Build persistent commentary retrieval index")
    parser.add_argument("--embeddings", default="ml/commentary/models/commentary_embeddings.npy")
    parser.add_argument("--rows", default="ml/commentary/models/commentary_embeddings_rows.parquet")
    parser.add_argument("--out-dir", default="ml/commentary/models")
    args = parser.parse_args()

    vectors = np.load(Path(args.embeddings))
    rows_df = pd.read_parquet(Path(args.rows))

    records = [
        RetrievalRecord(
            id=f"{row.get('match_id','')}:{row.get('innings',1)}:{row.get('over',0)}:{row.get('ball',0)}",
            text=str(row.get("commentary_text", "")),
            tags=[str(row.get("commentary_type", "summary")), str(row.get("tone", "neutral"))],
            phase_of_match=str(row.get("phase_of_match", "middle_overs")),
            pressure_level=str(row.get("pressure_level", "MEDIUM")),
            wickets_lost=int(row.get("wickets_lost", 0)),
            over=int(row.get("over", 0)),
        )
        for row in rows_df.to_dict(orient="records")
    ]

    index = build_index(records, vectors)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    index_model_path = out_dir / "commentary_retrieval_index.joblib"
    index_metadata_path = out_dir / "commentary_retrieval_index.json"

    import joblib

    joblib.dump(index["nn_model"], index_model_path)
    metadata = {
        "size": index["size"],
        "backend": index["backend"],
        "records": index["records"],
        "vectorsPath": str(Path(args.embeddings)),
    }
    index_metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Saved retrieval index to {index_model_path}")


if __name__ == "__main__":
    main()
