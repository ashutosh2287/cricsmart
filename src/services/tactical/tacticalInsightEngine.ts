import { getEventStream } from "../matchEngine";
import { getMatchPhase } from "../analytics/matchPhaseEngine";
import { computeCurrentPartnership } from "../analytics/partnershipEngine";

export type TacticalInsight = {
  type:
    | "BOWLING_STRATEGY_FAILING"
    | "BATTING_ACCELERATION_WINDOW"
    | "BOWLING_CONTROL"
    | "PARTNERSHIP_THREAT";

  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

const tacticalStore: Record<string, TacticalInsight[]> = {};

export function getTacticalInsights(matchId: string) {
  return tacticalStore[matchId] ?? [];
}

export function runTacticalInsightEngine(matchId: string) {

  const insights: TacticalInsight[] = [];

  const events = getEventStream(matchId);
  const phase = getMatchPhase(matchId);
  const partnership = computeCurrentPartnership(matchId);

  if (!events.length) return;

  const last12 = events.slice(-12);

  let runs = 0;
  let wickets = 0;

  last12.forEach(e => {

    if (!e.valid) return;

    runs += e.runs ?? 0;

    if (e.wicket) wickets++;

  });

  const balls = last12.filter(e => e.isLegalDelivery).length;

  const runRate = balls ? (runs / balls) * 6 : 0;

  /*
  ========================================
  Bowling Strategy Failure
  ========================================
  */

  if (phase?.phase === "DEATH_OVERS_ATTACK" && runRate > 10) {

    insights.push({
      type: "BOWLING_STRATEGY_FAILING",
      message:
        "Bowlers struggling to control scoring in the death overs.",
      severity: "HIGH"
    });

  }

  /*
  ========================================
  Batting Acceleration Window
  ========================================
  */

  if (phase?.phase === "MIDDLE_OVERS_BUILD" && runRate < 6) {

    insights.push({
      type: "BATTING_ACCELERATION_WINDOW",
      message:
        "Batting side has an opportunity to accelerate scoring.",
      severity: "MEDIUM"
    });

  }

  /*
  ========================================
  Bowling Control
  ========================================
  */

  if (runRate < 5 && wickets === 0) {

    insights.push({
      type: "BOWLING_CONTROL",
      message:
        "Bowlers are controlling the scoring rate effectively.",
      severity: "LOW"
    });

  }

  /*
  ========================================
  Partnership Threat
  ========================================
  */

  if (partnership && partnership.runs >= 70) {

    insights.push({
      type: "PARTNERSHIP_THREAT",
      message:
        `Dangerous partnership developing (${partnership.runs} runs).`,
      severity: "HIGH"
    });

  }

  tacticalStore[matchId] = insights;

}