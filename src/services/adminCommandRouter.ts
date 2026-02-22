import { enqueueBallEvent } from "./eventQueue";
import { DomainCommand } from "./domainCommands";
import { EngineBallEvent } from "./matchEngine";

export function routeAdminCommand(command: DomainCommand) {

  let engineEvent: EngineBallEvent | null = null;

  switch (command.type) {

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
  }

  if (!engineEvent) return;

  enqueueBallEvent(command.slug, engineEvent);
}