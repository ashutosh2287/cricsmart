import type { ApiBallEvent } from "@/services/api/cricketApiService";
import type { MockFixturePack } from "@/services/providers/mock/mockFixtures";
import { mockFixturePacks } from "@/services/providers/mock/mockFixtures";

function buildEvents(
  matchId: string,
  innings: number,
  overStart: number,
  overs: number,
  baseRuns: number,
  wicketEvery = 0,
  batting = "Batter",
  bowling = "Bowler"
): ApiBallEvent[] {
  const events: ApiBallEvent[] = [];
  let clock = Date.now();

  for (let over = overStart; over < overStart + overs; over++) {
    for (let ball = 1; ball <= 6; ball++) {
      const seq = (over - overStart) * 6 + ball;
      const runs = (baseRuns + seq) % 7;
      const wicket = wicketEvery > 0 && seq % wicketEvery === 0;

      events.push({
        id: `${matchId}_${innings}_${over}_${ball}`,
        innings,
        over,
        ball,
        batsman: `${batting} ${innings + 1}`,
        nonStriker: `${batting} ${innings + 2}`,
        bowler: `${bowling} ${Math.floor(over / 2) + 1}`,
        runs,
        wicket,
        type: wicket ? "WICKET" : runs === 4 ? "FOUR" : runs === 6 ? "SIX" : "RUN",
        timestamp: clock,
        commentary: wicket
          ? `Wicket! ${batting} ${innings + 1} departs in over ${over}.${ball}`
          : `${runs} run${runs === 1 ? "" : "s"} at ${over}.${ball}`,
      });

      clock += 12_000;
    }
  }

  return events;
}

function byKey(key: MockFixturePack["key"], id: string): ApiBallEvent[] {
  switch (key) {
    case "ipl-chase":
      return [...buildEvents(id, 0, 0, 8, 1, 0, "MI Batter", "CSK Bowler")];
    case "super-over":
      return [...buildEvents(id, 0, 19, 1, 2, 0, "IND Batter", "PAK Bowler")];
    case "collapse":
      return [...buildEvents(id, 0, 5, 5, 0, 4, "ENG Batter", "AUS Bowler")];
    case "low-scoring-thriller":
      return [...buildEvents(id, 0, 0, 10, 0, 9, "SL Batter", "BAN Bowler")];
    case "odi-chase":
      return [...buildEvents(id, 1, 25, 12, 2, 11, "IND Batter", "AUS Bowler")];
    case "t20-death-overs":
      return [...buildEvents(id, 0, 15, 5, 3, 10, "SA Batter", "NZ Bowler")];
    default:
      return [...buildEvents(id, 0, 0, 3, 1)];
  }
}

export const mockBallEvents: Record<string, ApiBallEvent[]> = Object.fromEntries(
  mockFixturePacks.map((pack) => {
    const id = String(pack.match.id ?? pack.key);
    return [id, byKey(pack.key, id)];
  })
);

export function getMockBallEvents(matchId: string): ApiBallEvent[] {
  return mockBallEvents[matchId] ?? [];
}
