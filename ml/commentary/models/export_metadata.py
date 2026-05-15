from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def _hash_file(path: Path) -> str:
    if not path.exists():
        return ""
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description="Export unified commentary model metadata")
    parser.add_argument("--models-dir", default="ml/commentary/models")
    parser.add_argument("--dataset", default="ml/commentary/datasets/commentary_dataset.csv")
    parser.add_argument("--out", default="ml/commentary/models/metadata.json")
    args = parser.parse_args()

    models_dir = Path(args.models_dir)
    classifier = models_dir / "classifier.joblib"
    ranker = models_dir / "template_ranker.joblib"
    embeddings = models_dir / "commentary_embeddings.npy"
    retrieval_index = models_dir / "commentary_retrieval_index.joblib"
    dataset = Path(args.dataset)

    payload = {
        "artifacts": {
            "classifier": str(classifier),
            "template_ranker": str(ranker),
            "embeddings": str(embeddings),
            "retrieval_index": str(retrieval_index),
        },
        "checksums": {
            "classifier": _hash_file(classifier),
            "template_ranker": _hash_file(ranker),
            "embeddings": _hash_file(embeddings),
            "retrieval_index": _hash_file(retrieval_index),
            "dataset": _hash_file(dataset),
        },
        "lineage": {
            "dataset": str(dataset),
            "schema": "ml/commentary/datasets/commentary_dataset_schema.json",
            "feature_contract": "ml/commentary/training/train_commentary_classifier.py::FEATURE_COLUMNS",
        },
    }
    out_path = Path(args.out)
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote metadata to {out_path}")


if __name__ == "__main__":
    main()

