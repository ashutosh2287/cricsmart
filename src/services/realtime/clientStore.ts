type Client = {
  id: string;
  send: (data: string) => void;
  afterSequence?: number;
};

type GlobalStore = typeof globalThis & {
  __REALTIME_CLIENTS__?: Map<string, Set<Client>>;
};

function getStore(): Map<string, Set<Client>> {
  const g = globalThis as GlobalStore;
  if (!g.__REALTIME_CLIENTS__) {
    g.__REALTIME_CLIENTS__ = new Map();
  }
  return g.__REALTIME_CLIENTS__;
}

export function getClients(matchId: string) {
  const store = getStore();
  let clients = store.get(matchId);

  if (!clients) {
    clients = new Set<Client>();
    store.set(matchId, clients);
  }

  return clients;
}

export function addClientToStore(matchId: string, client: Client) {
  const clients = getClients(matchId);
  clients.add(client);
  console.log("➕ ADD CLIENT", {
    matchId,
    totalClients: clients.size,
  });
}

export function removeClientFromStore(matchId: string, client: Client) {
  const store = getStore();
  const clients = store.get(matchId);
  if (!clients) return;

  clients.delete(client);

  console.log("➖ REMOVE CLIENT", {
    matchId,
    remaining: clients.size,
  });

  if (clients.size === 0) {
    store.delete(matchId);
  }
}

export function getClientCount(matchId: string) {
  const clients = getStore().get(matchId);
  return clients?.size ?? 0;
}

export function listClientCounts() {
  return Array.from(getStore().entries()).map(([matchId, clients]) => ({
    matchId,
    count: clients.size,
  }));
}
