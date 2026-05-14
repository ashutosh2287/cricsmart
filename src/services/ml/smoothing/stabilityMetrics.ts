export type PredictionStabilityMetrics = {
  samples: number;
  averageDelta: number;
  spikeFrequency: number;
  volatilityScore: number;
  spikes: number;
};

type StabilityState = {
  deltas: number[];
  spikes: number;
};

const stabilityStore = new Map<string, StabilityState>();
const SPIKE_THRESHOLD = 12;

function ensureState(matchId: string): StabilityState {
  const existing = stabilityStore.get(matchId);
  if (existing) return existing;

  const created: StabilityState = {
    deltas: [],
    spikes: 0,
  };
  stabilityStore.set(matchId, created);
  return created;
}

function computeVolatility(deltas: number[]): number {
  if (!deltas.length) return 0;
  const mean = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  const variance =
    deltas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / deltas.length;
  return Math.sqrt(variance);
}

export function recordPredictionDelta(matchId: string, delta: number) {
  const state = ensureState(matchId);
  const absDelta = Math.abs(delta);
  state.deltas.push(absDelta);

  if (absDelta >= SPIKE_THRESHOLD) {
    state.spikes += 1;
  }
}

export function getPredictionStabilityMetrics(matchId: string): PredictionStabilityMetrics {
  const state = ensureState(matchId);
  const samples = state.deltas.length;
  const averageDelta = samples
    ? state.deltas.reduce((sum, value) => sum + value, 0) / samples
    : 0;

  return {
    samples,
    averageDelta,
    spikeFrequency: samples ? state.spikes / samples : 0,
    volatilityScore: computeVolatility(state.deltas),
    spikes: state.spikes,
  };
}

export function resetPredictionStabilityMetrics(matchId: string) {
  stabilityStore.delete(matchId);
}
