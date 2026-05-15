import type { BallEvent } from "@/types/ballEvent";
import type { CommentaryContext, CommentaryPlan } from "../types/commentary.types";

const TEMPLATE_VARIATIONS: Record<string, string[]> = {
  boundary_pressure_release: [
    "${player} finally breaks the pressure with a crucial boundary.",
    "${player} releases the squeeze with a boundary right when it was needed.",
    "A timely boundary from ${player}, and the pressure valve opens a little.",
  ],
  collapse_warning: [
    "Another wicket falls and the innings is beginning to wobble badly.",
    "The batting side is slipping now, another wicket under mounting pressure.",
    "This is turning into a wobble, another wicket jolts the innings.",
  ],
  momentum_shift: [
    "The momentum is rapidly shifting toward ${team}.",
    "${team} have seized the initiative and the game is tilting.",
    "You can feel the swing now, ${team} are pulling the match their way.",
  ],
  wicket_turning_point: [
    "${bowler} strikes at a defining moment and the match narrative flips sharply.",
    "That wicket from ${bowler} could reshape the contest entirely.",
    "A huge breakthrough for ${bowler}, and this may be the moment everyone remembers.",
  ],
  wicket_breakthrough: [
    "${bowler} finds the breakthrough and ${dismissedPlayer} has to go.",
    "A key strike for ${bowler}, ${dismissedPlayer} is dismissed.",
    "${dismissedPlayer} departs, and ${bowler} lands a timely breakthrough.",
  ],
  dot_ball_pressure: [
    "Another dot ball, and the pressure is starting to stack up.",
    "No run again, the squeeze is becoming intense here.",
    "Dot ball pressure keeps building with every delivery.",
  ],
  partnership_building: [
    "${player} and company are starting to stitch something valuable together.",
    "This partnership is gathering substance and settling the innings.",
    "The stand is beginning to shape the tempo of the innings.",
  ],
  standard_boundary: [
    "${player} finds the boundary and keeps the scoring rate healthy.",
    "That is neatly placed by ${player} for four.",
    "${player} cashes in with a boundary and keeps the innings moving.",
  ],
  single_rotation: [
    "${player} works it around and keeps the board ticking.",
    "A simple run for ${player}, steadying the innings rhythm.",
    "${player} nudges the strike over and maintains the tempo.",
  ],
  over_summary_attack: [
    "${overRuns} runs from the over, and ${team} have injected real life into the contest.",
    "A productive over brings ${overRuns}, and ${team} have lifted the tempo.",
    "${overRuns} off it, and the balance shifts with a far brighter over for ${team}.",
  ],
  over_summary_tight: [
    "Only ${overRuns} from the over, and the fielding side keep the squeeze on.",
    "A tight over yields just ${overRuns}, pressure still firmly in place.",
    "That over stays under control, only ${overRuns} added to the total.",
  ],
  over_summary_wicket: [
    "${overRuns} and ${wicketsInOver} wicket in the over, a meaningful swing in the phase.",
    "The over costs ${overRuns} but brings ${wicketsInOver} wicket, and that changes the texture again.",
    "A wicket punctuates the over, ${wicketsInOver} down and ${overRuns} runs added.",
  ],
  pressure_summary: [
    "Pressure remains ${pressure}, with ${requiredRuns} still needed from ${ballsRemaining} balls.",
    "The chase tension is ${pressure}, ${requiredRuns} required and little room for error.",
    "${pressure} pressure now: ${requiredRuns} needed from ${ballsRemaining} deliveries.",
  ],
  momentum_shift_summary: [
    "Momentum belongs to ${team} right now and the match is reacting quickly.",
    "${team} have the surge, and the game has a different feel now.",
    "The latest phase belongs to ${team}, momentum has moved decisively.",
  ],
  turning_point_summary: [
    "This passage feels like a genuine turning point in the match.",
    "A significant match-defining moment may just have unfolded here.",
    "You sense a turning point, the narrative has changed sharply.",
  ],
};

function checksum(value: string) {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total + value.charCodeAt(index) * (index + 1)) % 2147483647;
  }
  return total;
}

function pickVariation(key: string, seed: string) {
  const templates = TEMPLATE_VARIATIONS[key] ?? TEMPLATE_VARIATIONS.single_rotation;
  const index = checksum(`${key}:${seed}`) % templates.length;
  return templates[index];
}

function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\$\{([^}]+)\}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    return String(values[key] ?? "");
  });
}

function getBallRuns(event: BallEvent) {
  return event.totalRuns ?? event.runs ?? 0;
}

export function generateTemplateCommentary(input: {
  ballEvent: BallEvent;
  context: CommentaryContext;
  plan: CommentaryPlan;
  momentumTeam: string | null;
}): string {
  const template = pickVariation(input.plan.templateKey, `${input.context.eventId}:${input.context.over}:${input.context.ball}`);
  const team = input.momentumTeam ?? input.context.battingTeam;

  return interpolate(template, {
    player: input.plan.focusPlayer ?? input.context.batter,
    batter: input.context.batter,
    bowler: input.context.bowler,
    dismissedPlayer: input.context.dismissedPlayer ?? input.context.batter,
    team,
    runs: getBallRuns(input.ballEvent),
    overRuns: input.context.recentOverRuns,
    wicketsInOver: input.context.wicketsInOver,
    pressure: input.plan.pressureContext.toLowerCase(),
    requiredRuns: input.context.target ? Math.max(input.context.target - input.context.battingScore, 0) : 0,
    ballsRemaining: input.context.ballsRemaining,
  });
}
