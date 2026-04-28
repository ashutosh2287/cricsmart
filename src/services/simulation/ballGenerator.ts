import { getBallOutcome } from "./probabilityModel";
import { SimulationState } from "./simulationState";
import { BallEvent } from "@/types/ballEvent";
import { v4 as uuidv4 } from "uuid";

export function generateBallEvent(state: SimulationState): BallEvent {
  const outcome = getBallOutcome(state);

    const striker = state.striker?.trim();
  const nonStriker = state.nonStriker?.trim();
  const bowler = state.bowler?.trim();

  if (!striker || !nonStriker || !bowler) {
    throw new Error("❌ generateBallEvent received incomplete player state");
  }

  if (striker === nonStriker) {
    throw new Error(
      `❌ generateBallEvent received invalid batting pair (${striker})`
    );
  }

  const base = {
    id: uuidv4(),
    slug: `ball-${state.over}-${state.ball}-${Date.now()}`,
    over: state.over,
    batsman: striker,
    nonStriker,
    bowler,
    timestamp: Date.now(),
    valid: true,
    innings: state.currentInningsIndex,
    commentary: undefined,
    branchId: undefined,
    replacedBy: undefined
  };
  switch (outcome.type) {
    case "RUN":
      return {
        ...base,
        type: "RUN",
        runs: outcome.runs ?? 1,
        totalRuns: outcome.runs ?? 1,
        wicket: false,
        extra: false,
        isLegalDelivery: true
      };

    case "FOUR":
      return {
        ...base,
        type: "FOUR",
        runs: 4,
        totalRuns: 4,
        wicket: false,
        extra: false,
        isLegalDelivery: true
      };

    case "SIX":
      return {
        ...base,
        type: "SIX",
        runs: 6,
        totalRuns: 6,
        wicket: false,
        extra: false,
        isLegalDelivery: true
      };

    case "WICKET":
      return {
        ...base,
        type: "WICKET",
        runs: 0,
        totalRuns: 0,
        wicket: true,
        extra: false,
        isLegalDelivery: true,
                dismissedBatsman: striker,
        dismissalKind: "UNKNOWN"
      };

    case "WD":
      return {
        ...base,
        type: "WD",
        runs: outcome.runs ?? 1,
        totalRuns: outcome.runs ?? 1,
        wicket: false,
        extra: true,
        extraType: "WD",
        extraRuns: outcome.runs ?? 1,
        isLegalDelivery: false
      };

    case "NB":
      return {
        ...base,
        type: "NB",
        runs: outcome.runs ?? 1,
        totalRuns: outcome.runs ?? 1,
        wicket: false,
        extra: true,
        extraType: "NB",
        extraRuns: outcome.runs ?? 1,
        isLegalDelivery: false
      };

    case "BYE":
      return {
        ...base,
        type: "BYE",
        runs: outcome.runs ?? 1,
        totalRuns: outcome.runs ?? 1,
        wicket: false,
        extra: false,
        extraType: "BYE",
        extraRuns: outcome.runs ?? 1,
        isLegalDelivery: true
      };

    case "LB":
      return {
        ...base,
        type: "LB",
        runs: outcome.runs ?? 1,
        totalRuns: outcome.runs ?? 1,
        wicket: false,
        extra: false,
        extraType: "LB",
        extraRuns: outcome.runs ?? 1,
        isLegalDelivery: true
      };

    default:
      throw new Error(`❌ Unsupported outcome type: ${String((outcome as { type?: string }).type)}`);
  }
}