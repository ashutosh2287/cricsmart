import { emitDomainEvent, subscribeDomainEvent } from "@/domain/eventBus";
import { processCommentaryPipeline } from "@/services/commentary/orchestration/commentary-pipeline";
import { computeWinProbability } from "@/services/winProbabilityEngine";

let commentaryConsumerRegistered = false;
const processedBallIds = new Set<string>();
const lastWinProbabilityByMatch = new Map<string, number | null>();

function processBallCommentary(input: {
  runtimeMatchId: string;
  branchId: string;
  ballEvent: Parameters<typeof processCommentaryPipeline>[0]["ballEvent"];
  state: Parameters<typeof processCommentaryPipeline>[0]["state"];
  eventId: string;
}) {
  if (processedBallIds.has(input.eventId)) {
    return;
  }
  processedBallIds.add(input.eventId);

  const previousWinProbability = lastWinProbabilityByMatch.get(input.runtimeMatchId) ?? null;
  const currentWinProbability = computeWinProbability(input.state)?.battingWinProbability ?? null;
  lastWinProbabilityByMatch.set(input.runtimeMatchId, currentWinProbability);

  try {
    const result = processCommentaryPipeline({
      matchId: input.runtimeMatchId,
      branchId: input.branchId,
      ballEvent: input.ballEvent,
      state: input.state,
      probabilityState: {
        previousWinProbability,
        currentWinProbability,
      },
    });

    for (const generated of result.emittedEvents) {
      emitDomainEvent("COMMENTARY", {
        type: "COMMENTARY",
        runtimeMatchId: input.runtimeMatchId,
        commentaryId: generated.eventId,
        over: generated.over,
        ball: generated.ball,
        text: generated.text,
        tone: generated.tone,
        importance: generated.importance,
        isBoundary: input.ballEvent.type === "FOUR" || input.ballEvent.type === "SIX",
        isWicket: input.ballEvent.type === "WICKET",
        timestamp: generated.timestamp,
      });
    }
  } catch (error) {
    console.error("COMMENTARY_CONSUMER_FAILED", {
      runtimeMatchId: input.runtimeMatchId,
      eventId: input.eventId,
      error,
    });
  }
}

export function registerCommentaryConsumer(): void {
  if (commentaryConsumerRegistered) return;
  commentaryConsumerRegistered = true;

  subscribeDomainEvent("BALL", (event) => {
    processBallCommentary({
      runtimeMatchId: event.runtimeMatchId,
      branchId: event.state.activeBranchId,
      ballEvent: event.ballEvent,
      state: event.state,
      eventId: event.eventMeta.eventId,
    });
  });

  subscribeDomainEvent("WICKET", (event) => {
    processBallCommentary({
      runtimeMatchId: event.runtimeMatchId,
      branchId: event.state.activeBranchId,
      ballEvent: event.ballEvent,
      state: event.state,
      eventId: event.eventMeta.eventId,
    });
  });
}
