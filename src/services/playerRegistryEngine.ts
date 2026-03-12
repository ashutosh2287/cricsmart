import { getEventStream } from "./matchEngine";

type Player = {
  name: string;
  team?: string;
};

const playerStore: Record<string, Player[]> = {};

export function updatePlayerRegistry(matchId: string) {

  const events = getEventStream(matchId);

  const players = new Map<string, Player>();

  events.forEach(e => {

    if (e.batsman) {
      players.set(e.batsman, { name: e.batsman });
    }

    if (e.nonStriker) {
      players.set(e.nonStriker, { name: e.nonStriker });
    }

    if (e.bowler) {
      players.set(e.bowler, { name: e.bowler });
    }

  });

  playerStore[matchId] = Array.from(players.values());
}

export function getPlayers(matchId: string) {
  return playerStore[matchId] ?? [];
}