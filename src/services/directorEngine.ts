import { subscribeCommand, Command } from "./commandBus";
import { triggerDirector } from "@/services/broadcastDirector";
import { subscribeMomentum } from "./momentumEngine";

/*
================================================
DIRECTOR STATE
================================================
*/

let hypeLevel = 0;
let currentMomentum = 0;

/*
================================================
LISTEN TO MOMENTUM ENGINE
================================================
*/

subscribeMomentum((value) => {
  currentMomentum = value;
});

/*
================================================
DIRECTOR LOGIC
================================================
*/

function handleCommand(command: Command) {

  switch (command.type) {

    case "RUN_SCORED":

      hypeLevel += 1;

      if (currentMomentum > 8) {
        triggerDirector("LIGHT_IMPACT");
      }

      break;

    case "BOUNDARY_FOUR":

      hypeLevel += 3;

      if (currentMomentum > 12) {
        triggerDirector("CAMERA_SHAKE");
      } else {
        triggerDirector("CAMERA_SWEEP");
      }

      break;

    case "BOUNDARY_SIX":

      hypeLevel += 5;

      if (currentMomentum > 20) {
        triggerDirector("EXTREME_SHAKE");
      } else {
        triggerDirector("CAMERA_SHAKE");
      }

      break;

    case "WICKET_FALL":

      hypeLevel += 10;

      if (currentMomentum > 15) {
        triggerDirector("DRAMATIC_SLOW_MOTION");
      } else {
        triggerDirector("SLOW_MOTION");
      }

      break;
  }

  // decay hype gradually
  hypeLevel = Math.max(0, hypeLevel - 1);
}

/*
================================================
INIT DIRECTOR ENGINE
================================================
*/

export function initDirectorEngine() {

  subscribeCommand(handleCommand);

}
