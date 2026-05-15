from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import pandas as pd


def _accuracy(df: pd.DataFrame, predicted: str, actual: str) -> float:
    if predicted not in df.columns or actual not in df.columns or df.empty:
        return 0.0
    return float((df[predicted].astype(str) == df[actual].astype(str)).mean())


def _confusion_matrix(df: pd.DataFrame, predicted: str, actual: str) -> dict[str, dict[str, int]]:
    if predicted not in df.columns or actual not in df.columns or df.empty:
        return {}
    matrix = pd.crosstab(df[actual].astype(str), df[predicted].astype(str), dropna=False)
    return {
        str(row): {str(col): int(matrix.loc[row, col]) for col in matrix.columns}
        for row in matrix.index
    }


def _diversity(texts: pd.Series) -> float:
    tokens = [token for text in texts.astype(str).tolist() for token in text.lower().split() if token]
    if not tokens:
        return 0.0
    return float(len(set(tokens)) / len(tokens))


def _repetition_rate(texts: pd.Series) -> float:
    normalized = [text.strip().lower() for text in texts.astype(str).tolist() if text.strip()]
    if not normalized:
        return 0.0
    return float(1.0 - (len(set(normalized)) / len(normalized)))


def _retrieval_relevance(df: pd.DataFrame) -> float:
    if "retrieval_relevance" in df.columns:
        return float(pd.to_numeric(df["retrieval_relevance"], errors="coerce").fillna(0).mean())
    if "retrieval_confidence" in df.columns:
        return float(pd.to_numeric(df["retrieval_confidence"], errors="coerce").fillna(0).mean())
    return 0.0


def generate_report(df: pd.DataFrame) -> dict[str, Any]:
    return {
        "classifier_accuracy": round(_accuracy(df, "predicted_commentary_type", "commentary_type"), 4),
        "template_ranking_accuracy": round(_accuracy(df, "predicted_template_key", "template_key"), 4),
        "tone_accuracy": round(_accuracy(df, "predicted_tone", "tone"), 4),
        "confusion_matrix": _confusion_matrix(df, "predicted_commentary_type", "commentary_type"),
        "commentary_diversity": round(_diversity(df.get("commentary_text", pd.Series(dtype=str))), 4),
        "repetition_rate": round(_repetition_rate(df.get("commentary_text", pd.Series(dtype=str))), 4),
        "retrieval_relevance": round(_retrieval_relevance(df), 4),
        "rows": int(len(df)),
    }


def _markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Commentary Offline Evaluation Report",
        "",
        f"- Rows: {report['rows']}",
        f"- Classifier accuracy: {report['classifier_accuracy']}",
        f"- Template ranking accuracy: {report['template_ranking_accuracy']}",
        f"- Tone accuracy: {report['tone_accuracy']}",
        f"- Commentary diversity: {report['commentary_diversity']}",
        f"- Repetition rate: {report['repetition_rate']}",
        f"- Retrieval relevance: {report['retrieval_relevance']}",
        "",
        "## Confusion Matrix",
        "",
        "```json",
        json.dumps(report["confusion_matrix"], indent=2),
        "```",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate offline commentary evaluation report")
    parser.add_argument("--data", default="ml/commentary/datasets/processed/commentary_feature_matrix.csv")
    parser.add_argument("--out-json", default="ml/commentary/evaluation/offline_eval_report.json")
    parser.add_argument("--out-md", default="ml/commentary/evaluation/offline_eval_report.md")
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    report = generate_report(df)

    json_path = Path(args.out_json)
    md_path = Path(args.out_md)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.parent.mkdir(parents=True, exist_ok=True)

    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    md_path.write_text(_markdown(report), encoding="utf-8")

    print(json.dumps({"json": str(json_path), "markdown": str(md_path)}, indent=2))


if __name__ == "__main__":
    main()
