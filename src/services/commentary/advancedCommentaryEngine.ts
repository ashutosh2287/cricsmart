import { BallEvent } from "../../types/ballEvent";
import { MatchState } from "../matchEngine";

const COLLAPSE_WICKET_THRESHOLD = 6;
const RIVALRY_FREQUENCY = 5;
const RIVALRY_TRIGGER_MAX_HASH = 1;
const CHASE_PRESSURE_BALLS_THRESHOLD = 18;
const RIVALRY_PAIR_DELIMITER = "|";

function flattenInningsEvents(overs: MatchState["innings"][number]["overs"]) {
  return Object.keys(overs)
    .map(Number)
    .filter((overNumber) => Number.isFinite(overNumber))
    .sort((a, b) => a - b)
    .flatMap((overNumber) => overs[overNumber] ?? []);
}

function calculateCurrentPartnershipRuns(overs: MatchState["innings"][number]["overs"]) {
  const events = flattenInningsEvents(overs);
  let runsSinceLastWicket = 0;

  for (const ball of events) {
    if (!ball?.valid) continue;
    if (ball.wicket) {
      runsSinceLastWicket = 0;
      continue;
    }
    runsSinceLastWicket += ball.runs ?? 0;
  }

  return runsSinceLastWicket;
}

/**
 * Generates a deterministic unsigned hash for a rivalry pair key
 * built as `${batsman}${RIVALRY_PAIR_DELIMITER}${bowler}` so triggers stay stable.
 */
function stablePairHash(pair: string): number {
  let hash = 5381;
  for (let i = 0; i < pair.length; i += 1) {
    hash = (hash * 33) ^ pair.charCodeAt(i);
  }
  return Math.abs(hash >>> 0);
}

