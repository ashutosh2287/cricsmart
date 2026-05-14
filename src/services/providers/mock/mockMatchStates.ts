import type { ProviderMatchState } from "@/services/providers/types";
import { getMockBallEvents } from "@/services/providers/mock/mockBallEvents";

export function getMockMatchState(externalMatchId: string): ProviderMatchState {
  const events = getMockBallEvents(externalMatchId);
  const latest = events[events.length - 1];

  if (!latest) {
    return {
      externalMatchId,
      status: "upcoming",
      updatedAt: Date.now(),
    };
  }

  return {
    externalMatchId,
    status: "live",
    innings: latest.innings,
    over: latest.over,
    ball: latest.ball,
    score: undefined,
    updatedAt: Date.now(),
  };
}
