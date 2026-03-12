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
      engineEvent = {
        type: "RUN",
        runs: command.runs,
        batsman: command.batsman,
        nonStriker: command.nonStriker,
        bowler: command.bowler
      };
      break;

    case "SCORE_FOUR":
      engineEvent = {
        type: "FOUR",
        batsman: command.batsman,
        nonStriker: command.nonStriker,
        bowler: command.bowler
      };
      break;

    case "SCORE_SIX":
      engineEvent = {
        type: "SIX",
        batsman: command.batsman,
        nonStriker: command.nonStriker,
        bowler: command.bowler
      };
      break;

    case "SCORE_WICKET":
      engineEvent = {
        type: "WICKET",
        batsman: command.batsman,
        nonStriker: command.nonStriker,
        bowler: command.bowler
      };
      break;

    case "SCORE_WIDE":
      engineEvent = {
        type: "WD",
        batsman: command.batsman,
        nonStriker: command.nonStriker,
        bowler: command.bowler
      };
      break;

    case "SCORE_NOBALL":
      engineEvent = {
        type: "NB",
        batsman: command.batsman,
        nonStriker: command.nonStriker,
        bowler: command.bowler
      };
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