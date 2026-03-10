import { BallEvent } from "@/types/ballEvent";
import { getEventStream, getMatchState } from "./matchEngine";
import { addHighlight } from "./highlights/highlightStore";

export function analyzeHighlightTimeline(matchId: string): void {

  const events: BallEvent[] = getEventStream(matchId);

  if (events.length < 12) return;

  const recent: BallEvent[] = events.slice(-12);

  const runs: number = recent.reduce(
    (sum: number, e: BallEvent) => sum + (e.runs ?? 0),
    0
  );

  const wickets: number = recent.filter(
    (e: BallEvent) => e.wicket
  ).length;

  const lastEvent: BallEvent = recent[recent.length - 1];

  // Collapse Phase
  if (wickets >= 3) {
    addHighlight(matchId, {
      id: `collapse_${lastEvent.id}`,
      type: "COLLAPSE_PHASE",
      event: lastEvent
    });
  }

  // Batting Assault
  if (runs >= 24 && wickets === 0) {
    addHighlight(matchId, {
      id: `assault_${lastEvent.id}`,
      type: "ASSAULT_PHASE",
      event: lastEvent
    });
  }

  // Bowling Strangle
  if (runs <= 6 && wickets === 0) {
    addHighlight(matchId, {
      id: `strangle_${lastEvent.id}`,
      type: "STRANGLE_PHASE",
      event: lastEvent
    });
  }

  // Death Over Drama
  const matchState = getMatchState(matchId);
  if (!matchState) return;

  const innings =
    matchState.innings[matchState.currentInningsIndex];
  if (!innings) return;

  const totalOvers: number = matchState.configOvers ?? 20;

  if (innings.over >= totalOvers - 2) {
    if (runs >= 15 || wickets >= 2) {
      addHighlight(matchId, {
        id: `death_drama_${lastEvent.id}`,
        type: "DEATH_OVER_DRAMA",
        event: lastEvent
      });
    }
  }
}