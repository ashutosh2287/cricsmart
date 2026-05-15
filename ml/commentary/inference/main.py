from time import perf_counter
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="CricSmart Commentary Inference")


class CommentaryRequest(BaseModel):
    match_id: str = "unknown"
    innings: int = 1
    over: int = 0
    ball: int = 0
    narrative_state: str = "balanced"
    runtime_mode: str = "live"
    base_text: str
    tone: str | None = None


class SummaryRequest(BaseModel):
    match_id: str = "unknown"
    innings: int = 1
    over: int = 0
    ball: int = 0
    narrative_state: str = "balanced"
    text_items: list[str]


class TurningPointRequest(BaseModel):
    match_id: str
    context_events: list[str]


latency_budgets = {
    "live": 200,
    "replay": 75,
    "simulation": 100,
}

commentary_cache: dict[str, dict] = {}
stats = {
    "request_count": 0,
    "cache_hits": 0,
    "fallback_count": 0,
    "over_budget_count": 0,
    "total_latency_ms": 0.0,
}


def budget_for_mode(runtime_mode: str) -> int:
    return latency_budgets.get(runtime_mode, latency_budgets["live"])


def cache_key_for_commentary(payload: CommentaryRequest) -> str:
    return f"{payload.match_id}:{payload.innings}:{payload.over}:{payload.ball}:{payload.narrative_state}:{payload.tone or 'calm'}"


def with_metrics(response: dict, *, started_at: float, runtime_mode: str):
    latency_ms = (perf_counter() - started_at) * 1000
    stats["total_latency_ms"] += latency_ms
    budget_ok = latency_ms <= budget_for_mode(runtime_mode)
    if not budget_ok:
        stats["over_budget_count"] += 1

    response["latencyMs"] = latency_ms
    response["budgetMs"] = budget_for_mode(runtime_mode)
    response["budgetOk"] = budget_ok
    return response


@app.post("/generate-commentary")
def generate_commentary(payload: CommentaryRequest):
    started_at = perf_counter()
    stats["request_count"] += 1

    key = cache_key_for_commentary(payload)
    if key in commentary_cache:
      stats["cache_hits"] += 1
      cached = dict(commentary_cache[key])
      cached["cacheHit"] = True
      return with_metrics(cached, started_at=started_at, runtime_mode=payload.runtime_mode)

    tone = (payload.tone or "calm").lower()
    suffix = {
        "dramatic": " Huge moment.",
        "aggressive": " Intent is clear.",
        "analytical": " Tactical angle: pressure remains key.",
        "tense": " This phase is getting tighter.",
        "celebratory": " The momentum swings with that.",
        "calm": "",
    }.get(tone, "")

    text = f"{payload.base_text}{suffix}".strip() or "No significant update on that delivery."
    if text == "No significant update on that delivery.":
        stats["fallback_count"] += 1

    result = {
        "text": text,
        "model": "hybrid-template-v2",
        "fallback": text == "No significant update on that delivery.",
        "cacheHit": False,
    }
    commentary_cache[key] = result
    return with_metrics(result, started_at=started_at, runtime_mode=payload.runtime_mode)


@app.post("/generate-over-summary")
def generate_over_summary(payload: SummaryRequest):
    started_at = perf_counter()
    summary = " ".join(payload.text_items[-3:]).strip() or "Over summary unavailable."
    return with_metrics(
        {
            "summary": summary,
            "fallback": summary == "Over summary unavailable.",
        },
        started_at=started_at,
        runtime_mode="live",
    )


@app.post("/generate-match-summary")
def generate_match_summary(payload: SummaryRequest):
    started_at = perf_counter()
    summary = " ".join(payload.text_items[-6:]).strip() or "Match summary unavailable."
    return with_metrics(
        {
            "summary": summary,
            "fallback": summary == "Match summary unavailable.",
        },
        started_at=started_at,
        runtime_mode="live",
    )


@app.post("/generate-turning-point-analysis")
def generate_turning_point_analysis(payload: TurningPointRequest):
    started_at = perf_counter()
    tail = payload.context_events[-3:]
    analysis = (
        "Turning point analysis: " + " | ".join(tail)
        if tail
        else "Turning point analysis unavailable."
    )

    return with_metrics(
        {
            "analysis": analysis,
            "fallback": analysis == "Turning point analysis unavailable.",
        },
        started_at=started_at,
        runtime_mode="live",
    )


@app.get("/health")
def health():
    avg_latency = stats["total_latency_ms"] / stats["request_count"] if stats["request_count"] else 0
    cache_hit_rate = stats["cache_hits"] / stats["request_count"] if stats["request_count"] else 0
    return {
        "ok": True,
        "requestCount": stats["request_count"],
        "fallbackCount": stats["fallback_count"],
        "cacheHitRate": cache_hit_rate,
        "avgLatencyMs": avg_latency,
        "overBudgetCount": stats["over_budget_count"],
        "latencyBudgets": latency_budgets,
    }
