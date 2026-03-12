import { getHighlights } from "../highlights/highlightStore";
import { getMatchPhase } from "../analytics/matchPhaseEngine";
import { getMomentumSwings } from "../analytics/momentumSwingEngine";
import { computeCurrentPartnership } from "../analytics/partnershipEngine";
import { getEventStream } from "../matchEngine";
import { detectTurningPoints } from "../analytics/turningPointEngine";

export type MatchStory = {
  turningPoint?: string;
  partnership?: string;
  bestMoment?: string;
  collapsePhase?: string;
  assaultPhase?: string;
  deathDrama?: string;
};

export function generateMatchStory(matchId: string): MatchStory {

  const highlights = getHighlights(matchId);
  const phase = getMatchPhase(matchId);
  const swings = getMomentumSwings(matchId);
  const partnership = computeCurrentPartnership(matchId);

  const events = getEventStream(matchId);
  const turningPoints = detectTurningPoints(events);

  const story: MatchStory = {};

  /*
  ========================================
  Highlight-based story
  ========================================
  */

  for (const h of highlights) {

    if (h.type === "TURNING_POINT" && !story.turningPoint) {
      story.turningPoint =
        "The match turned dramatically after a crucial moment shifted the momentum.";
    }

    if (h.type === "BIG_PARTNERSHIP" && !story.partnership) {
      story.partnership =
        "A strong partnership helped stabilize the innings.";
    }

    if (h.type === "DOMINANT_PARTNERSHIP") {
      story.partnership =
        "A dominant partnership completely changed the match situation.";
    }

    if (h.type === "SIX" && !story.bestMoment) {
      story.bestMoment =
        "A powerful six electrified the crowd and boosted the batting side.";
    }

    if (h.type === "COLLAPSE_PHASE" && !story.collapsePhase) {
      story.collapsePhase =
        "A sudden collapse changed the momentum of the match.";
    }

    if (h.type === "ASSAULT_PHASE" && !story.assaultPhase) {
      story.assaultPhase =
        "The batting side launched a brutal assault on the bowlers.";
    }

    if (h.type === "DEATH_OVER_DRAMA" && !story.deathDrama) {
      story.deathDrama =
        "The match reached a dramatic climax in the final overs.";
    }

  }

  /*
  ========================================
  Match Phase influence
  ========================================
  */

  if (phase) {

    if (phase.phase === "POWERPLAY_ASSAULT") {
      story.assaultPhase =
        "The batting side dominated the powerplay with aggressive stroke play.";
    }

    if (phase.phase === "BOWLING_DOMINANCE") {
      story.turningPoint =
        "The bowlers tightened their control and slowed the scoring dramatically.";
    }

    if (phase.phase === "DEATH_OVERS_ATTACK") {
      story.deathDrama =
        "The death overs produced explosive hitting and dramatic momentum swings.";
    }

    if (phase.phase === "COLLAPSE_PHASE") {
      story.collapsePhase =
        "Multiple wickets in quick succession caused a dramatic batting collapse.";
    }

  }

  /*
  ========================================
  Partnership story
  ========================================
  */

  if (partnership && partnership.runs >= 60) {

    story.partnership =
      `A crucial partnership of ${partnership.runs} runs helped stabilize the innings.`;

  }

  /*
  ========================================
  Momentum swings
  ========================================
  */

  const bigSwing = swings.find(s => s.impact >= 0.8);

  if (bigSwing && !story.turningPoint) {

    story.turningPoint =
      "A sudden momentum shift dramatically changed the balance of the match.";

  }

  /*
  ========================================
  Turning points
  ========================================
  */

  const collapse = turningPoints.find(tp => tp.type === "COLLAPSE");

  if (collapse && !story.collapsePhase) {

    story.collapsePhase =
      "A cluster of wickets created a decisive collapse in the innings.";

  }

  return story;

}