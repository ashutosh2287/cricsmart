import { Match } from "../types/match";
import { dispatchMatchEvent } from "@/store/matchStore";
import { publishAnimation } from "@/services/animationBus";
import { addBallEvent } from "@/store/ballEventStore";

type Listener = (update: {
  type: "match_update";
  payload: Match;
}) => void;

let matches: Match[] = [];
let listeners: Listener[] = [];

let interval: ReturnType<typeof setInterval> | null = null;
let isPaused = false;

/*
🔥 Track over + ball for each match
*/
const matchState: Record<
  string,
  { over: number; ball: number }
> = {};

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
  0,0,0,0,
  1,1,1,1,1,
  2,
  3,
  4,4,
  6,
  "W",
  "WD",
  "NB"
];

/*
=================================================
START REALTIME ENGINE
=================================================
*/
export function startRealtime(initialMatches: Match[]) {

  matches = initialMatches;

  dispatchMatchEvent("START_MATCH");

  if (interval) {
    clearInterval(interval);
  }

  interval = setInterval(() => {

    if (isPaused) return;

    matches.forEach(match => {

      if (match.status !== "Live") return;

      /*
      ⭐ Initialize match tracking
      */
      if (!matchState[match.slug]) {
        matchState[match.slug] = { over: 0, ball: 0 };
      }

      let { over, ball } = matchState[match.slug];

      /*
      ⭐ Random cricket event
      */
      const event =
        cricketEvents[
          Math.floor(Math.random() * cricketEvents.length)
        ];

      let ballRuns = 0;
      let isWicket = false;
      let extraRun = false;
      let legalDelivery = true;

      if (event === "WD" || event === "NB") {

        ballRuns = 1;
        extraRun = true;
        legalDelivery = false;

      } else if (event === "W") {

        isWicket = true;

      } else {

        ballRuns = event;

      }

      /*
      ⭐ Update over + ball count
      */
      if (legalDelivery) {

        ball++;

        if (ball === 6) {

          over++;
          ball = 0;

          dispatchMatchEvent("OVER_COMPLETE");

        }

      }

      // Save state
      matchState[match.slug] = { over, ball };

      /*
      ⭐ Send BALL EVENT
      */
      addBallEvent({
        slug: match.slug,
        over: Number(`${over}.${ball}`),
        runs: ballRuns,
        wicket: isWicket,
        extra: extraRun,
        timestamp: Date.now()
      });

      /*
      ⭐ Animation layer
      */
      if (isWicket) {

        const animationDuration = 5000;

        isPaused = true;

        publishAnimation({ type: "WICKET" });

        setTimeout(() => {
          isPaused = false;
        }, animationDuration);

      } else if (ballRuns === 4 || ballRuns === 6) {

        publishAnimation({
          type: ballRuns === 6 ? "SIX" : "FOUR"
        });

      }

      dispatchMatchEvent("BALL");

    });

  }, 2000);
}

/*
=================================================
SUBSCRIBE
=================================================
*/
export function subscribeRealtime(cb: Listener) {

  listeners.push(cb);

  return () => {
    listeners = listeners.filter(l => l !== cb);
  };
}

/*
=================================================
GET LATEST
=================================================
*/
export function getRealtimeMatches() {
  return matches;
}
