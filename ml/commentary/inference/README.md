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
