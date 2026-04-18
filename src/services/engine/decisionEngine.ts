import { getMatchContext } from "@/services/analytics/matchContextEngine";
import type { MatchState } from "@/services/matchEngine";
import { getPlayerProfile } from "./playerPersonality";

export function getBattingIntent(
  state: MatchState,
  striker?: string
) {
  const context = getMatchContext(state);
  const profile = getPlayerProfile(state, striker);

  // 🔥 PRIORITY 1 — EXTREME PRESSURE
  if (context.pressureLabel === "HIGH") {
    return profile.aggression > 0.6 ? "AGGRESSIVE" : "ATTACKING";
  }

  // 🔥 PRIORITY 2 — DEATH OVERS (FINISHING BEHAVIOR)
  if (context.phase === "DEATH") {
    return profile.finisher > 0.7 ? "AGGRESSIVE" : "ATTACKING";
  }

  // 🔥 PRIORITY 3 — LOW WICKETS (SURVIVAL MODE)
  if (context.wicketsInHand <= 3) {
    return profile.anchor > 0.6 ? "DEFENSIVE" : "BALANCED";
  }

  // 🔥 PRIORITY 4 — POWERPLAY (CONTROLLED AGGRESSION)
  if (context.phase === "POWERPLAY") {
    return profile.aggression > 0.6 ? "ATTACKING" : "BALANCED";
  }

  // 🔥 PRIORITY 5 — MOMENTUM (if you add later)
  // if (context.momentum > 0.7) return "AGGRESSIVE";

  return "BALANCED";
}