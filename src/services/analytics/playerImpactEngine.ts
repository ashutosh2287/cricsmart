import { getEventStream } from "../matchEngine";

/* =============================
   TYPES
============================= */

export type PlayerImpact = {
  score: number;
};

/* =============================
   STORE
============================= */

const impactStore: Record<
  string,
  Record<string, PlayerImpact>
> = {};

/* =============================
   UPDATE ENGINE
============================= */

export function updatePlayerImpact(matchId: string) {
  const events = getEventStream(matchId);

  if (!events || events.length === 0) return;

  const impact: Record<string, PlayerImpact> = {};

  for (const e of events) {
    if (!e || !e.type) continue;

    const batsman = e.batsman;
    const bowler = e.bowler;

    /* =============================
       BATTING IMPACT (SAFE)
    ============================= */

    if (batsman) {
      if (!impact[batsman]) {
        impact[batsman] = { score: 0 };
      }

      if (e.type === "FOUR") {
        impact[batsman].score += 2;
      }

      if (e.type === "SIX") {
        impact[batsman].score += 3;
      }

      if (e.type === "RUN") {
        impact[batsman].score += e.runs ?? 1;
      }
    }

    /* =============================
       BOWLING IMPACT (SAFE)
    ============================= */

    if (bowler) {
      if (!impact[bowler]) {
        impact[bowler] = { score: 0 };
      }

      if (e.wicket) {
        impact[bowler].score += 5;
      }

      if (e.runs === 0 && e.isLegalDelivery) {
        impact[bowler].score += 1;
      }
    }
  }

  // ✅ VERY IMPORTANT — persist data
  impactStore[matchId] = impact;
}

/* =============================
   GETTER
============================= */

export function getPlayerImpact(
  matchId: string,
  player: string
) {
  const matchImpact = impactStore[matchId];
  if (!matchImpact) return 0;

  return matchImpact[player]?.score ?? 0;
}