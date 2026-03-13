import { getEventStream } from "../matchEngine";

export type PlayerImpact = {
  score: number;
};

const impactStore: Record<
  string,
  Record<string, PlayerImpact>
> = {};

export function updatePlayerImpact(matchId: string) {

  const events = getEventStream(matchId);
  if (!events.length) return;

  const impact: Record<string, PlayerImpact> = {};

  for (const e of events) {

    const batsman = e.batsman;
    const bowler = e.bowler;

    if (batsman && !impact[batsman]) {
      impact[batsman] = { score: 0 };
    }

    if (bowler && !impact[bowler]) {
      impact[bowler] = { score: 0 };
    }

    // Batting impact
    if (e.type === "FOUR") {
      impact[batsman].score += 2;
    }

    if (e.type === "SIX") {
      impact[batsman].score += 3;
    }

    if (e.type === "RUN") {
      impact[batsman].score += e.runs ?? 1;
    }

    // Bowling impact
    if (e.wicket && bowler) {
      impact[bowler].score += 5;
    }

    if (e.runs === 0 && e.isLegalDelivery && bowler) {
      impact[bowler].score += 1;
    }

  }

  impactStore[matchId] = impact;

}

export function getPlayerImpact(matchId: string, player: string) {

  const matchImpact = impactStore[matchId];
  if (!matchImpact) return 0;

  return matchImpact[player]?.score ?? 0;

}