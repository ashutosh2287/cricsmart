import { MatchState } from "../matchEngine";
import { computeChasePressure } from "../pressureEngine";
import { computeWinProbability } from "../winProbabilityEngine";
import { BallEvent } from "@/types/ballEvent";

export function buildCommentaryChain(
  baseText: string,
  event: BallEvent,
  state: MatchState
): string {

  const sentences: string[] = [];

  // 1️⃣ Base reaction
  sentences.push(baseText);

  // 2️⃣ Chase pressure insight
  const chase = computeChasePressure(state);

  if (chase) {
    if (chase.requiredRunRate > 10) {
      sentences.push(
        `Required rate now ${chase.requiredRunRate.toFixed(1)}.`
      );
    }

    if (chase.ballsRemaining <= 12) {
      sentences.push(
        "Just a few deliveries remaining in this chase."
      );
    }
  }

  // 3️⃣ Win probability insight
  const winProb = computeWinProbability(state);

  if (winProb) {
    if (winProb.battingWinProbability < 30) {
      sentences.push(
        "The match slipping away from the batting side."
      );
    }

    if (winProb.battingWinProbability > 70) {
      sentences.push(
        "They are firmly in control now."
      );
    }
  }

  return sentences.join(" ");
}