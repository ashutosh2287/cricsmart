// ❌ REMOVE eventBus completely
// import { subscribeSimulation, unsubscribeSimulation } from "@/services/realtime/eventBus";
import type { SimulationEvent } from "@/services/simulation/matchSimulator";

type Client = {
  id: string;
  send: (data: string) => void;
};
type GlobalWithClients = typeof globalThis & {
  __MATCH_CLIENTS__?: Map<string, Set<Client>>;
};

const globalStore = globalThis as GlobalWithClients;

if (!globalStore.__MATCH_CLIENTS__) {
  globalStore.__MATCH_CLIENTS__ = new Map<string, Set<Client>>();
}

const matchClients = globalStore.__MATCH_CLIENTS__;

function getClients(matchId: string) {
  if (!matchClients.has(matchId)) {
    matchClients.set(matchId, new Set());
  }
  return matchClients.get(matchId)!;
}

// ✅ Add client
export function addClient(matchId: string, client: Client) {
  const clients = getClients(matchId);
  clients.add(client);

  console.log(`➕ Client added to match ${matchId} (total: ${clients.size})`);
}

// ❌ Remove client
export function removeClient(matchId: string, client: Client) {
  const clients = matchClients.get(matchId);
  if (!clients) return;

  clients.delete(client);

  console.log(`➖ Client removed from match ${matchId} (remaining: ${clients.size})`);

  if (clients.size === 0) {
    matchClients.delete(matchId);
  }
}

// 📡 Broadcast event directly (NO EVENT BUS)
export function broadcast(matchId: string, payload: SimulationEvent) {
  const clients = matchClients.get(matchId);

  if (!clients || clients.size === 0) {
    console.warn(`⚠️ No clients for match ${matchId}`);
    return;
  }

  const data = `data: ${JSON.stringify(payload)}\n\n`;

  console.log(`📡 Broadcasting to ${clients.size} clients → ${payload.type}`);

  clients.forEach((client) => {
    try {
      client.send(data);
    } catch (err) {
      console.error("❌ Failed to send to client", err);
    }
  });
}

// ❌ REMOVE initRealtimeController completely
// ❌ REMOVE shutdownRealtimeController completely

// 🚀 This file is now PURE SSE broadcaster