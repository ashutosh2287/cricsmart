import { PlayerRef } from "@/services/simulation/simulationState";

export function getPlayerName(player: PlayerRef): string {
  return typeof player === "string" ? player : player.name;
}