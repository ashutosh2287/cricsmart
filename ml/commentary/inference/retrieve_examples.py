from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
from sentence_transformers import SentenceTransformer

from ml.commentary.retrieval.build_index import retrieve_similar_commentary


def main() -> None:
    parser = argparse.ArgumentParser(description="Retrieve similar commentary examples")
    parser.add_argument("--query", required=True, help="Query text")
    parser.add_argument("--index", default="ml/commentary/models/commentary_retrieval_index.joblib")
    parser.add_argument("--metadata", default="ml/commentary/models/commentary_retrieval_index.json")
    parser.add_argument("--phase", default=None)
    parser.add_argument("--pressure", default=None)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    model = SentenceTransformer("all-MiniLM-L6-v2")
    query_vector = np.asarray(model.encode([args.query], normalize_embeddings=True), dtype=np.float32)[0]

    nn_model = joblib.load(Path(args.index))
    metadata = json.loads(Path(args.metadata).read_text(encoding="utf-8"))

    index = {
        "nn_model": nn_model,
        "records": metadata.get("records", []),
    }
    results = retrieve_similar_commentary(
        index,
        query_vector,
        top_k=args.top_k,
        phase_of_match=args.phase,
        pressure_level=args.pressure,
    )
    Path(args.out).write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Wrote retrieval examples to {args.out}")


if __name__ == "__main__":
    main()

