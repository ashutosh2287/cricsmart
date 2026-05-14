export type WinProbabilityMode = "legacy" | "ml_local";

function normalizeMode(value: string | undefined): WinProbabilityMode {
  const mode = (value ?? "").trim().toLowerCase();
  if (mode === "legacy") return "legacy";
  if (mode === "ml_local") return "ml_local";
  return "legacy";
}

export function getWinProbabilityMode(): WinProbabilityMode {
  return normalizeMode(process.env.WIN_PROBABILITY_MODE);
}

export function isMlWinProbabilityEnabled(mode: WinProbabilityMode = getWinProbabilityMode()) {
  return mode === "ml_local";
}

export function getWinProbabilityDebounceMs(): number {
  const raw = Number(process.env.WIN_PROBABILITY_DEBOUNCE_MS ?? 120);
  if (!Number.isFinite(raw) || raw < 0) return 120;
  return Math.floor(raw);
}
