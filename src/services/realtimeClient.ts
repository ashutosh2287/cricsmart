import { Match } from "../types/match";

export function connectRealtime(_initialMatches: Match[]) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[realtimeClient] Disabled fake realtime client. Use SSE connectRealtime instead."
    );
  }
}

export function disconnectRealtime() {
  // no-op
}