import { BallEvent } from "../../types/ballEvent";
import { SimulationState } from "../simulation/simulationState";
import { getPlayer } from "../simulation/playerUtils";

export function generateAdvancedCommentary(
  event: BallEvent,
  state: SimulationState
): string {
  const bat = getPlayer(event.batsman);
  const bowl = getPlayer(event.bowler);

  const phase = state.phase;

  // 🎯 PRESSURE
  const ballsUsed = state.over * 6 + state.ball;
  const requiredRR = state.target
    ? ((state.target - state.totalRuns) / (120 - ballsUsed)) * 6
    : null;

  // 🧨 WICKET
  if (event.type === "WICKET") {
    if (requiredRR && requiredRR > 10) {
      return `BIG WICKET! ${event.batsman} falls under pressure!`;
    }
    return `${event.bowler} strikes! ${event.batsman} is gone!`;
  }

  // 💥 SIX
  if (event.type === "SIX") {
    if (bat.aggression > 0.8) {
      return `${event.batsman} is taking the attack! That's a HUGE SIX!`;
    }
    return `Brilliant shot! ${event.batsman} clears the boundary for six!`;
  }

  // 🔥 FOUR
  if (event.type === "FOUR") {
    if (bat.consistency > 0.85) {
      return `${event.batsman} finds the gap effortlessly. FOUR!`;
    }
    return `${event.batsman} smashes it for FOUR!`;
  }

  // 🧱 DOT BALL
  if (event.runs === 0) {
    if (bowl.wicketTaking > 0.8) {
      return `${event.bowler} is building serious pressure here. Dot ball.`;
    }
    return `Tight bowling. No run.`;
  }

  // 🎯 PRESSURE COMMENT
  if (requiredRR && requiredRR > 9) {
    return `Pressure building! ${event.batsman} manages ${event.runs} run${
      event.runs > 1 ? "s" : ""
    }.`;
  }

  // 🧠 ANCHOR PLAY
  if (bat.consistency > 0.85 && phase !== "DEATH") {
    return `${event.batsman} is rotating strike nicely. ${event.runs} run${
      event.runs > 1 ? "s" : ""
    }.`;
  }

  // 🔥 AGGRESSIVE PLAY
  if (bat.aggression > 0.8) {
    return `${event.batsman} playing aggressively! ${event.runs} run${
      event.runs > 1 ? "s" : ""
    }.`;
  }

  // DEFAULT
  return `${event.batsman} takes ${event.runs} run${
    event.runs > 1 ? "s" : ""
  }.`;
}