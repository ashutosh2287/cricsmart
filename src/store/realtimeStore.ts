import { Match } from "../types/match";

/*
⭐ Default demo data (fix empty state)
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
    overs: "",
    
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



let frameScheduled = false;
const pendingUpdates: Match[] = [];

const globalListeners: (() => void)[] = [];

const matchListeners: Record<string, ((match: Match) => void)[]> = {};

export function setMatches(newMatches: Match[]) {

  matches = newMatches;

  globalListeners.forEach(l => l());
}

export function updateMatch(updated: Match) {

  matches = matches.map(m =>
    m.slug === updated.slug ? updated : m
  );

  pendingUpdates.push(updated);

  if (!frameScheduled) {

    frameScheduled = true;

    requestAnimationFrame(() => {

      frameScheduled = false;

      globalListeners.forEach(l => l());

      pendingUpdates.forEach(match => {
        matchListeners[match.slug]?.forEach(cb => cb(match));
      });

      pendingUpdates.length = 0;

    });

  }

}

export function getMatches() {
  return matches;
}

export function getMatch(slug: string) {
  return matches.find(m => m.slug === slug);
}

export function subscribeStore(listener: () => void) {

  globalListeners.push(listener);

  return () => {
    const index = globalListeners.indexOf(listener);
    if (index !== -1) globalListeners.splice(index, 1);
  };

}

export function subscribeMatch(slug: string, cb: (match: Match) => void) {

  if (!matchListeners[slug]) {
    matchListeners[slug] = [];
  }

  matchListeners[slug].push(cb);

  return () => {

    matchListeners[slug] =
      matchListeners[slug].filter(l => l !== cb);

  };

}
