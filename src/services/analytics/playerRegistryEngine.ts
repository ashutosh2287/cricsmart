import { getEventStream } from "../matchEngine";

export type PlayerRegistry = {
  batsmen: Set<string>;
  bowlers: Set<string>;
  allPlayers: Set<string>;
};

const registryStore: Record<string, PlayerRegistry> = {};

export function updatePlayerRegistry(matchId: string) {

  const events = getEventStream(matchId);
  if (!events.length) return;

  if (!registryStore[matchId]) {
    registryStore[matchId] = {
      batsmen: new Set(),
      bowlers: new Set(),
      allPlayers: new Set()
    };
  }

  const registry = registryStore[matchId];

  for (const e of events) {

    if (e.batsman) {
      registry.batsmen.add(e.batsman);
      registry.allPlayers.add(e.batsman);
    }

    if (e.nonStriker) {
      registry.batsmen.add(e.nonStriker);
      registry.allPlayers.add(e.nonStriker);
    }

    if (e.bowler) {
      registry.bowlers.add(e.bowler);
      registry.allPlayers.add(e.bowler);
    }

  }

}

export function getPlayerRegistry(matchId: string): PlayerRegistry {

  return registryStore[matchId] ?? {
    batsmen: new Set(),
    bowlers: new Set(),
    allPlayers: new Set()
  };

}

export function getAllPlayers(matchId: string): string[] {

  const registry = getPlayerRegistry(matchId);
  return Array.from(registry.allPlayers);

}

export function getBatsmen(matchId: string): string[] {

  const registry = getPlayerRegistry(matchId);
  return Array.from(registry.batsmen);

}

export function getBowlers(matchId: string): string[] {

  const registry = getPlayerRegistry(matchId);
  return Array.from(registry.bowlers);

}