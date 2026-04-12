import { generateMatchStory } from "./matchStoryEngine";
import { getMatchState } from "../matchEngine";

export function composeFullMatchStory(matchId: string): string {

  const story = generateMatchStory(matchId);
  const state = getMatchState(matchId);

  if (!state) return "";

  const innings = state.innings;

  const team1 = innings[0]?.battingTeam || "Team A";
  const team2 = innings[1]?.battingTeam || "Team B";

  const score1 = innings[0]?.runs ?? 0;
  const score2 = innings[1]?.runs ?? 0;

  const winner =
    score2 > score1 ? team2 : team1;

  const parts: string[] = [];

  /* =============================
     OPENING
  ============================= */
  parts.push(
    `${team1} posted ${score1}, setting up an intriguing contest against ${team2}.`
  );

  /* =============================
     MIDDLE STORY
  ============================= */

  if (story.partnership) parts.push(story.partnership);

  if (story.assaultPhase) parts.push(story.assaultPhase);

  if (story.turningPoint) parts.push(story.turningPoint);

  if (story.collapsePhase) parts.push(story.collapsePhase);

  if (story.deathDrama) parts.push(story.deathDrama);

  if (story.bestMoment) parts.push(story.bestMoment);

  /* =============================
     RESULT
  ============================= */

  parts.push(
    `${winner} ultimately came out on top in a match filled with momentum swings.`
  );

  return parts.join(" ");
}