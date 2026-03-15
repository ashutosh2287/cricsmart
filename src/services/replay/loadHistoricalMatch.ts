import { eventStore } from "@/persistence/eventStore";
import { BallEvent } from "@/types/ballEvent";

export async function loadHistoricalMatch(
  matchId: string
): Promise<BallEvent[]> {

  const events = await eventStore.loadEvents(matchId);

  return events ?? [];

}