export function generateAdvancedCommentary(
  event: BallEvent,
  state: MatchState | null | undefined
): string {

  if (!event) return "";
  if (!state || !state.innings || state.innings.length === 0) return "";

  const inningsIndex = state.currentInningsIndex ?? 0;
  const innings = state.innings[inningsIndex];
  if (!innings) return "";

  const batsman = event.batsman || "Batter";
  const bowler = event.bowler || "Bowler";
  const runs = event.runs ?? 0;

  const over = innings.over ?? 0;
  const wickets = innings.wickets ?? 0;
  const score = innings.runs ?? 0;

  const isDeath = over >= 15;
  const isCollapse = wickets >= COLLAPSE_WICKET_THRESHOLD;
  const isSecondInnings = inningsIndex === 1;

  const chaseTarget =
    isSecondInnings && state.innings[0]
      ? (state.innings[0].runs ?? 0) + 1
      : 0;
  const chaseRunsNeeded = Math.max(0, chaseTarget - score);
  const ballsBowled = (innings.over ?? 0) * 6 + (innings.ball ?? 0);
  const ballsRemaining = Math.max(0, 120 - ballsBowled);
  const partnershipRuns = calculateCurrentPartnershipRuns(innings.overs ?? {});
  const rivalryModulo =
    stablePairHash(`${batsman}${RIVALRY_PAIR_DELIMITER}${bowler}`) %
    RIVALRY_FREQUENCY;

  /* =============================
     🎲 RANDOM PICK
  ============================= */
  function pick(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* =============================
     🎭 PLAYER PERSONALITY (LIGHT SIMULATION)
  ============================= */
  function playerTone(name: string) {
    const hash = name
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0);

    if (hash % 3 === 0) return "aggressive";
    if (hash % 3 === 1) return "calm";
    return "balanced";
  }

  const tone = playerTone(batsman);

  if (partnershipRuns >= 50 && !event.wicket) {
    return pick([
      `Partnership alert: ${batsman} and ${event.nonStriker || "their partner"} are stitching together a critical stand.`,
      `Fifty plus partnership now — this pair is quietly changing the game.`,
    ]);
  }

  if (rivalryModulo <= RIVALRY_TRIGGER_MAX_HASH && (runs === 0 || event.wicket)) {
    return pick([
      `${bowler} is right on top of ${batsman} in this duel.`,
      `That battle between ${bowler} and ${batsman} is getting more intense ball by ball.`,
    ]);
  }

  const previousScore = Math.max(0, score - runs);
  const reachedMilestone =
    !event.wicket &&
    runs > 0 &&
    Math.floor(score / 50) > Math.floor(previousScore / 50);

  if (reachedMilestone) {
    return pick([
      `Milestone reached — ${innings.battingTeam || "the batting side"} bring up ${score}.`,
      `${score} on the board now. That is a significant checkpoint in this innings.`,
    ]);
  }

  if (
    isSecondInnings &&
    chaseRunsNeeded > 0 &&
    ballsRemaining <= CHASE_PRESSURE_BALLS_THRESHOLD
  ) {
    return pick([
      `Chase pressure rising: ${chaseRunsNeeded} needed from ${ballsRemaining} balls.`,
      `${chaseRunsNeeded} required off ${ballsRemaining} — this chase is going down to the wire.`,
    ]);
  }

  if (isDeath && !event.wicket && runs === 0) {
    return pick([
      `Death over tension sky-high — every dot is gold for the bowling side.`,
      `Dot in the death overs. That swings the pressure dramatically.`,
    ]);
  }

  /* =============================
     🔴 WICKET
  ============================= */
  if (event.wicket) {

    if (isCollapse) {
      return pick([
        `Another one bites the dust! ${batsman} departs and this is turning into a collapse.`,
        `${bowler} strikes again! The batting side is under serious pressure now.`,
        `Disaster for the batting team! ${batsman} is gone.`,
      ]);
    }

    return pick([
      `WICKET! ${batsman} is OUT! Big moment in the match.`,
      `${bowler} gets the breakthrough! ${batsman} has to go.`,
      `Gone! That’s a huge scalp picked up by ${bowler}.`,
    ]);
  }

  /* =============================
     🟣 SIX
  ============================= */
  if (runs === 6) {

    if (isDeath) {
      return pick([
        `SIX! That’s exactly what they needed at this stage!`,
        `BOOM! ${batsman} goes big under pressure!`,
        `Massive hit! The crowd is loving this.`,
      ]);
    }

    if (tone === "aggressive") {
      return pick([
        `SIX! ${batsman} absolutely smashes that!`,
        `That’s been hammered! What a strike.`,
      ]);
    }

    return pick([
      `SIX! Clean strike from ${batsman}.`,
      `Up and over! That’s a maximum.`,
    ]);
  }

  /* =============================
     🟢 FOUR
  ============================= */
  if (runs === 4) {

    if (isDeath) {
      return pick([
        `FOUR! Crucial boundary under pressure.`,
        `${batsman} finds the gap perfectly!`,
      ]);
    }

    return pick([
      `FOUR! Beautifully timed shot.`,
      `Cracking drive! That races away.`,
      `Excellent placement, no chance for the fielder.`,
    ]);
  }

  /* =============================
     ⚪ DOT BALL
  ============================= */
  if (runs === 0) {

    if (isDeath) {
      return pick([
        `Dot ball! That builds serious pressure now.`,
        `No run. Excellent discipline from ${bowler}.`,
      ]);
    }

    return pick([
      `Dot ball. Tight bowling.`,
      `${batsman} defends it safely.`,
      `No run. Pressure building.`,
    ]);
  }

  /* =============================
     🏃 RUNS
  ============================= */
  if (runs > 0) {

    if (runs === 1) {
      return pick([
        `Just a single… they’ll need more than that.`,
        `Keeps the scoreboard ticking.`,
        `${batsman} rotates strike.`,
      ]);
    }

    if (runs === 2) {
      return pick([
        `Good running! They come back for two.`,
        `${batsman} pushes hard and gets a couple.`,
      ]);
    }

    if (runs === 3) {
      return pick([
        `Three runs! Excellent running between wickets.`,
        `They sprint back for three, great effort!`,
      ]);
    }
  }

  return "Nothing significant on that delivery.";
}
