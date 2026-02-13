import { Match } from "../types/match";
import { dispatchMatchEvent } from "@/store/matchStore";
import { publishAnimation } from "@/services/animationBus";
import { setMatches } from "@/store/realtimeStore";

type Listener = (update: {
  type: "match_update";
  payload: Match;
}) => void;

let matches: Match[] = [];
let listeners: Listener[] = [];

let interval: ReturnType<typeof setInterval> | null = null;

let isPaused = false;

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
🔥 Realistic probability distribution
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
🔥 Start realtime engine
*/
export function startRealtime(initialMatches: Match[]) {

  matches = initialMatches;

  dispatchMatchEvent("START_MATCH");

  // restart engine safely
  if (interval) {
    clearInterval(interval);
  }

  interval = setInterval(() => {

    if (isPaused) return;

    const updatedMatches: Match[] = [];

    matches.forEach(match => {

      if (match.status !== "Live") {
        updatedMatches.push(match);
        return;
      }

      const [runsStr, wicketsStr] =
        (match.score ?? "0/0").split("/");

      let runs = Number(runsStr) || 0;
      let wickets = Number(wicketsStr) || 0;

      // all out
      if (wickets >= 10) {

        dispatchMatchEvent("INNINGS_END");

        updatedMatches.push({
          ...match,
          status: "Completed"
        });

        return;
      }

      const oversStr = match.overs ?? "0.0";

      const [overPart, ballPart] = oversStr.split(".");

      let over = Number(overPart) || 0;
      let ball = Number(ballPart) || 0;

      const event =
        cricketEvents[
          Math.floor(Math.random() * cricketEvents.length)
        ];

      if (event === "WD" || event === "NB") {

        runs += 1;

      } else {

        ball++;

        if (ball === 6) {

          over++;
          ball = 0;

          dispatchMatchEvent("OVER_COMPLETE");
        }

        if (event === "W") {

          wickets++;

          const animationDuration = 5000;

          isPaused = true;

          publishAnimation({
            type: "WICKET"
          });

          setTimeout(() => {
            isPaused = false;
          }, animationDuration);

        } else {

          runs += event;

          if (event === 4 || event === 6) {

            publishAnimation({
              type: event === 6 ? "SIX" : "FOUR"
            });

          }
        }

        dispatchMatchEvent("BALL");
      }

      const newOvers = `${over}.${ball}`;

      const totalBalls = over * 6 + ball;

      const runRate =
        totalBalls > 0
          ? Number((runs / (totalBalls / 6)).toFixed(2))
          : 0;

      const updatedMatch: Match = {
        ...match,
        score: `${runs}/${wickets}`,
        overs: newOvers,
        runRate
      };

      updatedMatches.push(updatedMatch);

      listeners.forEach(cb =>
        cb({
          type: "match_update",
          payload: updatedMatch
        })
      );

    });

    matches = updatedMatches;

    // ⭐ sync realtime engine with global store
    setMatches(updatedMatches);

  }, 2000);
}

/*
🔥 Subscribe
*/
export function subscribeRealtime(cb: Listener) {

  listeners.push(cb);

  return () => {
    listeners = listeners.filter(l => l !== cb);
  };
}

/*
🔥 Get latest matches
*/
export function getRealtimeMatches() {
  return matches;
}
