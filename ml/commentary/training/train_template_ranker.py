from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List

import joblib
import pandas as pd
from lightgbm import LGBMRanker
from sklearn.compose import ColumnTransformer
from sklearn.metrics import ndcg_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


FEATURE_COLUMNS = [
    "pressure_score",
    "momentum_score",
    "collapse_score",
    "partnership_strength",
    "death_over_intensity",
    "phase_of_match",
    "commentary_type",
    "tone",
]

TEMPLATE_BY_TYPE = {
    "boundary": ["boundary_pressure_release", "standard_boundary", "single_rotation"],
    "wicket": ["wicket_breakthrough", "wicket_turning_point", "collapse_warning"],
    "pressure": ["pressure_summary", "dot_ball_pressure", "momentum_shift_summary"],
    "momentum": ["momentum_shift", "momentum_shift_summary", "partnership_building"],
    "partnership": ["partnership_building", "single_rotation", "over_summary_attack"],
    "collapse": ["collapse_warning", "wicket_turning_point", "pressure_summary"],
    "turning_point": ["turning_point_summary", "wicket_turning_point", "momentum_shift_summary"],
    "summary": ["over_summary_tight", "over_summary_attack", "single_rotation"],
}


def _expand_ranking_rows(df: pd.DataFrame) -> pd.DataFrame:
    rows: List[Dict] = []
    for _, row in df.iterrows():
        commentary_type = str(row.get("commentary_type", "summary"))
        candidates = TEMPLATE_BY_TYPE.get(commentary_type, TEMPLATE_BY_TYPE["summary"])
        chosen = candidates[0]
        for rank, template_key in enumerate(candidates):
            relevance = 3 - rank if template_key == chosen else max(0, 2 - rank)
            payload = row.to_dict()
            payload["template_key"] = template_key
            payload["relevance"] = relevance
            payload["query_id"] = f"{payload.get('match_id','')}:{payload.get('innings',1)}:{payload.get('over',0)}:{payload.get('ball',0)}"
            rows.append(payload)
    return pd.DataFrame(rows)


def train_ranker(df: pd.DataFrame) -> tuple[Pipeline, float]:
    ranking_df = _expand_ranking_rows(df)

    categorical = ["phase_of_match", "commentary_type", "tone", "template_key"]
    numeric = [column for column in FEATURE_COLUMNS if column not in categorical]
    features = ranking_df[FEATURE_COLUMNS + ["template_key"]]
    labels = ranking_df["relevance"]
    query_sizes = ranking_df.groupby("query_id").size().tolist()

    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("numeric", "passthrough", numeric),
        ]
    )
    ranker = LGBMRanker(
        objective="lambdarank",
        metric="ndcg",
        n_estimators=200,
        learning_rate=0.05,
        random_state=42,
    )

    transformed = preprocessor.fit_transform(features)
    ranker.fit(transformed, labels, group=query_sizes)

    predictions = ranker.predict(transformed)
    ndcg = float(ndcg_score([labels.tolist()], [predictions.tolist()]))

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("ranker", ranker),
        ]
    )
    return pipeline, ndcg


def main() -> None:
    parser = argparse.ArgumentParser(description="Train commentary template ranker")
    parser.add_argument("--data", default="ml/commentary/datasets/processed/commentary_feature_matrix.csv")
    parser.add_argument("--out-dir", default="ml/commentary/models")
    args = parser.parse_args()

    data_path = Path(args.data)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(data_path)
    model, ndcg = train_ranker(df)

    model_path = out_dir / "template_ranker.joblib"
    metrics_path = out_dir / "template_ranker_metrics.json"
    metadata_path = out_dir / "template_ranker_metadata.json"

    joblib.dump(model, model_path)
    metrics_path.write_text(json.dumps({"ndcg": ndcg}, indent=2), encoding="utf-8")
    metadata_path.write_text(
        json.dumps(
            {
                "model": "lightgbm_ranker",
                "features": FEATURE_COLUMNS + ["template_key"],
                "rows": int(len(df)),
                "artifacts": {
                    "model": str(model_path),
                    "metrics": str(metrics_path),
                },
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Saved template ranker to {model_path}")


if __name__ == "__main__":
    main()

