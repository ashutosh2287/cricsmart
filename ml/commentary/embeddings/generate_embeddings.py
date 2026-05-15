from __future__ import annotations

import argparse
import json
from pathlib import Path
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


if __name__ == "__main__":
    main()

