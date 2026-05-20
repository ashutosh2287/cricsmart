import { getMatchEvents } from "@/services/storage/eventStorage";
import { BallEvent } from "@/types/ballEvent";

export async function loadHistoricalMatch(
  matchId: string
): Promise<BallEvent[]> {

  const events = await getMatchEvents(matchId);

  return (events ?? []).filter((event) =>
    typeof event?.runs === "number" &&
    typeof event?.batsman === "string" &&
    typeof event?.bowler === "string"
  );
}
