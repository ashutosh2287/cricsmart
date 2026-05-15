import type { BallEvent } from "@/types/ballEvent";
import type { CommentaryContext, CommentarySituationClassification } from "./commentaryContextTypes";

type SummaryRecord = {
  matchId: string;
  eventId: string;
  summaryType: "over" | "pressure" | "tactical" | "turning-point";
  text: string;
  over: number;
  ball: number;
  timestamp: number;
};

const summaryStore: Record<string, SummaryRecord[]> = {};

function pushSummary(record: SummaryRecord) {
  if (!summaryStore[record.matchId]) summaryStore[record.matchId] = [];
  const list = summaryStore[record.matchId];
  const dedupeKey = `${record.summaryType}:${record.eventId}:${record.over}:${record.ball}`;
  if (list.some((item) => `${item.summaryType}:${item.eventId}:${item.over}:${item.ball}` === dedupeKey)) {
    return null;
  }
  list.push(record);
  return record;
}

export function maybeGenerateCommentarySummaries(input: {
  matchId: string;
  event: BallEvent;
  context: CommentaryContext;
  situation: CommentarySituationClassification;
  commentaryText: string;
}) {
  const out: SummaryRecord[] = [];

  if (input.event.isLegalDelivery && input.context.ball === 0) {
    const summary = pushSummary({
      matchId: input.matchId,
      eventId: input.event.id,
      summaryType: "over",
      text: `Over ${input.context.over} recap: ${commentaryText}`,
      over: input.context.over,
      ball: input.context.ball,
      timestamp: input.event.timestamp,
    });
    if (summary) out.push(summary);
  }

  if (input.context.pressureLevel === "high" || input.context.pressureLevel === "extreme") {
    const pressure = pushSummary({
      matchId: input.matchId,
      eventId: input.event.id,
      summaryType: "pressure",
      text: `Pressure watch: ${input.context.chaseNarrative}.`,
      over: input.context.over,
      ball: input.context.ball,
      timestamp: input.event.timestamp,
    });
    if (pressure) out.push(pressure);
  }

  if (input.situation.tags.includes("turningPoint")) {
    const turning = pushSummary({
      matchId: input.matchId,
      eventId: input.event.id,
      summaryType: "turning-point",
      text: "Turning point alert: momentum has shifted sharply.",
      over: input.context.over,
      ball: input.context.ball,
      timestamp: input.event.timestamp,
    });
    if (turning) out.push(turning);
  }

  return out;
}

export function getCommentarySummaries(matchId: string) {
  return summaryStore[matchId] ?? [];
}

export function getCommentarySummariesForEvent(matchId: string, eventId: string) {
  return (summaryStore[matchId] ?? []).filter((item) => item.eventId === eventId);
}
