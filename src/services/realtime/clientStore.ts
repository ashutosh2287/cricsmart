type Client = {
  id: string;
  send: (data: string) => void;
};

type GlobalStore = typeof globalThis & {
  __REALTIME_CLIENTS__?: Map<string, Set<Client>>;
};

const globalStore = globalThis as GlobalStore;

// ✅ FORCE SINGLE INSTANCE
if (!globalStore.__REALTIME_CLIENTS__) {
  globalStore.__REALTIME_CLIENTS__ = new Map();
}

const matchClients = globalStore.__REALTIME_CLIENTS__;

export function getClients(matchId: string) {
  let clients = matchClients.get(matchId);

  if (!clients) {
    clients = new Set<Client>();
    matchClients.set(matchId, clients);
  }

  console.log("📦 GET CLIENTS", {
  requestedMatchId: matchId,
  availableMatchIds: Array.from(matchClients.keys()),
});

  return clients;
}

export function addClientToStore(matchId: string, client: Client) {
  const clients = getClients(matchId);
  clients.add(client);
  console.log("➕ ADD CLIENT", {
  matchId,
  totalClients: clients.size,
  allMatchIds: Array.from(matchClients.keys()),
});
}

export function removeClientFromStore(matchId: string, client: Client) {
  const clients = matchClients.get(matchId);
  if (!clients) return;

  clients.delete(client);

console.log("➖ REMOVE CLIENT", {
  matchId,
  remaining: clients.size,
  allMatchIds: Array.from(matchClients.keys()),
});
  if (clients.size === 0) {
    matchClients.delete(matchId);
  }
}

export function getClientCount(matchId: string) {
  const clients = matchClients.get(matchId);
  return clients?.size ?? 0;
}

export function listClientCounts() {
  return Array.from(matchClients.entries()).map(([matchId, clients]) => ({
    matchId,
    count: clients.size,
  }));
}
