import { getCommentary } from "@/services/commentary/commentaryStore";
import { getBroadcastInsights } from "@/services/broadcast/broadcastInsightEngine";
import { getAnalytics } from "@/services/analytics/liveAnalyticsStore";

type Client = {
  id: string;
  send: (data: string) => void;
};

type RealtimePayload = {
  type: string;
  matchId: string;
  data?: unknown;
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
  let clients = matchClients.get(matchId);
  if (!clients) {
    clients = new Set<Client>();
    matchClients.set(matchId, clients);
  }
  return clients;
}

export function addClient(matchId: string, client: Client) {
  const clients = getClients(matchId);

  for (const existing of clients) {
    if (existing.id === client.id) {
      clients.delete(existing);
      break;
    }
  }

  clients.add(client);
  console.log(`➕ Client added to match ${matchId} (total: ${clients.size})`);
}

export function removeClient(matchId: string, clientOrId: Client | string) {
  const clients = matchClients.get(matchId);
  if (!clients) return;

  let target: Client | undefined;

  if (typeof clientOrId === "string") {
    for (const client of clients) {
      if (client.id === clientOrId) {
        target = client;
        break;
      }
    }
  } else {
    if (clients.has(clientOrId)) {
      target = clientOrId;
    } else {
      for (const client of clients) {
        if (client.id === clientOrId.id) {
          target = client;
          break;
        }
      }
    }
  }

  if (!target) return;

  clients.delete(target);
  console.log(`➖ Client removed from match ${matchId} (remaining: ${clients.size})`);

  if (clients.size === 0) {
    matchClients.delete(matchId);
  }
}

export function broadcast(matchId: string, payload: RealtimePayload) {
  const clients = matchClients.get(matchId);
  if (!clients || clients.size === 0) return;

  // 🔥 ENRICH PAYLOAD FOR BALL_EVENT
let enrichedPayload = payload;

if (payload.type === "BALL_EVENT" && payload.data) {
  enrichedPayload = {
    ...payload,
    data: {
      ...(payload.data as Record<string, unknown>),

      // ✅ ADD THESE
      commentary: getCommentary(matchId),
      insights: getBroadcastInsights(matchId),
      analytics: getAnalytics(matchId),
    },
  };
}

const data = `event: ${payload.type}\ndata: ${JSON.stringify(enrichedPayload)}\n\n`;
  const deadClients: string[] = [];

  console.log(`📡 Broadcasting to ${clients.size} clients → ${payload.type}`);

  for (const client of Array.from(clients)) {
    try {
      client.send(data);
    } catch (err) {
      console.error(`❌ Failed to send to client ${client.id}`, err);
      deadClients.push(client.id);
    }
  }

  for (const clientId of deadClients) {
    removeClient(matchId, clientId);
  }
}