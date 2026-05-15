"""Offline evaluation pipeline for commentary ML models.

Generates classifier and template ranker evaluation reports, including:
- Accuracy, precision, recall, F1 per target
- Confusion matrices
- Label distributions
- Tone accuracy
- Template ranking accuracy (NDCG)
- Commentary quality metrics (repetition rate, diversity, narrative quality)

Reports are exported as JSON and Markdown.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd

from ml.commentary.evaluation.commentary_metrics import evaluate_commentary_dataset
from ml.commentary.training.train_commentary_classifier import FEATURE_COLUMNS, TARGET_COLUMNS
from ml.commentary.training.train_template_ranker import FEATURE_COLUMNS as RANKER_FEATURES
from ml.commentary.training.train_template_ranker import TEMPLATE_BY_TYPE
from ml.commentary.training.training_utils import (
    build_confusion_matrix,
    compute_classification_metrics,
    label_distribution,
    set_deterministic_seeds,
)

DEFAULT_DATASET = Path("ml/commentary/datasets/processed/commentary_feature_matrix.csv")
DEFAULT_CLASSIFIER = Path("ml/commentary/models/classifier.joblib")
DEFAULT_RANKER = Path("ml/commentary/models/template_ranker.joblib")
DEFAULT_OUT_DIR = Path("ml/commentary/evaluation")


# ---------------------------------------------------------------------------
# Classifier evaluation
# ---------------------------------------------------------------------------

def evaluate_classifier(
    model: Any,
    df: pd.DataFrame,
    feature_columns: List[str] = FEATURE_COLUMNS,
    target_columns: List[str] = TARGET_COLUMNS,
) -> Dict[str, Any]:
    """Run classifier against the full dataset and return per-target metrics."""
    frame = df[feature_columns].reindex(columns=feature_columns, fill_value=0)
    predictions = model.predict(frame)

    results: Dict[str, Any] = {}
    for idx, target in enumerate(target_columns):
        y_true = df[target].astype(str).tolist()
        y_pred = [str(p) for p in predictions[:, idx]]
        label_names = sorted(set(y_true) | set(y_pred))
        metrics = compute_classification_metrics(y_true, y_pred)
        results[target] = {
            "accuracy": metrics["accuracy"],
            "precision": metrics["precision"],
            "recall": metrics["recall"],
            "f1": metrics["f1"],
            "confusion_matrix": build_confusion_matrix(y_true, y_pred, label_names),
            "label_distribution": label_distribution(df[target]),
        }
    return results


# ---------------------------------------------------------------------------
# Template ranker evaluation
# ---------------------------------------------------------------------------

def _expected_template(commentary_type: str) -> str:
    candidates = TEMPLATE_BY_TYPE.get(str(commentary_type), TEMPLATE_BY_TYPE["summary"])
    return candidates[0]


def evaluate_ranker(
    pipeline: Any,
    df: pd.DataFrame,
    ranker_features: List[str] = RANKER_FEATURES,
) -> Dict[str, Any]:
    """Evaluate template ranker on the full dataset.

    For each row we pick the top-ranked template and compare it to the
    deterministically expected best template.  Reports top-1 accuracy
    and an approximate NDCG.
    """
    from sklearn.metrics import ndcg_score  # local import to keep module lightweight

    rows_with_templates: List[Dict] = []
    for _, row in df.iterrows():
        ctype = str(row.get("commentary_type", "summary"))
        candidates = TEMPLATE_BY_TYPE.get(ctype, TEMPLATE_BY_TYPE["summary"])
        for template_key in candidates:
            payload = row.to_dict()
            payload["template_key"] = template_key
            rows_with_templates.append(payload)

    ranking_df = pd.DataFrame(rows_with_templates)
    all_features = ranker_features + ["template_key"]
    feature_frame = ranking_df.reindex(columns=all_features, fill_value=0)
    scores = pipeline.predict(feature_frame)
    ranking_df["score"] = scores

    correct = 0
    total = 0
    relevances: List[float] = []
    score_lists: List[float] = []
    n_candidates = 3  # each type maps to 3 templates

    idx = 0
    for _, row in df.iterrows():
        ctype = str(row.get("commentary_type", "summary"))
        candidates = TEMPLATE_BY_TYPE.get(ctype, TEMPLATE_BY_TYPE["summary"])
        chunk_scores = scores[idx : idx + len(candidates)]
        top_template = candidates[int(np.argmax(chunk_scores))]
        expected = _expected_template(ctype)
        if top_template == expected:
            correct += 1
        total += 1
        # Ideal relevance: first candidate is best (score 3)
        ideal_rel = [3 - r for r in range(len(candidates))]
        relevances.extend(ideal_rel)
        score_lists.extend(chunk_scores.tolist())
        idx += len(candidates)

    ndcg = float(ndcg_score([relevances], [score_lists])) if relevances else 0.0
    top1_accuracy = correct / total if total else 0.0

    return {
        "top1_accuracy": round(top1_accuracy, 4),
        "ndcg": round(ndcg, 4),
        "total_queries": total,
        "correct_top1": correct,
    }


# ---------------------------------------------------------------------------
# Quality metrics
# ---------------------------------------------------------------------------

def evaluate_quality_metrics(df: pd.DataFrame) -> Dict[str, Any]:
    """Compute commentary quality metrics using the dataset commentary texts."""
    if "commentary_text" not in df.columns:
        return {}
    return evaluate_commentary_dataset(df)


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def _markdown_table(headers: List[str], rows: List[List[str]]) -> str:
    widths = [max(len(h), max((len(r[i]) for r in rows), default=0)) for i, h in enumerate(headers)]
    sep = "| " + " | ".join("-" * w for w in widths) + " |"
    header_row = "| " + " | ".join(h.ljust(widths[i]) for i, h in enumerate(headers)) + " |"
    data_rows = ["| " + " | ".join(str(r[i]).ljust(widths[i]) for i in range(len(headers))) + " |" for r in rows]
    return "\n".join([header_row, sep] + data_rows)


def generate_markdown_report(
    classifier_results: Dict[str, Any],
    ranker_results: Dict[str, Any],
    quality_results: Dict[str, Any],
    generated_at: str,
) -> str:
    lines: List[str] = [
        "# CricSmart Commentary ML — Evaluation Report",
        "",
        f"Generated: {generated_at}",
        "",
        "---",
        "",
        "## Commentary Context Classifier",
        "",
    ]
    for target, metrics in classifier_results.items():
        lines.append(f"### {target}")
        rows = [
            ["accuracy", f"{metrics['accuracy']:.4f}"],
            ["precision", f"{metrics['precision']:.4f}"],
            ["recall", f"{metrics['recall']:.4f}"],
            ["f1", f"{metrics['f1']:.4f}"],
        ]
        lines.append(_markdown_table(["Metric", "Value"], rows))
        lines.append("")

        dist = metrics.get("label_distribution", {})
        if dist:
            lines.append("**Label distribution:**")
            dist_rows = [[k, str(v)] for k, v in sorted(dist.items())]
            lines.append(_markdown_table(["Label", "Count"], dist_rows))
            lines.append("")

    lines += [
        "---",
        "",
        "## Template Ranker",
        "",
    ]
    ranker_rows = [
        ["top1_accuracy", f"{ranker_results.get('top1_accuracy', 0):.4f}"],
        ["ndcg", f"{ranker_results.get('ndcg', 0):.4f}"],
        ["total_queries", str(ranker_results.get("total_queries", 0))],
        ["correct_top1", str(ranker_results.get("correct_top1", 0))],
    ]
    lines.append(_markdown_table(["Metric", "Value"], ranker_rows))
    lines.append("")

    if quality_results:
        lines += [
            "---",
            "",
            "## Commentary Quality Metrics",
            "",
        ]
        quality_rows = [[k, f"{v:.4f}"] for k, v in sorted(quality_results.items())]
        lines.append(_markdown_table(["Metric", "Value"], quality_rows))
        lines.append("")

    return "\n".join(lines)


def generate_reports(
    dataset_path: Path = DEFAULT_DATASET,
    classifier_path: Path = DEFAULT_CLASSIFIER,
    ranker_path: Path = DEFAULT_RANKER,
    out_dir: Path = DEFAULT_OUT_DIR,
) -> None:
    set_deterministic_seeds()
    out_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(dataset_path)
    if df.empty:
        raise ValueError(f"Dataset is empty: {dataset_path}")

    generated_at = datetime.now(timezone.utc).isoformat()

    # ------------------------------------------------------------------
    # Classifier evaluation
    # ------------------------------------------------------------------
    classifier_results: Dict[str, Any] = {}
    if classifier_path.exists():
        classifier_model = joblib.load(classifier_path)
        classifier_results = evaluate_classifier(classifier_model, df)
    else:
        print(f"[WARN] Classifier not found at {classifier_path}, skipping classifier eval.")

    # ------------------------------------------------------------------
    # Ranker evaluation
    # ------------------------------------------------------------------
    ranker_results: Dict[str, Any] = {}
    if ranker_path.exists():
        ranker_model = joblib.load(ranker_path)
        ranker_results = evaluate_ranker(ranker_model, df)
    else:
        print(f"[WARN] Ranker not found at {ranker_path}, skipping ranker eval.")

    # ------------------------------------------------------------------
    # Quality metrics
    # ------------------------------------------------------------------
    quality_results = evaluate_quality_metrics(df)

    # ------------------------------------------------------------------
    # Export JSON report
    # ------------------------------------------------------------------
    eval_report: Dict[str, Any] = {
        "generatedAt": generated_at,
        "datasetPath": str(dataset_path),
        "datasetRows": len(df),
        "classifier": classifier_results,
        "templateRanker": ranker_results,
        "qualityMetrics": quality_results,
    }
    json_path = out_dir / "evaluation_report.json"
    json_path.write_text(json.dumps(eval_report, indent=2), encoding="utf-8")
    print(f"Wrote evaluation report (JSON) to {json_path}")

    # ------------------------------------------------------------------
    # Export confusion matrices separately
    # ------------------------------------------------------------------
    confusion_payload: Dict[str, Any] = {
        "generatedAt": generated_at,
        "matrices": {
            target: metrics.get("confusion_matrix", {})
            for target, metrics in classifier_results.items()
        },
    }
    cm_path = out_dir / "confusion_matrix.json"
    cm_path.write_text(json.dumps(confusion_payload, indent=2), encoding="utf-8")
    print(f"Wrote confusion matrices to {cm_path}")

    # ------------------------------------------------------------------
    # Export Markdown report
    # ------------------------------------------------------------------
    md_report = generate_markdown_report(
        classifier_results, ranker_results, quality_results, generated_at
    )
    md_path = out_dir / "evaluation_report.md"
    md_path.write_text(md_report, encoding="utf-8")
    print(f"Wrote evaluation report (Markdown) to {md_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate offline ML evaluation reports")
    parser.add_argument("--data", default=str(DEFAULT_DATASET))
    parser.add_argument("--classifier", default=str(DEFAULT_CLASSIFIER))
    parser.add_argument("--ranker", default=str(DEFAULT_RANKER))
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    args = parser.parse_args()

    generate_reports(
        dataset_path=Path(args.data),
        classifier_path=Path(args.classifier),
        ranker_path=Path(args.ranker),
        out_dir=Path(args.out_dir),
    )


if __name__ == "__main__":
    main()
