from __future__ import annotations

import hashlib
import json
import os
import time
from pathlib import Path
from typing import Dict, Optional

import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    matchId: str
    innings: int
    over: int
    ball: int
    currentScore: float
    wicketsLost: float
    oversCompleted: float
    ballsRemaining: float
    target: float = 0
    requiredRunRate: float
    currentRunRate: float
    recentRuns: float
    recentWickets: float
    phaseOfMatch: float
    battingFirst: float
    partnershipRuns: float


class PredictResponse(BaseModel):
    battingWinProbability: float
    confidence: float
    modelVersion: str
    latencyMs: float
    cacheHit: bool


MODEL_PATH = os.getenv("ML_MODEL_PATH", "ml/models/win_probability_model.joblib")
MODEL_METADATA_PATH = os.getenv("ML_MODEL_METADATA_PATH", "ml/models/model_metadata.json")


app = FastAPI(title="CricSmart Win Probability Inference")
cache: Dict[str, PredictResponse] = {}
request_count = 0
cache_hits = 0
latencies = []


def get_model_and_metadata():
    model = joblib.load(MODEL_PATH)
    metadata = json.loads(Path(MODEL_METADATA_PATH).read_text(encoding="utf-8"))
    return model, metadata


def confidence_from_probability(prob: float) -> float:
    return float(min(1.0, max(0.0, abs(prob - 0.5) * 2)))


def key_for_payload(payload: PredictRequest) -> str:
    raw = json.dumps(payload.model_dump(), sort_keys=True).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


@app.on_event("startup")
def startup_event():
    if not Path(MODEL_PATH).exists() or not Path(MODEL_METADATA_PATH).exists():
        raise RuntimeError(
            f"Model artifacts missing. Expected {MODEL_PATH} and {MODEL_METADATA_PATH}"
        )


@app.post("/predict/win-probability", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    global request_count, cache_hits
    request_count += 1

    key = key_for_payload(payload)
    if key in cache:
        cache_hits += 1
        cached = cache[key]
        return PredictResponse(**cached.model_dump(), cacheHit=True)

    started = time.perf_counter()
    model, metadata = get_model_and_metadata()

    row = np.array(
        [
            [
                payload.innings,
                payload.over,
                payload.ball,
                payload.currentScore,
                payload.wicketsLost,
                payload.oversCompleted,
                payload.ballsRemaining,
                payload.target,
                payload.requiredRunRate,
                payload.currentRunRate,
                payload.recentRuns,
                payload.recentWickets,
                payload.phaseOfMatch,
                payload.battingFirst,
                payload.partnershipRuns,
            ]
        ]
    )

    prob = float(model.predict_proba(row)[0][1])
    latency_ms = (time.perf_counter() - started) * 1000
    latencies.append(latency_ms)

    response = PredictResponse(
        battingWinProbability=round(prob * 100, 4),
        confidence=round(confidence_from_probability(prob), 4),
        modelVersion=metadata.get("modelVersion", "unknown"),
        latencyMs=round(latency_ms, 4),
        cacheHit=False,
    )

    cache[key] = response
    return response


@app.get("/debug/ml")
def debug_ml():
    return {
        "requestCount": request_count,
        "cacheHitRate": (cache_hits / request_count) if request_count else 0,
        "avgLatencyMs": (sum(latencies) / len(latencies)) if latencies else 0,
        "cachedEntries": len(cache),
        "modelPath": MODEL_PATH,
        "metadataPath": MODEL_METADATA_PATH,
    }
