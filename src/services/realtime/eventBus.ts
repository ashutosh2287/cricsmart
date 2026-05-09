import type { MatchState } from "@/services/matchEngine";

// ✅ Use the SAME client registry that the SSE route writes to
// (SSE route → realtimeController → clientStore → getClients)
import { getClients } from "@/services/realtime/clientStore";

type RealtimeEvent =
  | {
      type: "SIMULATION_STATE_UPDATE";
      matchId: string;
      data: {
        isRunning: boolean;
        isPaused: boolean;
        speed: number;
      };
    }
  | {
      type: "INITIAL_STATE";
      matchId: string;
      data: MatchState;
    }
  | {
      type: "BALL_EVENT";
      matchId: string;
      data: {
        committedState: MatchState;
        engineEvent?: { id: string };
        commentary?: string[];
        insights?: unknown[];
        analytics?: unknown;
      };
    }
  | {
      type: "CONNECTED";
      matchId: string;
      data?: null;
    }
  | {
      type: "MATCH_ENDED";
      matchId: string;
      data: {
        winner: string | null;
        winBy: string | null;
      };
    };

type Client = {
  id: string;
  send: (data: string) => void;
};

// ─────────────────────────────────────────────
// broadcast — sends SSE event to all connected clients for a match
// ─────────────────────────────────────────────
export function broadcast(matchId: string, event: RealtimeEvent) {
  // ✅ Read from the shared clientStore (same map the SSE route writes to)
  const clients = getClients(matchId);

  if (!clients || clients.size === 0) {
    console.warn(`⚠️ broadcast(${event.type}): no clients for match ${matchId}`);
    return;
  }

  let payload: string;

  try {
    // ✅ Correct SSE frame: "event: TYPE\ndata: JSON\n\n"
    // ❌ Do NOT append ":keepalive\n\n" — it corrupts the frame boundary
    payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  } catch (err) {
    console.error("❌ Failed to serialize event", err);
    return;
  }

  let activeClients = 0;
  const deadClients: Client[] = [];

  clients.forEach((client) => {
    try {
      client.send(payload);
      activeClients++;
    } catch (err) {
      console.error("❌ Dead client detected, queuing removal", client.id, err);
      deadClients.push(client as Client);
    }
  });

  // Remove dead clients after iteration (safe)
  for (const dead of deadClients) {
    clients.delete(dead as never);
  }

  console.log(`📡 broadcast → ${event.type} | sent to ${activeClients} client(s) | match: ${matchId}`);
}