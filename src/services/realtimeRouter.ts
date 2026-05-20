import { setMatchState } from "@/lib/eventStore";
import type { MatchState } from "@/services/matchEngine";
import type { BallEvent } from "@/types/ballEvent";

export type RealtimeEvent = {
  type: string;
  matchId: string;
  data?: MatchState | {
    committedState?: MatchState;
    event?: BallEvent;
    probability?: number;
    awayProbability?: number;
    over?: number;
    ball?: number;
    innings?: number;
    timestamp?: number;
    modelVersion?: string;
    commentary?: unknown[];
    insights?: unknown[];
    analytics?: unknown;
  };
};

function dispatchCricUpdate(type: string, data: RealtimeEvent["data"]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("CRIC_UPDATE", {
      detail: {
        type,
        ...(data && typeof data === "object" ? data : {}),
      },
    })
  );
}

export function routeRealtimeEvent(payload: RealtimeEvent) {
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
  dispatchCricUpdate(type, data);
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
  dispatchCricUpdate(type, data);
  break;
}

    case "WICKET":
      dispatchCricUpdate(type, data);
      break;
    case "WIN_PROBABILITY_UPDATE":
      dispatchCricUpdate(type, data);
      break;

    /*
    ========================================
    MATCH ENDED
    ========================================
    */
    case "MATCH_FINISHED":
      console.log("🏁 MATCH FINISHED");
      dispatchCricUpdate(type, data);
      break;
    case "MATCH_ENDED":
      console.log("🏁 MATCH ENDED");
      dispatchCricUpdate(type, data);
      break;
  }
}
