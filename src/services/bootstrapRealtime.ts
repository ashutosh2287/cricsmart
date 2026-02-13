import { fetchMatches } from "./apiClient";
import { setMatches } from "@/store/realtimeStore";
import { startGlobalRealtime } from "./globalRealtime";

let started = false;

export async function bootstrapRealtime() {

  if (started) return;

  started = true;

  // Load initial data
  const matches = await fetchMatches();

  setMatches(matches);

  // Start SSE realtime
  startGlobalRealtime();

}
