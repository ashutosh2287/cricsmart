import { getCommentary } from "@/services/commentary/commentaryStore";
import { getBroadcastInsights } from "@/services/broadcast/broadcastInsightEngine";
import { getAnalytics } from "@/services/analytics/liveAnalyticsStore";
import {
  getClients,
  addClientToStore,
  removeClientFromStore,
} from "./clientStore";

type Client = {
  id: string;
  send: (data: string) => void;
};

type RealtimePayload = {
  type: string;
  matchId: string;
  data?: unknown;
};

export function addClient(matchId: string, client: Client) {
  if (!matchId) {
    console.error("SSE ERROR: matchId is undefined in SSE route");
    return;
  }

  addClientToStore(matchId, client);
  const clients = getClients(matchId);
  console.log(`MATCH LIFECYCLE: client added for ${matchId} (total: ${clients.size})`);
}

export function removeClient(matchId: string, clientOrId: Client | string) {
  const clients = getClients(matchId);

  let target: Client | undefined;

  for (const client of clients) {
    if (
      (typeof clientOrId === "string" && client.id === clientOrId) ||
      (typeof clientOrId !== "string" && client.id === clientOrId.id)
    ) {
      target = client;
      break;
    }
  }

  if (!target) return;

  removeClientFromStore(matchId, target);

  console.log(`MATCH LIFECYCLE: client removed for ${matchId}`);
}

export function broadcast(matchId: string, payload: RealtimePayload) {
  const clients = getClients(matchId);

  if (!clients || clients.size === 0) return;

  let enrichedPayload: RealtimePayload = {
  type: payload.type,
  matchId: matchId,
  data: payload.data,
};

if (payload.type === "BALL_EVENT" && payload.data) {
  enrichedPayload = {
    type: payload.type,
    matchId: matchId,
    data: {
      ...(payload.data as Record<string, unknown>),
      commentary: getCommentary(matchId),
      insights: getBroadcastInsights(matchId),
      analytics: getAnalytics(matchId),
    },
  };
}
  const data = `event: ${enrichedPayload.type}\ndata: ${JSON.stringify(enrichedPayload)}\n\n`;

  for (const client of Array.from(clients as Set<Client>)) {
    try {
      client.send(data);
    } catch (err) {
      console.error(`SSE ERROR: failed to send to client ${client.id}`, err);
      removeClientFromStore(matchId, client);
    }
  }
}
