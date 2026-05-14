from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="CricSmart Commentary Inference")


class CommentaryRequest(BaseModel):
    base_text: str
    tone: str | None = None


class SummaryRequest(BaseModel):
    text_items: list[str]


@app.post("/generate-commentary")
def generate_commentary(payload: CommentaryRequest):
    tone = (payload.tone or "calm").lower()
    suffix = {
        "dramatic": " Huge moment.",
        "aggressive": " Intent is clear.",
        "analytical": " Tactical angle: pressure remains key.",
        "tense": " This phase is getting tighter.",
        "celebratory": " The momentum swings with that.",
        "calm": "",
    }.get(tone, "")
    return {"text": f"{payload.base_text}{suffix}".strip(), "model": "hybrid-template-v1", "fallback": False}


@app.post("/generate-over-summary")
def generate_over_summary(payload: SummaryRequest):
    return {"summary": " ".join(payload.text_items[-3:]).strip()}


@app.post("/generate-match-summary")
def generate_match_summary(payload: SummaryRequest):
    return {"summary": " ".join(payload.text_items[-6:]).strip()}
