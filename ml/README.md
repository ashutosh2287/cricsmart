# CricSmart ML Workspace

This workspace contains offline data processing, model training, and isolated inference for win-probability ML.

## Structure

- `datasets/` historical ingestion outputs, manifests, contracts
- `feature-engineering/` reusable dataset shaping scripts
- `training/` model training/evaluation/export
- `models/` model artifacts + metadata manifests
- `inference/` FastAPI inference service
- `notebooks/` exploratory analysis

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt
```

## Typical flow

1. Ingest Cricsheet: `python ml/datasets/ingest_cricsheet_t20.py --input <dir> --out ml/datasets/processed`
2. Build snapshots: `python ml/feature-engineering/build_training_snapshots.py --input ml/datasets/processed/normalized_deliveries.csv --out ml/datasets/processed/training_snapshots.csv`
3. Train model: `python ml/training/train_win_probability.py --data ml/datasets/processed/training_snapshots.csv --out-dir ml/models`
4. Evaluate model: `python ml/training/evaluate_model.py --data ml/datasets/processed/training_snapshots.csv --model ml/models/win_probability_model.joblib --metadata ml/models/model_metadata.json --out ml/models/evaluation_report.json`
5. Run inference service: `uvicorn ml.inference.main:app --host 0.0.0.0 --port 8080`
