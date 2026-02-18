import { fetchMatches } from "./apiClient";
import { setMatches } from "@/store/realtimeStore";
import { startGlobalRealtime } from "./globalRealtime";
import { initMatch } from "@/services/matchEngine";
import { initMomentumEngine } from "@/services/momentumEngine";
import { initAnimationOrchestrator } from "@/services/animationOrchestrator";
import { initDirectorEngine } from "@/services/directorEngine";

let started = false;

export async function bootstrapRealtime() {

  if (started) return;

  started = true;

  /*
  ====================================================
  INIT GLOBAL CINEMATIC SYSTEMS (RUN ONLY ONCE)
  ====================================================
  */

  // 🎬 Animation system listens to Command Bus
  initAnimationOrchestrator();

  // 🎥 Broadcast director intelligence layer
  initDirectorEngine();
  initMomentumEngine(); 

  /*
  ====================================================
  LOAD INITIAL MATCH DATA
  ====================================================
  */

  const matches = await fetchMatches();

setMatches(matches);

// ✅ INIT MATCH ENGINE STATE
matches.forEach((match) => {
  initMatch(match.slug); // or match.id depending on your field
});


  /*
  ====================================================
  START GLOBAL REALTIME (SSE)
  ====================================================
  */

  startGlobalRealtime();

}
