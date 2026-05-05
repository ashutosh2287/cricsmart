const activeMatches = new Map<string, boolean>();

export function startMatch(matchId: string) {
  activeMatches.set(matchId, true);
}

export function stopMatch(matchId: string) {
  activeMatches.delete(matchId);
}

export function isMatchActive(matchId: string) {
  return activeMatches.has(matchId);
}