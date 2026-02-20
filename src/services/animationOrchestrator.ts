import { publishAnimation } from "@/services/animationBus";
import { publishCommentary } from "@/services/commentaryBus";
import { scheduleCinematic } from "@/services/cinematicScheduler";
import { triggerStadiumMoment } from "@/services/stadiumMoment";
import { triggerDirector } from "@/services/broadcastDirector";
import { subscribeCommand, Command } from "./commandBus";

/*
================================================
GLOBAL ANIMATION ORCHESTRATOR
(Command-driven cinematic layer)
================================================
*/

function handleCommand(command: Command) {

  /*
  ================================================
  💥 WICKET
  ================================================
  */

  if (command.type === "WICKET_FALL") {

    scheduleCinematic(() => {

      publishAnimation({
        type: "WICKET",
        slug: command.slug
      });

      publishCommentary("💥 WICKET! The batter is gone!");

      triggerStadiumMoment("WICKET");

      triggerDirector("SLOW_MOTION");

    });

    return;
  }

  /*
  ================================================
  🔥 SIX
  ================================================
  */

  if (command.type === "BOUNDARY_SIX") {

    scheduleCinematic(() => {

      publishAnimation({
        type: "SIX",
        slug: command.slug
      });

      publishCommentary("🔥 BOOOOM! Massive SIX into the stands!");

      triggerStadiumMoment("SIX");

      triggerDirector("CAMERA_SHAKE");

    });

    return;
  }

  /*
  ================================================
  🎯 FOUR
  ================================================
  */

  if (command.type === "BOUNDARY_FOUR") {

    scheduleCinematic(() => {

      publishAnimation({
        type: "FOUR",
        slug: command.slug
      });

      publishCommentary("🎯 Beautiful FOUR through the field!");

      triggerStadiumMoment("FOUR");

      triggerDirector("LIGHT_IMPACT");

    });

    return;
  }

}

/*
================================================
INIT ORCHESTRATOR (RUN ONCE)
================================================
*/

export function initAnimationOrchestrator() {

  subscribeCommand(handleCommand);

}