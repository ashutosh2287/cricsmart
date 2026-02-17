import { BallEvent } from "@/types/ballEvent";
import { publishAnimation } from "@/services/animationBus";
import { publishCommentary } from "@/services/commentaryBus";
import { scheduleCinematic } from "@/services/cinematicScheduler";
import { triggerStadiumMoment } from "@/services/stadiumMoment";

/*
================================================
GLOBAL ANIMATION ORCHESTRATOR
================================================
*/

export function handleAnimation(event: BallEvent) {

  /*
  ================================================
  💥 WICKET
  ================================================
  */

  if (event.wicket) {

    scheduleCinematic(() => {

      publishAnimation({
        type: "WICKET"
      });

      publishCommentary("💥 WICKET! The batter is gone!");

      // 🔥 STADIUM MOMENT
      triggerStadiumMoment("WICKET");

    });

    return;
  }

  /*
  ================================================
  🔥 SIX
  ================================================
  */

  if (event.runs === 6) {

    scheduleCinematic(() => {

      publishAnimation({
        type: "SIX"
      });

      publishCommentary("🔥 BOOOOM! Massive SIX into the stands!");

      // 🔥 STADIUM MOMENT
      triggerStadiumMoment("SIX");

    });

    return;
  }

  /*
  ================================================
  🎯 FOUR
  ================================================
  */

  if (event.runs === 4) {

    scheduleCinematic(() => {

      publishAnimation({
        type: "FOUR"
      });

      publishCommentary("🎯 Beautiful FOUR through the field!");

      // 🔥 STADIUM MOMENT
      triggerStadiumMoment("FOUR");

    });

    return;
  }

}
