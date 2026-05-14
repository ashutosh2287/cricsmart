type SeedState = {
  value: number;
};

const seedByMatch = new Map<string, SeedState>();
const seedTokenByMatch = new Map<string, string>();

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function xorshift32(state: SeedState): number {
  let x = state.value || 123456789;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  state.value = x >>> 0;
  return (state.value & 0xffffffff) / 0x100000000;
}

export function setSimulationSeed(matchId: string, seed: string) {
  seedByMatch.set(matchId, { value: hashSeed(seed) || 1 });
  seedTokenByMatch.set(matchId, seed);
}

export function clearSimulationSeed(matchId: string) {
  seedByMatch.delete(matchId);
  seedTokenByMatch.delete(matchId);
}

export function randomForMatch(matchId?: string): number {
  if (!matchId) return Math.random();
  const state = seedByMatch.get(matchId);
  if (!state) return Math.random();
  return xorshift32(state);
}

export function getSimulationSeed(matchId: string): string | undefined {
  return seedTokenByMatch.get(matchId);
}
