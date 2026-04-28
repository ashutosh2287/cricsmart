import { BallEvent } from "@/types/ballEvent";
import { getBaseUrl } from "@/utils/getBaseUrl";

export type StoredEvent = BallEvent & {
  timestamp: number;
};

/**
 * 🔥 APPEND EVENT
 */
export async function appendEvent(matchId: string, event: BallEvent) {
  try {
    const res = await fetch(`${getBaseUrl()}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matchId, event }),
    });

    if (!res.ok) {
      console.error("❌ Append failed:", await res.text());
    }
  } catch (err) {
    console.warn("⚠️ Failed to append event", err);
  }
}

/**
 * 🔥 GET EVENTS
 */
export async function getMatchEvents(
  matchId: string
): Promise<StoredEvent[]> {
  try {
    const res = await fetch(
      `${getBaseUrl()}/api/events?matchId=${matchId}`
    );

    if (!res.ok) {
      console.error("❌ Fetch events failed:", await res.text());
      return [];
    }

    return await res.json();
  } catch (err) {
    console.warn("⚠️ Fetch failed, returning empty", err);
    return [];
  }
}

/**
 * 🔥 CLEAR EVENTS
 */
export async function clearMatchEvents(matchId: string) {
  try {
    const res = await fetch(`${getBaseUrl()}/api/events`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matchId }),
    });

    if (!res.ok) {
      console.error("❌ Clear failed:", await res.text());
    }
  } catch (err) {
    console.warn("⚠️ Clear failed", err);
  }
}