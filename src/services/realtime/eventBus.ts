import type { MatchState } from "@/services/matchEngine";

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
        engineEvent?: {
          id: string;
        };
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


const globalAny = globalThis as unknown as {
  __clientsMap?: Map<string, Set<Client>>;
};

if (!globalAny.__clientsMap) {
  globalAny.__clientsMap = new Map();
}

const clientsMap = globalAny.__clientsMap;

// ✅ ADD CLIENT
export function addClient(matchId: string, client: Client) {
  if (!clientsMap.has(matchId)) {
    clientsMap.set(matchId, new Set());
  }
  clientsMap.get(matchId)!.add(client);
}

// ✅ REMOVE CLIENT
export function removeClient(matchId: string, client: Client) {
  const set = clientsMap.get(matchId);
  if (!set) return;

  set.delete(client);

  if (set.size === 0) {
    clientsMap.delete(matchId);
  }
}

// 🔥 MAIN FUNCTION — SEND DATA TO FRONTEND
export function broadcast(matchId: string, event: RealtimeEvent) {
  const clients = clientsMap.get(matchId);

  if (!clients || clients.size === 0) {
    return;
  }

  let payload: string;

  try {
    payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  } catch (err) {
    console.error("❌ Failed to serialize event", err);
    return;
  }

  let activeClients = 0;

  clients.forEach((client) => {
    try {
      client.send(payload + ":keepalive\n\n");
      console.log(`📡 Broadcasting to client ${client.id}: ${event.type}`);
      activeClients++;
    } catch (err) {
      console.error("❌ Removing dead client", err);
      clients.delete(client); // 🔥 IMPORTANT FIX
    }
  });

  // 🔍 DEBUG (VERY IMPORTANT FOR YOU)
  console.log(`📡 Broadcast → ${event.type} | Clients: ${activeClients}`);
}