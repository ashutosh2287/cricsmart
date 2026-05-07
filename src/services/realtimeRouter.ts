import { setMatchState } from "@/lib/eventStore";
import type { MatchState } from "@/services/matchEngine";
import type { BallEvent } from "@/types/ballEvent";

type RealtimePayload = {
  type: string;
  matchId: string;
  data?: MatchState | {
    committedState?: MatchState;
    event?: BallEvent;
    commentary?: unknown[];
    insights?: unknown[];
    analytics?: unknown;
  };
};

export function routeRealtimeEvent(payload: RealtimePayload) {
  const { type, matchId, data } = payload;

  console.log("📥 ROUTER:", type);

  if (!matchId) return;

  switch (type) {
    /*
    ========================================
    INITIAL STATE
    ========================================
    */
    case "INITIAL_STATE": {
  console.log("🟢 INIT STATE");

  if (!data) {
    console.warn("⚠️ INITIAL_STATE missing data");
    return;
  }

  // ✅ Here data IS MatchState
  setMatchState(matchId, data as MatchState);
  break;
}

    /*
    ========================================
    BALL EVENT
    ========================================
    */
    case "BALL_EVENT": {
  console.log("📥 BALL_EVENT RECEIVED:", data);

  // ✅ TYPE GUARD (VERY IMPORTANT)
  if (!data || !("committedState" in data)) {
    console.warn("⚠️ BALL_EVENT missing committedState", data);
    return;
  }

  const committedState = data.committedState;

  if (!committedState) {
    console.warn("⚠️ committedState is undefined", data);
    return;
  }

  console.log("🔥 APPLYING FULL STATE UPDATE", {
    runs:
      committedState.innings?.[
        committedState.currentInningsIndex
      ]?.runs,
  });

  setMatchState(matchId, committedState);
  break;
}

    /*
    ========================================
    MATCH ENDED
    ========================================
    */
    case "MATCH_ENDED":
      console.log("🏁 MATCH ENDED");
      break;
  }
}