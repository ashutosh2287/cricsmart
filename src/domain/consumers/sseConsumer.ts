import { eventBus } from "@/domain/eventBus";
import { broadcast } from "@/services/realtime/eventBus";

export function initSseConsumer() {
  eventBus.on("BALL", (event) => {
    broadcast(event.runtimeMatchId, {
      type: "BALL",
      matchId: event.runtimeMatchId,
      data: event,
    });
  });

  eventBus.on("WICKET", (event) => {
    broadcast(event.runtimeMatchId, {
      type: "WICKET",
      matchId: event.runtimeMatchId,
      data: event,
    });
  });

  eventBus.on("MATCH_FINISHED", (event) => {
    broadcast(event.runtimeMatchId, {
      type: "MATCH_FINISHED",
      matchId: event.runtimeMatchId,
      data: event,
    });
  });
}
