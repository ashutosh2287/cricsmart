function parseEnabled(value: string | undefined, defaultValue = true): boolean {
  if (value == null || value.trim() === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  return !(normalized === "0" || normalized === "false" || normalized === "off" || normalized === "disabled");
}

export function isCommentaryClassifierEnabled(): boolean {
  return parseEnabled(process.env.COMMENTARY_CLASSIFIER_ENABLED, true);
}

export function isCommentaryRetrievalEnabled(): boolean {
  return parseEnabled(process.env.COMMENTARY_RETRIEVAL_ENABLED, true);
}

export function isCommentaryTemplateRankerEnabled(): boolean {
  return parseEnabled(process.env.COMMENTARY_TEMPLATE_RANKER_ENABLED, true);
}

export const COMMENTARY_ML_LATENCY_BUDGET_MS = {
  classifier: 10,
  retrieval: 20,
  ranking: 10,
} as const;
