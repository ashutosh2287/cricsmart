import { getEventStream } from "./matchEngine";

type Player = {
  name: string;
  team?: string;
};

const playerStore: Record<string, Player[]> = {};

export function updatePlayerRegistry(matchId: string) {
  const events = getEventStream(matchId);

  const seen = new Set<string>();
  const orderedPlayers: Player[] = [];

  const addPlayer = (name?: string) => {
    const trimmed = name?.trim();
    if (!trimmed) return;

    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      orderedPlayers.push({ name: trimmed });
    }
  };

  for (const e of events) {
    // 🟢 Order matters → striker first, then non-striker
    addPlayer(e.batsman);
    addPlayer(e.nonStriker);
  }

  playerStore[matchId] = orderedPlayers;
}