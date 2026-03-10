import { getHighlights } from "../highlights/highlightStore";

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

  const story: MatchStory = {};

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

  return story;
}