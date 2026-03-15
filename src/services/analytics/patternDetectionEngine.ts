import { getEventStream } from "../matchEngine";

type PatternInsight = {
  type: string;
  text: string;
};

const patternStore: Record<string, PatternInsight[]> = {};

export function detectPatterns(matchId: string) {

  const events = getEventStream(matchId);

  const insights: PatternInsight[] = [];

  if (events.length < 12) {
    patternStore[matchId] = insights;
    return;
  }

  /*
  ======================================
  Batting Collapse Detection
  ======================================
  */

  const recent = events.slice(-12);

  const wickets = recent.filter(e => e.wicket).length;

  if (wickets >= 3) {

    insights.push({
      type: "collapse",
      text: "Batting collapse detected (3 wickets in 12 balls)"
    });

  }

  /*
  ======================================
  Boundary Burst Detection
  ======================================
  */

  const boundaries = recent.filter(
    e => e.type === "FOUR" || e.type === "SIX"
  ).length;

  if (boundaries >= 4) {

    insights.push({
      type: "boundary_burst",
      text: "Batting acceleration detected"
    });

  }

  patternStore[matchId] = insights;

}

export function getPatternInsights(matchId: string) {

  return patternStore[matchId] ?? [];

}