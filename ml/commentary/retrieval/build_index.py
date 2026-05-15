"""Lightweight deterministic retrieval index scaffold.

Phase-1 retrieval remains local-only: sentence-transformers embeddings + local vector index metadata.
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
    wickets_lost_band: str
    over: int
    over_band: str
    commentary_type: str


def wickets_lost_band(wickets_lost: int) -> str:
    if wickets_lost <= 2:
        return "0-2"
    if wickets_lost <= 5:
        return "3-5"
    if wickets_lost <= 8:
        return "6-8"
    return "9-10"


def over_band(over: int) -> str:
    if over < 6:
        return "0-5"
    if over < 16:
        return "6-15"
    return "16-20"


def build_index(records: list[RetrievalRecord], vectors: np.ndarray) -> Dict[str, Any]:
    if len(records) != len(vectors):
        raise ValueError("Records and vectors length mismatch")

    model = NearestNeighbors(metric="cosine", n_neighbors=min(20, max(1, len(records))))
    model.fit(vectors)
    return {
        "size": len(records),
        "records": [record.__dict__ for record in records],
        "backend": "local-vector-index",
        "nn_model": model,
    }


def retrieve_similar_commentary(
    index: Dict[str, Any],
    query_vector: np.ndarray,
    *,
    top_k: int = 5,
    phase_of_match: str | None = None,
    pressure_level: str | None = None,
    wickets_lost_band: str | None = None,
    over_band: str | None = None,
    commentary_type: str | None = None,
) -> List[Dict[str, Any]]:
    model: NearestNeighbors = index["nn_model"]
    records: List[Dict[str, Any]] = index["records"]
    distances, indices = model.kneighbors(query_vector.reshape(1, -1), n_neighbors=min(top_k * 5, len(records)))

    out: List[Dict[str, Any]] = []
    for distance, idx in zip(distances[0], indices[0]):
        record = records[int(idx)]
        if phase_of_match and record.get("phase_of_match") != phase_of_match:
            continue
        if pressure_level and record.get("pressure_level") != pressure_level:
            continue
        if wickets_lost_band and record.get("wickets_lost_band") != wickets_lost_band:
            continue
        if over_band and record.get("over_band") != over_band:
            continue
        if commentary_type and record.get("commentary_type") != commentary_type:
            continue
        item = dict(record)
        item["score"] = float(1.0 - distance)
        out.append(item)

    out.sort(key=lambda item: (-float(item.get("score", 0.0)), str(item.get("id", ""))))
    return out[:top_k]


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
            phase_of_match=str(row.get("phase_of_match", "MIDDLE_OVERS")),
            pressure_level=str(row.get("pressure_level", "MEDIUM")),
            wickets_lost=int(row.get("wickets_lost", 0)),
            wickets_lost_band=wickets_lost_band(int(row.get("wickets_lost", 0))),
            over=int(row.get("over", 0)),
            over_band=over_band(int(row.get("over", 0))),
            commentary_type=str(row.get("commentary_type", "summary")),
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
        "deterministicOrdering": "score_desc_then_id_asc",
        "requiredFilters": [
            "phase_of_match",
            "pressure_level",
            "wickets_lost_band",
            "over_band",
            "commentary_type",
        ],
    }
    index_metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Saved retrieval index to {index_model_path}")


if __name__ == "__main__":
    main()
