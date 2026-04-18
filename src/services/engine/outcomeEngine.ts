import type { MatchState } from "@/services/matchEngine";

type Outcome = 0 | 1 | 2 | 3 | 4 | 6 | "W";

type ProbabilityMap = Record<Outcome, number>;

function normalize(prob: ProbabilityMap): ProbabilityMap {
  const total = Object.values(prob).reduce((a, b) => a + b, 0);
  const result: ProbabilityMap = {} as ProbabilityMap;

  for (const key in prob) {
    result[key as unknown as Outcome] = prob[key as unknown as Outcome] / total;
  }

  return result;
}

function pickOutcome(prob: ProbabilityMap): Outcome {
  const rand = Math.random();
  let cumulative = 0;

  for (const key in prob) {
    cumulative += prob[key as unknown as Outcome];
    if (rand <= cumulative) return key as unknown as Outcome;
  }

  return 0;
}
export function getOutcomeFromIntent(
  state: MatchState,
  intent: string,
  striker?: string
): Outcome {
  const format = state.format;

  // 🔥 ONLY T20 FOR NOW
  if (format === "T20") {
    let prob: ProbabilityMap;

    if (intent === "AGGRESSIVE") {
      prob = {
        0: 0.25,
        1: 0.15,
        2: 0.05,
        3: 0.01,
        4: 0.2,
        6: 0.2,
        W: 0.14,
      };
    } else if (intent === "ATTACKING") {
      prob = {
        0: 0.3,
        1: 0.25,
        2: 0.1,
        3: 0.02,
        4: 0.18,
        6: 0.08,
        W: 0.07,
      };
    } else if (intent === "DEFENSIVE") {
      prob = {
        0: 0.4,
        1: 0.4,
        2: 0.1,
        3: 0.01,
        4: 0.05,
        6: 0.01,
        W: 0.03,
      };
    } else {
      // BALANCED
      prob = {
        0: 0.35,
        1: 0.3,
        2: 0.1,
        3: 0.02,
        4: 0.15,
        6: 0.05,
        W: 0.03,
      };
    }

    return pickOutcome(normalize(prob));
  }

  // 🔥 FUTURE ODI (placeholder)
  return 1;
}