import { emitDomainEvent, subscribeDomainEvent } from "@/domain/eventBus";
import { updateWinProbabilityFromDomainBall } from "@/services/analytics/winProbabilityTimelineEngine";

let winProbabilityConsumerRegistered = false;

export function registerWinProbabilityConsumer(): void {
  if (winProbabilityConsumerRegistered) return;
  winProbabilityConsumerRegistered = true;

  subscribeDomainEvent("BALL", (event) => {
    const prediction = updateWinProbabilityFromDomainBall(event);
    if (!prediction) return;

    emitDomainEvent("WIN_PROBABILITY", {
      type: "WIN_PROBABILITY",
      runtimeMatchId: event.runtimeMatchId,
      homeWinPct: prediction.batting,
      awayWinPct: prediction.bowling,
      innings: event.eventMeta.innings,
      over: event.eventMeta.over,
      ball: event.eventMeta.ball,
      timestamp: prediction.timestamp,
    });
  });
}
