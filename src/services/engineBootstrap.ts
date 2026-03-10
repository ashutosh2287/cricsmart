import { initDirectorEngine } from "./directorEngine";
import { initBroadcastGraphicsEngine } from "./broadcastGraphicsEngine";
import { initReplayDirectorEngine } from "./replayDirectorEngine";
import { initCrowdReactionEngine } from "./crowdReactionEngine";

export function initEngines() {

  initDirectorEngine();
  initBroadcastGraphicsEngine();
  initReplayDirectorEngine();
  initCrowdReactionEngine();

}