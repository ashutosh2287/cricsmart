type Listener = (messages: string[]) => void;

const listeners: Record<string, Listener[]> = {};
const store: Record<string, string[]> = {};

export function addCommentary(matchId: string, text: string) {
  if (!store[matchId]) store[matchId] = [];

  store[matchId].push(text);

  listeners[matchId]?.forEach(cb => cb(store[matchId]));
}

export function subscribeCommentary(
  matchId: string,
  cb: Listener
) {
  if (!listeners[matchId]) listeners[matchId] = [];

  listeners[matchId].push(cb);

  // send existing data immediately
  cb(store[matchId] || []);

  return () => {
    listeners[matchId] = listeners[matchId].filter(l => l !== cb);
  };
}