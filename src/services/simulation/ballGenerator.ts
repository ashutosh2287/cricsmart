import { getBallOutcome } from "./probabilityModel";
import { SimulationState } from "./simulationState";
import { BallEvent } from "@/types/ballEvent";
import { v4 as uuidv4 } from "uuid";

export function generateBallEvent(state: SimulationState): BallEvent {
  const outcome = getBallOutcome(state);

  const isLegal = outcome.type !== "WD" && outcome.type !== "NB";

  return {
    id: uuidv4(),
    slug: `ball-${state.over}-${state.ball}-${Date.now()}`,

    over: state.over,
    runs: outcome.runs,

    wicket: outcome.type === "WICKET",
    extra: outcome.type === "WD" || outcome.type === "NB",

    batsman: state.striker,
    nonStriker: state.nonStriker,
    bowler: state.bowler,

    type: outcome.type,

    timestamp: Date.now(),

    isLegalDelivery: isLegal,

    valid: true,
  };
}