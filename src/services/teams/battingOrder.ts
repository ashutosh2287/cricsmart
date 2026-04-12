import { Player } from "@/services/simulation/simulationState";
import { PlayerRef } from "@/services/simulation/simulationState";

/* =====================================================
   🏏 SMART BATTING ORDER (UPGRADED)
===================================================== */

export function getBattingOrder(players: Player[]): PlayerRef[] {
  const batsmen = players.filter(p => p.role === "BAT");
  const allRounders = players.filter(p => p.role === "AR");
  const wicketKeepers = players.filter(p => p.role === "WK");
  const bowlers = players.filter(p => p.role === "BOWL");

  // ✅ RETURN FULL PLAYER OBJECTS (NOT STRING)
  return [
    ...batsmen,        // top order
    ...wicketKeepers,  // middle
    ...allRounders,    // lower middle
    ...bowlers         // tail
  ];
}