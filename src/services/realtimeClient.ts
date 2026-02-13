import { emit } from "./realtimeEvents";
import { Match } from "../types/match";

let interval: NodeJS.Timeout;

export function connectRealtime(initialMatches: Match[]) {

  // Fake websocket connection simulation

  interval = setInterval(() => {

    const updatedMatches = initialMatches.map((match) => {

      if (match.status === "Live" && match.score && match.overs) {

        const runs = parseInt(match.score.split("/")[0]) + Math.floor(Math.random() * 3);
        const wickets = match.score.split("/")[1];

        const newOvers = (parseFloat(match.overs) + 0.1).toFixed(1);

        return {
          ...match,
          score: `${runs}/${wickets}`,
          overs: newOvers,
          runRate: (runs / parseFloat(newOvers)).toFixed(2)
        };

      }

      return match;

    });

    emit(updatedMatches);

  }, 3000);

}

export function disconnectRealtime() {
  clearInterval(interval);
}
