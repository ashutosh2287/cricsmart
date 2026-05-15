# Commentary Intelligence Workspace

This workspace contains AI/ML artifacts for CricSmart commentary intelligence.

The deterministic commentary planner remains authoritative at runtime.
ML is assistive only, replay compatibility is mandatory, and MatchEngine isolation is preserved.

Subfolders:
- datasets
- preprocessing
- embeddings
- retrieval
- training
- models
- prompts
- evaluation
- inference

## Canonical build flow

1. Build dataset (one row per ball):
   - `python ml/commentary/preprocessing/build_commentary_dataset.py --events <normalized_deliveries.csv>`
2. Validate dataset quality gate (training fails on errors):
   - `python ml/commentary/evaluation/dataset_validation.py --data ml/commentary/datasets/processed/commentary_feature_matrix.csv`
3. Train classifier:
   - `python ml/commentary/training/train_commentary_classifier.py`
4. Train template ranker:
   - `python ml/commentary/training/train_template_ranker.py`
5. Generate embeddings:
   - `python ml/commentary/embeddings/generate_embeddings.py`
6. Build retrieval index (local deterministic ordering + required filters):
   - `python ml/commentary/retrieval/build_index.py`
7. Generate offline evaluation report (JSON + markdown):
   - `python ml/commentary/evaluation/generate_eval_report.py`
8. Export model lineage metadata:
   - `python ml/commentary/models/export_metadata.py`

## Hardening artifacts

- Feature contract: `ml/commentary/models/feature_contract.json`
- Runtime thresholds: `ml/commentary/models/runtime_thresholds.json`
- Model lineage metadata: `ml/commentary/models/model_metadata.json`
- Replay validation harness: `ml/commentary/evaluation/replay_validation.py`
- Context snapshots: `ml/commentary/datasets/processed/context_snapshots/`

## Runtime guardrails

- Feature validation before inference (missing/order/NaN/category/schema checks)
- Confidence-aware fallback to deterministic planner defaults
- Feature flags for independent subsystem rollout:
  - `COMMENTARY_CLASSIFIER_ENABLED`
  - `COMMENTARY_TEMPLATE_RANKER_ENABLED`
  - `COMMENTARY_RETRIEVAL_ENABLED`
- Latency budgets:
  - classifier < 10ms
  - retrieval < 20ms
  - ranking < 10ms
- Deterministic retrieval ordering and replay parity checks
