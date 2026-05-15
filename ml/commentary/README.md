# Commentary Intelligence Workspace

This workspace contains AI/ML artifacts for CricSmart commentary intelligence.

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
2. Train classifier:
   - `python ml/commentary/training/train_commentary_classifier.py`
3. Train template ranker:
   - `python ml/commentary/training/train_template_ranker.py`
4. Generate embeddings:
   - `python ml/commentary/embeddings/generate_embeddings.py`
5. Build retrieval index:
   - `python ml/commentary/retrieval/build_index.py`
6. Export model metadata:
   - `python ml/commentary/models/export_metadata.py`
