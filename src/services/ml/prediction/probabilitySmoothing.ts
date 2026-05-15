const PREVIOUS_WEIGHT = 0.7;
const CURRENT_WEIGHT = 0.3;

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function smoothWinProbability(previous: number, current: number) {
  return clamp(previous * PREVIOUS_WEIGHT + current * CURRENT_WEIGHT);
}

export function getWinProbabilitySmoothingWeights() {
  return {
    previousWeight: PREVIOUS_WEIGHT,
    currentWeight: CURRENT_WEIGHT,
  };
}

