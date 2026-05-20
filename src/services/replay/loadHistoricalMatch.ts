import { getMatchEvents } from "@/services/storage/eventStorage";
import { BallEvent } from "@/types/ballEvent";

export async function loadHistoricalMatch(
  matchId: string
): Promise<BallEvent[]> {

  const events = await getMatchEvents(matchId);

  // Replay engine currently re-simulates from delivery events only.
  // Derived domain events (e.g. WIN_PROBABILITY) stay available via `/api/events`
  // for analytics hydration, but are intentionally excluded from ball replay.
  return (events ?? []).filter((event) =>
    typeof event?.runs === "number" &&
    typeof event?.batsman === "string" &&
    typeof event?.bowler === "string"
  );
}
