import { BallEvent } from "@/types/ballEvent";
import { getNarrativeState } from "../narrative/narrativeEngine";
import { CommentaryEvent } from "./commentaryTypes";
import { emitCommentary } from "./commentaryBus";
import { getCommentaryStyle } from "./commentaryStyle";
import { computeWinProbability } from "../winProbabilityEngine";
import { getMatchState } from "../matchEngine";
import { computeStatisticalCommentary } from "./statisticalCommentaryEngine";
import { buildCommentaryChain } from "./commentaryChainEngine";
import { computeMomentumContext } from "../momentumContextEngine";
import { getEventStream } from "../matchEngine";
import { computeChasePressure } from "../pressureEngine";
import { getDirectorProfileConfig } from "../directorProfile";
import { computeStrategicContext } from "../strategicEngine";

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

  /*
  ========================================================
  1️⃣ Win Probability Context
  ========================================================
  */

  let winProb = null;

  if (matchState) {
    winProb = computeWinProbability(matchState);

    if (winProb) {
      const percent = Math.round(
        winProb.battingWinProbability
      );

      // Extreme thresholds only (avoid spam)
      if (percent < 20) {
        text = `Win probability crashes to ${percent}%!`;
        tone = "AGGRESSIVE";
      } else if (percent > 85) {
        text = `They’re almost there! Win probability rises to ${percent}%!`;
        tone = "NEUTRAL";
      } else if (percent >= 45 && percent <= 55) {
        text = `Win probability now ${percent}% — this game is finely poised.`;
      }
    }
  }

  /*
================================================
MINI MOMENTUM COMMENTARY
================================================
*/

if (!text && matchState) {

  const events = getEventStream(matchId);
  const momentum = computeMomentumContext(events);

  if (momentum.arc === "SURGE") {
    text = "Momentum building! The batting side is surging in this over.";
    tone = "AGGRESSIVE";
  }

  if (momentum.arc === "COLLAPSE") {
    text = "Back-to-back setbacks! The innings is wobbling badly.";
    tone = "AGGRESSIVE";
  }

  if (momentum.arc === "STALL") {
    text = "Dot ball pressure mounting — the scoring has stalled.";
    tone = "CALM";
  }
}

/*
================================================
STRATEGIC PHASE COMMENTARY
================================================
*/

if (!text && matchState) {

  const events = getEventStream(matchId);
  const chase = computeChasePressure(matchState);
  const strategic = computeStrategicContext(events, chase);

  switch (strategic.phase) {

    case "COLLAPSE":
      text = "The collapse is deepening — wickets tumbling under pressure.";
      tone = "AGGRESSIVE";
      break;

    case "ASSAULT":
      text = "This is a full-blown assault! The batting side is taking control.";
      tone = "AGGRESSIVE";
      break;

    case "STRANGLE":
      text = "The bowlers have completely strangled the scoring here.";
      tone = "CALM";
      break;

    case "PANIC":
      text = "The chase is spiraling — pressure mounting with every dot ball.";
      tone = "AGGRESSIVE";
      break;

    case "STABILIZING":
      text = "Steady recovery underway — the innings is stabilizing.";
      tone = "CALM";
      break;
  }
}

/*
================================================
DEATH OVER CALL-OUTS
================================================
*/

if (!text && matchState) {

  const chase = computeChasePressure(matchState);

  if (chase) {

    if (chase.ballsRemaining === 6) {
      text = `${chase.requiredRuns} needed off the final over!`;
      tone = "AGGRESSIVE";
    }

    if (chase.ballsRemaining === 1) {
      text = `${chase.requiredRuns} needed off the last ball!`;
      tone = "AGGRESSIVE";
    }

    if (
      chase.ballsRemaining <= 6 &&
      chase.requiredRuns > 0
    ) {
      text = `${chase.requiredRuns} needed off ${chase.ballsRemaining}!`;
      tone = "AGGRESSIVE";
    }
  }
}

  /*
  ========================================================
  2️⃣ Statistical Injection
  ========================================================
  */

  if (!text && matchState) {
    const stat = computeStatisticalCommentary(matchState);

    if (stat) {
      text = stat.text;
      tone = stat.tone;
    }
  }

  /*
  ========================================================
  3️⃣ Event-Based Commentary
  ========================================================
  */

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

  /*
  ========================================================
  4️⃣ Narrative-Based Fallback
  ========================================================
  */

  if (!text && narrative?.currentArc === "PRESSURE_BUILD") {
    text = "Dot ball again. The pressure is building.";
    tone = "CALM";
  }

  /*
  ========================================================
  5️⃣ Style Adjustment Layer
  ========================================================
  */

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

  /*
  ========================================================
  6️⃣ Commentary Chain Builder
  ========================================================
  */

  if (matchState) {
    text = buildCommentaryChain(text, event, matchState);
  }

  const profile = getDirectorProfileConfig();

if (profile.commentaryAggression > 1.2) {
  tone = "AGGRESSIVE";
}

  emitCommentary({
    matchId,
    branchId,
    eventId: event.id,
    text,
    tone
  });
}