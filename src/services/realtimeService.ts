import { Match } from "../types/match";
import { dispatchBallEvent, initMatch } from "@/services/matchEngine";

/*
🔥 Realistic cricket event types
*/
type CricketEvent =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 6
  | "W"
  | "WD"
  | "NB";

/*
🔥 Probability distribution
*/
const cricketEvents: CricketEvent[] = [
  0, 0, 0, 0,
  1, 1, 1, 1, 1,
  2,
  3,
  4, 4,
  6,
  "W",
  "WD",
  "NB"
];

let interval: ReturnType<typeof setInterval> | null = null;
let isPaused = false;

let matches: Match[] = [];

/*
=================================================
START REALTIME ENGINE
=================================================
*/
export function startRealtime(initialMatches: Match[]) {

  matches = initialMatches;

  // ✅ Ensure matchEngine initializes live matches
  matches.forEach(match => {

    if (match.status === "Live") {
      initMatch(match.slug);
    }

  });

  if (interval) {
    clearInterval(interval);
  }

  interval = setInterval(() => {

    if (isPaused) return;

    matches.forEach(match => {

      if (match.status !== "Live") return;

      const event =
        cricketEvents[
          Math.floor(Math.random() * cricketEvents.length)
        ];

      /*
      -------------------------------------------------
      MAP RANDOM EVENT → ENGINE BALL EVENT
      -------------------------------------------------
      */

      if (event === "WD") {

        dispatchBallEvent(match.slug, { type: "WD" });
        return;

      }

      if (event === "NB") {

        dispatchBallEvent(match.slug, { type: "NB" });
        return;

      }

      if (event === "W") {

        dispatchBallEvent(match.slug, { type: "WICKET" });

        // cinematic pause
        isPaused = true;

        

        setTimeout(() => {
          isPaused = false;
        }, 5000);

        return;

      }

      if (event === 4) {

        dispatchBallEvent(match.slug, { type: "FOUR" });

        

        return;

      }

      if (event === 6) {

        dispatchBallEvent(match.slug, { type: "SIX" });

       

        return;

      }

      if (event === 0) {

        dispatchBallEvent(match.slug, { type: "RUN", runs: 0 });

        return;

      }

      // 1 / 2 / 3 runs
      dispatchBallEvent(match.slug, {
        type: "RUN",
        runs: event
      });

    });

  }, 2000);
}