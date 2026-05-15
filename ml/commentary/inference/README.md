# Commentary Inference

Realtime inference service assets and endpoint contracts.

Endpoints:
- POST /generate-commentary
- POST /generate-over-summary
- POST /generate-match-summary
- POST /generate-turning-point-analysis
- GET /health

The service supports:
- event-level cache keys (matchId, innings, over/ball, narrative state)
- deterministic fallback responses
- latency budget instrumentation for live/replay/simulation
- feature-contract/schema-hash aware offline adapters

Offline scripts:
- `predict_commentary_context.py`
- `predict_template.py`
- `retrieve_examples.py`

Runtime hardening expectations:
- deterministic planner remains authoritative
- invalid or low-confidence ML output must fallback immediately
- retrieval ordering remains deterministic
- runtime feature flags control staged rollout
