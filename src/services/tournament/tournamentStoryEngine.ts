// src/services/tournament/tournamentStoryEngine.ts

import { getPointsTable } from "./tournamentStore";
import { computeQualificationStatus } from "./qualificationEngine";

export type TournamentStory = {
  leader?: string;
  qualificationMessages: string[];
};

export function generateTournamentStory(): TournamentStory {

  const table = getPointsTable();
  const status = computeQualificationStatus();

  const story: TournamentStory = {
    qualificationMessages: []
  };

  /*
  --------------------------------------------
  Leader Narrative
  --------------------------------------------
  */

  if (table.length > 0) {
    story.leader = `${table[0].team} currently leads the tournament standings.`;
  }

  /*
  --------------------------------------------
  Qualification Messages
  --------------------------------------------
  */

  for (const team of status.qualified) {
    story.qualificationMessages.push(
      `${team} has secured a playoff position.`
    );
  }

  /*
  --------------------------------------------
  Elimination Messages
  --------------------------------------------
  */

  for (const team of status.eliminated) {
    story.qualificationMessages.push(
      `${team} has been eliminated from playoff contention.`
    );
  }

  /*
  --------------------------------------------
  Contender Race
  --------------------------------------------
  */

  if (status.contenders.length > 1) {
    story.qualificationMessages.push(
      "The race for the remaining playoff spots is heating up."
    );
  }

  return story;
}