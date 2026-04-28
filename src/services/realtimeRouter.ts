import { setMatchState } from "@/persistence/eventStore/eventStore";
import type { MatchState } from "@/services/matchEngine";
import type { BallEvent } from "@/types/ballEvent";

type RealtimePayload = {
  type: string;
  matchId: string;
  data?: {
  innings?: MatchState["innings"][number];
  state?: MatchState;

  // 🔥 NEW (THIS FIXES ERROR)
  committedState?: MatchState;
  event?: BallEvent;
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
    case "INITIAL_STATE":
      if (data?.state) {
        console.log("🟢 INIT STATE");
        setMatchState(matchId, data.state);
      }
      break;

    /*
    ========================================
    BALL EVENT
    ========================================
    */
    case "BALL_EVENT": {
  console.log("📥 BALL_EVENT RECEIVED:", data);

  const committedState = data?.committedState;

  if (!committedState) {
    console.warn("⚠️ BALL_EVENT missing committed state", data);
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