import { loadSimulation } from "@/services/storage/simulationStorage";
import { restoreMatchState } from "@/services/matchEngine";

export async function resumeMatch(matchId: string) {
  const saved = await loadSimulation(matchId);

  if (!saved) {
    console.log("❌ No saved match found:", matchId);
    return;
  }

  console.log("♻️ Restoring match:", matchId);

  // 🔥 Restore engine state
  restoreMatchState(matchId, saved.state);

  // 🔥 Resume logic (TEMP — manual trigger)
  if (saved.control.isRunning && !saved.control.isPaused) {
    console.log("▶️ Match was running before restart");
  }
}