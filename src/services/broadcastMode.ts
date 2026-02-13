let broadcastEnabled = false;

export function enableBroadcast() {
  broadcastEnabled = true;
}

export function disableBroadcast() {
  broadcastEnabled = false;
}

export function isBroadcastEnabled() {
  return broadcastEnabled;
}
