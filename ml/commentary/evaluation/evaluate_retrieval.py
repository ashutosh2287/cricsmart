"""Offline evaluation pipeline for the commentary retrieval system.

Metrics reported:

* **retrieval_relevance**  — fraction of top-k results that share the same
  commentary_type as the query row.
* **contextual_alignment** — fraction of top-k results that match the query
  row's phase_of_match and pressure_level.
* **narrative_similarity** — mean cosine similarity score of the top-k results.
* **retrieval_diversity**  — fraction of unique texts across all top-k result
  sets (diversity of retrieved commentary phrases).
* **duplicate_frequency**  — mean fraction of duplicate texts per query.

Outputs:

* ``retrieval_evaluation_report.json``
* ``retrieval_evaluation_report.md``
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import numpy as np

if __package__ in {None, ""}:
    import sys
    sys.path.append(str(Path(__file__).resolve().parents[3]))

DEFAULT_INDEX_DIR = Path("ml/commentary/models/retrieval")
DEFAULT_EMBEDDINGS_DIR = Path("ml/commentary/embeddings/artifacts")
DEFAULT_OUT_DIR = Path("ml/commentary/evaluation")

_MIN_SIMILARITY = 0.0  # Evaluate across the full spectrum; thresholding is a deployment concern.


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    na = float(np.linalg.norm(a))
    nb = float(np.linalg.norm(b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def _load_index(index_dir: Path):
    """Load FAISS index and associated metadata records."""
    try:
        import faiss  # type: ignore[import]
    except ImportError as err:
        raise RuntimeError(
            "faiss-cpu is required for retrieval evaluation. Install ml/requirements.txt."
        ) from err

    index_path = index_dir / "commentary_retrieval.faiss"
    metadata_path = index_dir / "commentary_retrieval_metadata.json"
    if not index_path.exists() or not metadata_path.exists():
        raise FileNotFoundError(
            f"Retrieval index not found in {index_dir}. "
            "Run build_retrieval_index.py first."
        )

    index = faiss.read_index(str(index_path))
    meta = json.loads(metadata_path.read_text(encoding="utf-8"))
    return index, meta


def _build_composite_vector(
    embedding: np.ndarray,
    context_feat: np.ndarray,
    embedding_weight: float,
    context_weight: float,
) -> np.ndarray:
    def _norm(v: np.ndarray) -> np.ndarray:
        n = float(np.linalg.norm(v))
        return v / n if n > 0.0 else v

    composite = np.concatenate([
        _norm(embedding) * embedding_weight,
        _norm(context_feat) * context_weight,
    ]).astype("float32")
    n = float(np.linalg.norm(composite))
    return composite / n if n > 0.0 else composite


def evaluate_retrieval(
    index,
    meta: Dict[str, Any],
    embeddings: np.ndarray,
    context_features: np.ndarray,
    *,
    top_k: int = 5,
    sample_size: int = 200,
) -> Dict[str, Any]:
    """Run retrieval evaluation over a sample of the index records.

    Args:
        index: Loaded FAISS index.
        meta: Index metadata dict (must contain ``records`` list).
        embeddings: Text embedding matrix (N × dim).
        context_features: Context feature matrix (N × context_dim).
        top_k: Number of results to retrieve per query.
        sample_size: Maximum number of query rows to evaluate.

    Returns:
        Dict of aggregate evaluation metrics.
    """
    records: List[Dict[str, Any]] = meta.get("records", [])
    embedding_weight = float(meta.get("embeddingWeight", 0.35))
    context_weight = float(meta.get("contextWeight", 0.65))

    n = min(len(records), sample_size)
    if n == 0:
        return {"error": "empty_index"}

    rng = np.random.default_rng(42)  # deterministic sampling
    indices = rng.choice(len(records), size=n, replace=False).tolist()
    indices = sorted(indices)

    relevance_scores: List[float] = []
    alignment_scores: List[float] = []
    similarity_scores: List[float] = []
    all_texts: List[str] = []
    duplicate_fracs: List[float] = []

    for qi in indices:
        q_record = records[qi]
        emb = embeddings[qi]
        ctx = context_features[qi]

        composite = _build_composite_vector(emb, ctx, embedding_weight, context_weight).reshape(1, -1)
        distances, result_indices = index.search(composite, top_k + 1)  # +1 to exclude self

        retrieved: List[Dict[str, Any]] = []
        sims: List[float] = []
        for dist, ridx in zip(distances[0], result_indices[0]):
            if ridx == qi or ridx < 0:
                continue
            retrieved.append(records[ridx])
            sims.append(float(dist))  # FAISS inner-product = cosine similarity after normalisation
            if len(retrieved) >= top_k:
                break

        if not retrieved:
            continue

        # Retrieval relevance: same commentary_type
        rel = sum(1 for r in retrieved if r.get("commentary_type") == q_record.get("commentary_type"))
        relevance_scores.append(rel / len(retrieved))

        # Contextual alignment: same phase + pressure
        align = sum(
            1 for r in retrieved
            if r.get("phase_of_match") == q_record.get("phase_of_match")
            and r.get("pressure_level") == q_record.get("pressure_level")
        )
        alignment_scores.append(align / len(retrieved))

        # Narrative similarity: mean cosine score
        similarity_scores.extend(sims)

        # Diversity metrics
        texts = [str(r.get("commentary_text", "")).lower().strip() for r in retrieved]
        all_texts.extend(texts)
        unique_in_result = len(set(texts))
        duplicate_fracs.append(1.0 - unique_in_result / len(texts))

    def _mean(lst: List[float]) -> float:
        return round(float(np.mean(lst)), 4) if lst else 0.0

    total_texts = len(all_texts)
    unique_texts = len(set(all_texts))

    return {
        "queries_evaluated": n,
        "retrieval_relevance": _mean(relevance_scores),
        "contextual_alignment": _mean(alignment_scores),
        "narrative_similarity": _mean(similarity_scores),
        "retrieval_diversity": round(unique_texts / total_texts, 4) if total_texts > 0 else 0.0,
        "duplicate_frequency": _mean(duplicate_fracs),
    }


def generate_markdown_report(metrics: Dict[str, Any], generated_at: str) -> str:
    rows = [
        ["queries_evaluated", str(metrics.get("queries_evaluated", 0))],
        ["retrieval_relevance", f"{metrics.get('retrieval_relevance', 0):.4f}"],
        ["contextual_alignment", f"{metrics.get('contextual_alignment', 0):.4f}"],
        ["narrative_similarity", f"{metrics.get('narrative_similarity', 0):.4f}"],
        ["retrieval_diversity", f"{metrics.get('retrieval_diversity', 0):.4f}"],
        ["duplicate_frequency", f"{metrics.get('duplicate_frequency', 0):.4f}"],
    ]
    widths = [
        max(len("Metric"), max(len(r[0]) for r in rows)),
        max(len("Value"), max(len(r[1]) for r in rows)),
    ]
    header = f"| {'Metric'.ljust(widths[0])} | {'Value'.ljust(widths[1])} |"
    sep = f"| {'-' * widths[0]} | {'-' * widths[1]} |"
    body = "\n".join(
        f"| {r[0].ljust(widths[0])} | {r[1].ljust(widths[1])} |"
        for r in rows
    )
    return "\n".join([
        "# CricSmart Commentary — Retrieval Evaluation Report",
        "",
        f"Generated: {generated_at}",
        "",
        "---",
        "",
        "## Retrieval Metrics",
        "",
        header,
        sep,
        body,
        "",
    ])


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate commentary retrieval system")
    parser.add_argument("--index-dir", default=str(DEFAULT_INDEX_DIR))
    parser.add_argument("--embeddings-dir", default=str(DEFAULT_EMBEDDINGS_DIR))
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--sample-size", type=int, default=200)
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    index, meta = _load_index(Path(args.index_dir))

    embeddings_dir = Path(args.embeddings_dir)
    embeddings = np.load(embeddings_dir / "commentary_embeddings.npy").astype("float32")
    context_features = np.load(embeddings_dir / "commentary_context_features.npy").astype("float32")

    generated_at = datetime.now(timezone.utc).isoformat()
    metrics = evaluate_retrieval(
        index,
        meta,
        embeddings,
        context_features,
        top_k=args.top_k,
        sample_size=args.sample_size,
    )

    report: Dict[str, Any] = {"generatedAt": generated_at, **metrics}

    json_path = out_dir / "retrieval_evaluation_report.json"
    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote retrieval evaluation report (JSON) to {json_path}")

    md_path = out_dir / "retrieval_evaluation_report.md"
    md_path.write_text(generate_markdown_report(metrics, generated_at), encoding="utf-8")
    print(f"Wrote retrieval evaluation report (Markdown) to {md_path}")


if __name__ == "__main__":
    main()
