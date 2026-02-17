import { Match } from "../types/match";

/*
⭐ Default demo data
*/
let matches: Match[] = [

  {
    id: "1",
    slug: "india-australia",
    team1: "India",
    team2: "Australia",
    status: "Live",
    score: "166/5",
    overs: "15.3",
    runRate: 10.8
  },

  {
    id: "2",
    slug: "england-pakistan",
    team1: "England",
    team2: "Pakistan",
    status: "Upcoming",
    score: "",
    overs: ""
  },

  {
    id: "3",
    slug: "nz-sa",
    team1: "New Zealand",
    team2: "South Africa",
    status: "Completed",
    score: "240/8",
    overs: "20.0",
    runRate: 12
  }

];

/*
⭐ INTERNAL STATE
*/

let frameScheduled = false;
const pendingUpdates: Match[] = [];

const globalListeners = new Set<() => void>();

const matchListeners: Record<string, Set<(match: Match) => void>> = {};

/*
=================================================
GETTERS
=================================================
*/

export function getMatches() {
  return matches;
}

export function getMatch(slug: string) {
  return matches.find(m => m.slug === slug);
}

/*
=================================================
SET ALL MATCHES
=================================================
*/

export function setMatches(newMatches: Match[]) {

  // Replace reference only when necessary
  if (matches === newMatches) return;

  matches = newMatches;

  emitGlobal();
}

/*
=================================================
UPDATE SINGLE MATCH (🔥 OPTIMIZED)
=================================================
*/

export function updateMatch(updated: Match) {

  const index = matches.findIndex(m => m.slug === updated.slug);

  if (index === -1) return;

  // ⭐ IMPORTANT:
  // update only the changed index
  matches[index] = updated;

  pendingUpdates.push(updated);

  scheduleFrame();
}

/*
=================================================
FRAME BATCHING
=================================================
*/

function scheduleFrame() {

  if (frameScheduled) return;

  frameScheduled = true;

  requestAnimationFrame(() => {

    frameScheduled = false;

    emitGlobal();

    pendingUpdates.forEach(match => {
      matchListeners[match.slug]?.forEach(cb => cb(match));
    });

    pendingUpdates.length = 0;

  });

}

/*
=================================================
EMITTERS
=================================================
*/

function emitGlobal() {
  globalListeners.forEach(l => l());
}

/*
=================================================
SUBSCRIPTIONS
=================================================
*/

export function subscribeStore(listener: () => void) {

  globalListeners.add(listener);

  return () => {
    globalListeners.delete(listener);
  };

}

export function subscribeMatch(slug: string, cb: (match: Match) => void) {

  if (!matchListeners[slug]) {
    matchListeners[slug] = new Set();
  }

  matchListeners[slug].add(cb);

  return () => {
    matchListeners[slug].delete(cb);
  };

}
