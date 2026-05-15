from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from ml.commentary.models.feature_contract import load_feature_contract


def _hash_file(path: Path) -> str:
    if not path.exists():
        return ""
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def main() -> None:
    parser = argparse.ArgumentParser(description="Export unified commentary model metadata")
    parser.add_argument("--models-dir", default="ml/commentary/models")
    parser.add_argument("--dataset", default="ml/commentary/datasets/commentary_dataset.csv")
    parser.add_argument("--out", default="ml/commentary/models/model_metadata.json")
    parser.add_argument("--feature-contract", default="ml/commentary/models/feature_contract.json")
    args = parser.parse_args()

    models_dir = Path(args.models_dir)
    classifier = models_dir / "classifier.joblib"
    ranker = models_dir / "template_ranker.joblib"
    embeddings = models_dir / "commentary_embeddings.npy"
    retrieval_index = models_dir / "commentary_retrieval_index.joblib"
    classifier_metrics = _read_json(models_dir / "classifier_metrics.json")
    ranker_metrics = _read_json(models_dir / "template_ranker_metrics.json")
    dataset = Path(args.dataset)
    feature_contract = load_feature_contract(Path(args.feature_contract))

    label_distribution = {}
    if dataset.exists():
        try:
            import pandas as pd

            df = pd.read_csv(dataset)
            if "commentary_type" in df.columns:
                label_distribution["commentary_type"] = {
                    str(label): int(count)
                    for label, count in df["commentary_type"].astype(str).value_counts().to_dict().items()
                }
            if "tone" in df.columns:
                label_distribution["tone"] = {
                    str(label): int(count)
                    for label, count in df["tone"].astype(str).value_counts().to_dict().items()
                }
        except Exception:
            label_distribution = {}

    payload = {
        "modelVersion": "commentary-v1",
        "trainingTimestamp": datetime.now(timezone.utc).isoformat(),
        "datasetVersion": dataset.name,
        "datasetPath": str(dataset),
        "schemaHash": feature_contract.get("schemaHash", ""),
        "featureContractVersion": feature_contract.get("schemaVersion", "v1"),
        "trainingMetrics": {
            "classifierAccuracy": classifier_metrics.get("commentary_type", {}).get("accuracy", 0),
            "templateRankingAccuracy": ranker_metrics.get("ndcg", 0),
            "toneAccuracy": classifier_metrics.get("tone", {}).get("accuracy", 0),
            "retrievalRelevance": 0,
        },
        "labelDistribution": label_distribution,
        "preprocessingPipelineVersion": feature_contract.get("preprocessingVersion", "v1"),
        "embeddingModelVersion": "sentence-transformers/all-MiniLM-L6-v2",
        "artifacts": {
            "classifier": str(classifier),
            "template_ranker": str(ranker),
            "embeddings": str(embeddings),
            "retrieval_index": str(retrieval_index),
            "feature_contract": str(Path(args.feature_contract)),
        },
        "checksums": {
            "classifier": _hash_file(classifier),
            "template_ranker": _hash_file(ranker),
            "embeddings": _hash_file(embeddings),
            "retrieval_index": _hash_file(retrieval_index),
            "dataset": _hash_file(dataset),
            "feature_contract": _hash_file(Path(args.feature_contract)),
        },
    }
    out_path = Path(args.out)
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote metadata to {out_path}")


if __name__ == "__main__":
    main()
