from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, log_loss


def calibration_bins(y_true: np.ndarray, y_pred: np.ndarray, bins: int = 10):
    edges = np.linspace(0, 1, bins + 1)
    output = []
    for i in range(bins):
        lo, hi = edges[i], edges[i + 1]
        mask = (y_pred >= lo) & (y_pred < hi)
        if not mask.any():
            continue
        output.append(
            {
                "binStart": float(lo),
                "binEnd": float(hi),
                "count": int(mask.sum()),
                "avgPred": float(y_pred[mask].mean()),
                "actualRate": float(y_true[mask].mean()),
            }
        )
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate CricSmart win probability model.")
    parser.add_argument("--data", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    model = joblib.load(args.model)
    meta = json.loads(Path(args.metadata).read_text(encoding="utf-8"))

    features = meta["featureColumns"]
    label = meta["labelColumn"]

    x = df[features]
    y = df[label].astype(int).to_numpy()

    p = model.predict_proba(x)[:, 1]
    y_hat = (p >= 0.5).astype(int)

    innings_stage_accuracy = {}
    for stage_name, stage_filter in {
        "powerplay": df["over"] < 6,
        "middle": (df["over"] >= 6) & (df["over"] < 15),
        "death": df["over"] >= 15,
    }.items():
        mask = stage_filter.to_numpy()
        if mask.any():
            innings_stage_accuracy[stage_name] = float(accuracy_score(y[mask], y_hat[mask]))

    chase_filter = (df["innings"] == 2).to_numpy()
    death_filter = ((df["innings"] == 2) & (df["over"] >= 16)).to_numpy()

    report = {
        "modelVersion": meta.get("modelVersion", "unknown"),
        "overall": {
            "accuracy": float(accuracy_score(y, y_hat)),
            "logLoss": float(log_loss(y, p)),
        },
        "calibration": calibration_bins(y, p),
        "inningsStageAccuracy": innings_stage_accuracy,
        "deathOverPredictionQuality": {
            "samples": int(death_filter.sum()),
            "accuracy": float(accuracy_score(y[death_filter], y_hat[death_filter])) if death_filter.any() else None,
        },
        "chasePredictionStability": {
            "samples": int(chase_filter.sum()),
            "stdDev": float(np.std(p[chase_filter])) if chase_filter.any() else None,
        },
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
