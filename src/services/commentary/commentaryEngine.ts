import { BallEvent } from "@/types/ballEvent";
import { getNarrativeState } from "../narrative/narrativeEngine";
import { CommentaryEvent } from "./commentaryTypes";
import { emitCommentary } from "./commentaryBus";
import { getCommentaryStyle } from "./commentaryStyle";
import { computeWinProbability } from "../winProbabilityEngine";
import { getMatchState } from "../matchEngine";
import { computeProbabilitySwing } from "../probabilitySwingEngine";
import { computeStatisticalCommentary } from "./statisticalCommentaryEngine";
import { buildCommentaryChain } from "./commentaryChainEngine";

export function processCommentaryEvent(
  matchId: string,
  branchId: string,
  event: BallEvent
) {
  if (!event.valid) return;

  const narrative = getNarrativeState(matchId, branchId);
  const matchState = getMatchState(matchId);

  let text = "";
  let tone: CommentaryEvent["tone"] = "NEUTRAL";

  // ------------------------------------------------
  // 1️⃣ Probability Swing Detection (Highest Priority)
  // ------------------------------------------------

  if (matchState) {
    const swing = computeProbabilitySwing(matchId, matchState);

    if (swing) {
      text = `Massive swing! Win probability shifts ${Math.abs(
        swing.delta
      ).toFixed(1)}%!`;

      tone = swing.direction === "DOWN"
        ? "AGGRESSIVE"
        : "NEUTRAL";
    }
  }

  // ------------------------------------------------
  // 2️⃣ Extreme Win Probability Threshold
  // ------------------------------------------------

  if (!text && matchState) {
    const winProb = computeWinProbability(matchState);

    if (winProb && winProb.battingWinProbability < 20) {
      text = `Win probability crashes to ${winProb.battingWinProbability.toFixed(
        1
      )}%!`;

      tone = "AGGRESSIVE";
    }

    if (winProb && winProb.battingWinProbability > 85) {
      text = `They’re almost there! Win probability rises to ${winProb.battingWinProbability.toFixed(
        1
      )}%!`;

      tone = "NEUTRAL";
    }
  }
  // ------------------------------------------------
// 3️⃣ Statistical Injection
// ------------------------------------------------

if (!text && matchState) {
  const stat = computeStatisticalCommentary(matchState);

  if (stat) {
    text = stat.text;
    tone = stat.tone;
  }
}

  // ------------------------------------------------
  // 3️⃣ Event-Based Commentary
  // ------------------------------------------------

  if (!text && event.type === "SIX") {
    if (narrative?.currentArc === "CLIMAX") {
      text = "That’s massive! The pressure explodes into a towering six!";
      tone = "AGGRESSIVE";
    } else {
      text = "That’s a clean strike for six.";
    }
  }

  if (!text && event.type === "WICKET") {
    if (narrative?.currentArc === "COLLAPSE") {
      text = "Another one falls! The collapse continues!";
      tone = "AGGRESSIVE";
    } else {
      text = "He’s gone! That’s a big breakthrough.";
    }
  }

  // ------------------------------------------------
  // 4️⃣ Narrative-Based Fallback
  // ------------------------------------------------

  if (!text && narrative?.currentArc === "PRESSURE_BUILD") {
    text = "Dot ball again. The pressure is building.";
    tone = "CALM";
  }

  // ------------------------------------------------
  // 5️⃣ Style Adjustment Layer (Final Modifier)
  // ------------------------------------------------

  if (text) {
    const style = getCommentaryStyle();

    if (style === "HYPER") {
      tone = "AGGRESSIVE";
    }

    if (style === "ANALYTICAL") {
      tone = "CALM";
    }
  }

  if (!text) return;

  if (matchState && text) {
  text = buildCommentaryChain(text, event, matchState);
}

  emitCommentary({
    matchId,
    branchId,
    eventId: event.id,
    text,
    tone
  });
}