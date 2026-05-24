import { setMatchState } from "@/lib/eventStore";
import type { MatchState } from "@/services/matchEngine";
import type { BallEvent } from "@/types/ballEvent";
import { emitCommentary } from "@/services/commentary/commentaryBus";

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
    commentaryId?: string;
    text?: string;
    tone?: string;
    importance?: string;
    isBoundary?: boolean;
    isWicket?: boolean;
  };
};

function isCommentaryRealtimeData(
  data: RealtimeEvent["data"]
): data is {
  runtimeMatchId: string;
  commentaryId: string;
  text: string;
  importance?: string;
  isWicket?: boolean;
} {
  return Boolean(
    data &&
      typeof data === "object" &&
      "runtimeMatchId" in data &&
      typeof data.runtimeMatchId === "string" &&
      "commentaryId" in data &&
      typeof data.commentaryId === "string" &&
      "text" in data &&
      typeof data.text === "string" &&
      (!("importance" in data) || typeof data.importance === "string") &&
      (!("isWicket" in data) || typeof data.isWicket === "boolean")
  );
}

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
    case "COMMENTARY":
      if (isCommentaryRealtimeData(data)) {
        emitCommentary({
          matchId,
          text: data.text,
          eventId: data.commentaryId,
          category:
            data.isWicket || data.importance === "high"
              ? "INSIGHT"
              : "BALL",
        });
      }
      dispatchCricUpdate(type, data);
      break;
    case "SIMULATION_STATE_UPDATE":
      console.log("📡 SIMULATION_STATE_UPDATE received");
      if (!data) {
        console.warn("⚠️ SIMULATION_STATE_UPDATE missing data");
        return;
      }
      setMatchState(matchId, data as MatchState);
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
