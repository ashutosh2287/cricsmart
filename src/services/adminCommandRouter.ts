import { enqueueBallEvent } from "./eventQueue";
import { DomainCommand } from "./domainCommands";
import { EngineBallEvent } from "./matchEngine";

export function routeAdminCommand(command: DomainCommand) {

  let engineEvent: EngineBallEvent | null = null;

  switch (command.type) {

    // ========================
    // SCORING EVENTS
    // ========================

    case "SCORE_RUN":
      engineEvent = { type: "RUN", runs: command.runs };
      break;

    case "SCORE_FOUR":
      engineEvent = { type: "FOUR" };
      break;

    case "SCORE_SIX":
      engineEvent = { type: "SIX" };
      break;

    case "SCORE_WICKET":
      engineEvent = { type: "WICKET" };
      break;

    case "SCORE_WIDE":
      engineEvent = { type: "WD" };
      break;

    case "SCORE_NOBALL":
      engineEvent = { type: "NB" };
      break;

    // ========================
    // CORRECTION EVENTS
    // ========================

    case "UNDO_LAST_BALL":
      engineEvent = { type: "CORRECTION_UNDO_LAST" };
      break;

    case "DELETE_BALL_EVENT":
      engineEvent = {
        type: "CORRECTION_DELETE",
        targetEventId: command.eventId
      };
      break;

    case "REPLACE_BALL_EVENT":
      engineEvent = {
        type: "CORRECTION_REPLACE",
        targetEventId: command.eventId,
        replacement: command.replacement
      };
      break;
  }

  if (!engineEvent) return;

  enqueueBallEvent(command.slug, engineEvent);
}