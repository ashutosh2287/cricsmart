import { SimulationState } from "./simulationState";
import { getPlayer } from "./playerUtils";
import { randomForMatch } from "./simulationRandom";

type Outcome = {
  type:
    | "RUN"
    | "FOUR"
    | "SIX"
    | "WICKET"
    | "WD"
    | "NB"
    | "BYE"
    | "LB";
  runs: number;
  prob: number;
};

function getRequiredRunRate(
  state: SimulationState,
  maxOvers: number
): number | null {
  if (!state.target) return null;

  const ballsLeft = maxOvers * 6 - (state.over * 6 + state.ball);
  const runsNeeded = state.target - state.totalRuns;

  if (ballsLeft <= 0) return null;

  return (runsNeeded / ballsLeft) * 6;
}

export function getBallOutcome(state: SimulationState, matchId?: string): Outcome {
  // ✅ ALWAYS use attribute-based access
  const bat = getPlayer(state.striker);
  const bowl = getPlayer(state.bowler);

  // 🎯 Pressure logic
  const requiredRR = getRequiredRunRate(state, 20);

  let pressure = 1;
  if (requiredRR && requiredRR > 10) pressure = 1.5;
  else if (requiredRR && requiredRR > 8) pressure = 1.2;

  // 🎯 Skill-based modifiers
  const boundaryBoost = bat.aggression;
  const dotPenalty = 1 - bat.consistency;

  let wicketChance = bat.wicketRisk * bowl.wicketTaking * pressure;

  // 🎯 Matchup logic (attribute-based, NOT name-based)
  if (bat.consistency > 0.85 && bowl.wicketTaking > 0.8) {
    wicketChance *= 1.2;
  }

  const outcomes: Outcome[] = [
  { type: "RUN", runs: 0, prob: 0.12 + dotPenalty * 0.08 },  
  { type: "RUN", runs: 1, prob: 0.36 },
  { type: "RUN", runs: 2, prob: 0.08 },
   
  { type: "FOUR", runs: 4, prob: 0.18 * boundaryBoost * pressure },
  { type: "SIX", runs: 6, prob: 0.09 * boundaryBoost * pressure },
  // 🔥 WICKET FIXED
  { type: "WICKET", runs: 0, prob: 0.035 * wicketChance + 0.015 },

  // 🔥 EXTRAS
  { type: "WD", runs: 1, prob: 0.025 },
  { type: "NB", runs: 1, prob: 0.015 },

  // 🔥 BYES (no batsman credit)
  { type: "BYE", runs: randomForMatch(matchId) < 0.7 ? 1 : 2, prob: 0.02 },

  // 🔥 LEG BYES
  { type: "LB", runs: randomForMatch(matchId) < 0.7 ? 1 : 2, prob: 0.02 },
];

  // 🔥 NORMALIZE PROBABILITIES
const totalProb = outcomes.reduce((sum, o) => sum + o.prob, 0);

const normalized = outcomes.map(o => ({
  ...o,
  prob: o.prob / totalProb
}));

return weightedRandom(normalized);
}

function weightedRandom(options: Outcome[]): Outcome {
  const rand = randomForMatch(matchId);
  let sum = 0;

  for (const opt of options) {
    sum += opt.prob;
    if (rand <= sum) return opt;
  }

  return options[0];
}