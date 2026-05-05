// 🔥 MATCH-SCOPED PLAYER REGISTRY

const matchPlayerMaps: Record<string, Map<string, string>> = {};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ✅ INIT REGISTRY FOR MATCH
export function initPlayerRegistry(matchId: string) {
  if (!matchPlayerMaps[matchId]) {
    matchPlayerMaps[matchId] = new Map();
  }
}

// ✅ REGISTER PLAYER
export function registerPlayer(
  matchId: string,
  apiName: string,
  canonicalName: string
) {
  const map = matchPlayerMaps[matchId];
  if (!map) return;

  const key = normalizeName(apiName);
  map.set(key, canonicalName);
}

// ✅ RESOLVE PLAYER
export function resolvePlayerName(
  matchId: string,
  apiName?: string
): string {
  if (!apiName) return "Unknown";

  const map = matchPlayerMaps[matchId];
  if (!map) return apiName;

  const key = normalizeName(apiName);

  if (map.has(key)) {
    return map.get(key)!;
  }

  // fallback: register as-is
  map.set(key, apiName);
  return apiName;
}
export function clearPlayerRegistry(matchId: string) {
  delete matchPlayerMaps[matchId];
}