import { BallEvent } from "@/types/ballEvent";

/**
 * 🔹 Stored Event Model
 */
export type StoredEvent = BallEvent & {
  timestamp: number;
};

/**
 * 🔹 Event Storage Interface
 */
export interface EventStorage {
  append(matchId: string, event: BallEvent): Promise<void>;
  getAll(matchId: string): Promise<StoredEvent[]>;
  clear(matchId: string): Promise<void>;
}

/**
 * 🔹 In-Memory Storage (CLIENT SAFE FALLBACK)
 */
class MemoryEventStorage implements EventStorage {
  private db = new Map<string, StoredEvent[]>();

  async append(matchId: string, event: BallEvent) {
    const events = this.db.get(matchId) || [];

    events.push({
      ...event,
      timestamp: Date.now(),
    });

    this.db.set(matchId, events);
  }

  async getAll(matchId: string) {
    return this.db.get(matchId) || [];
  }

  async clear(matchId: string) {
    this.db.delete(matchId);
  }
}

const memoryStorage = new MemoryEventStorage();

/**
 * 🔹 SAFE FETCH HELPER (CRITICAL FIX)
 */
async function safeFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      const text = await res.text();
      console.warn(`⚠️ API ERROR (${url}):`, text);
      return null;
    }

    // Ensure it's actually JSON
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`⚠️ Non-JSON response from (${url})`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn(`⚠️ Fetch failed (${url})`);
    return null;
  }
}

/**
 * 🔹 Public API
 */
export async function appendEvent(matchId: string, event: BallEvent) {
  const result = await safeFetch("/api/events", {
    method: "POST",
    body: JSON.stringify({ matchId, event }),
  });

  if (!result) {
    return memoryStorage.append(matchId, event);
  }
}

export async function getMatchEvents(matchId: string) {
  const data = await safeFetch(`/api/events?matchId=${matchId}`);

  if (!data) {
    return memoryStorage.getAll(matchId);
  }

  return data;
}

export async function clearMatchEvents(matchId: string) {
  const result = await safeFetch("/api/events", {
    method: "DELETE",
    body: JSON.stringify({ matchId }),
  });

  if (!result) {
    return memoryStorage.clear(matchId);
  }
}