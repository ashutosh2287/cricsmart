export type CommentaryMlAssistMode = "off" | "shadow" | "assist";

function normalizeMode(value: string | undefined): CommentaryMlAssistMode {
  const mode = (value ?? "").trim().toLowerCase();
  if (mode === "shadow") return "shadow";
  if (mode === "assist") return "assist";
  return "off";
}

export function getCommentaryMlAssistMode(): CommentaryMlAssistMode {
  return normalizeMode(process.env.COMMENTARY_ML_ASSIST_MODE);
}

export function isCommentaryMlAssistEnabled(mode: CommentaryMlAssistMode = getCommentaryMlAssistMode()) {
  return mode === "assist";
}

export function isCommentaryMlShadowEnabled(mode: CommentaryMlAssistMode = getCommentaryMlAssistMode()) {
  return mode === "shadow";
}

