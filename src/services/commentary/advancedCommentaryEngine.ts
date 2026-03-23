import { BallEvent } from "../../types/ballEvent";
import { MatchState } from "../matchEngine";
import { getPlayer } from "../simulation/playerUtils";

export function generateAdvancedCommentary(
  event: BallEvent,
  state: MatchState | null | undefined
): string {

  // 🛑 FULL SAFETY (VERY IMPORTANT)
  if (!event) return "";
  if (!state || !state.innings || state.innings.length === 0) {
    return "";
  }

  const currentInningsIndex = state.currentInningsIndex ?? 0;
  const innings = state.innings[currentInningsIndex];

  if (!innings) return "";

  const batsman = event.batsman || "Batter";
  const bowler = event.bowler || "Bowler";
  const runs = event.runs ?? 0;

  // =========================
  // 🎯 WICKET
  // =========================
  if (event.wicket) {
    return `${bowler} strikes! ${batsman} is OUT!`;
  }

  // =========================
  // 💥 SIX
  // =========================
  if (runs === 6) {
    return `${batsman} launches it for a HUGE SIX!`;
  }

  // =========================
  // 🔥 FOUR
  // =========================
  if (runs === 4) {
    return `${batsman} smashes it for FOUR!`;
  }

  // =========================
  // 🧱 DOT BALL
  // =========================
  if (runs === 0) {
    return `${bowler} bowls a tight delivery. Dot ball.`;
  }

  // =========================
  // 🏃 RUNS
  // =========================
  return `${batsman} takes ${runs} run${runs > 1 ? "s" : ""}.`;
}