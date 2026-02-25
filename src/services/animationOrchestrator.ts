import { publishAnimation } from "@/services/animationBus";
import { publishCommentary } from "@/services/commentaryBus";
import { scheduleCinematic } from "@/services/cinematicScheduler";
import { triggerStadiumMoment } from "@/services/stadiumMoment";
import {
  subscribeBroadcastCommand,
  BroadcastCommand
} from "./broadcastCommands";

/*
================================================
GLOBAL ANIMATION ORCHESTRATOR
(Command-driven cinematic layer)
================================================
*/

function handleBroadcastCommand(command: BroadcastCommand) {

  switch (command.type) {

    /*
    ================================================
    CAMERA SHAKE
    ================================================
    */

    case "CAMERA_SHAKE":

      scheduleCinematic(() => {
        publishAnimation({
          type: "CAMERA_SHAKE"
        });
      });

      break;

    /*
    ================================================
    CAMERA SWEEP
    (Map to existing ENERGY_SWEEP animation)
    ================================================
    */

    case "CAMERA_SWEEP":

      scheduleCinematic(() => {
         publishAnimation({
  type: "ENERGY_SWEEP",
  slug: command.slug
});
      });

      break;

    /*
    ================================================
    SLOW MOTION
    (Map to DELTA or cinematic effect you already use)
    ================================================
    */

    case "PLAY_SLOW_MOTION":

      scheduleCinematic(() => {
        publishAnimation({
  type: "DELTA",
  slug: command.slug,
  value: 1
});
      });

      break;

    /*
    ================================================
    OVERLAY
    (Map overlays into stadium moment + commentary)
    ================================================
    */

    case "SHOW_OVERLAY":

      scheduleCinematic(() => {

        publishCommentary(`🔥 ${command.overlay}`);

        // Only pass valid moment types if required
        triggerStadiumMoment("SIX"); 

      });

      break;

    case "ENTER_TENSION":

      publishCommentary("🔥 Match tension rising!");

      break;
  }
}
/*
================================================
INIT ORCHESTRATOR (RUN ONCE)
================================================
*/

export function initAnimationOrchestrator() {

  subscribeBroadcastCommand(handleBroadcastCommand);

}