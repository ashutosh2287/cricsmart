// src/services/tournament/qualificationEngine.ts

import { getPointsTable, TeamStanding } from "./tournamentStore";

export type QualificationStatus = {
  qualified: string[];
  eliminated: string[];
  contenders: string[];
};

export function computeQualificationStatus(
  playoffSlots: number = 4
): QualificationStatus {

  const table: TeamStanding[] = getPointsTable();

  const qualified: string[] = [];
  const eliminated: string[] = [];
  const contenders: string[] = [];

  if (!table.length) {
    return { qualified, eliminated, contenders };
  }

  /*
  --------------------------------------------
  Qualified Teams (Top N)
  --------------------------------------------
  */

  for (let i = 0; i < table.length; i++) {

    const team = table[i];

    if (i < playoffSlots) {
      qualified.push(team.team);
    }

  }

  /*
  --------------------------------------------
  Eliminated Teams (Bottom teams)
  --------------------------------------------
  */

  const minPointsForQualification =
    table[playoffSlots - 1]?.points ?? 0;

  for (const team of table) {

    if (team.points < minPointsForQualification - 2) {
      eliminated.push(team.team);
    }

  }

  /*
  --------------------------------------------
  Contenders
  --------------------------------------------
  */

  for (const team of table) {

    if (
      !qualified.includes(team.team) &&
      !eliminated.includes(team.team)
    ) {
      contenders.push(team.team);
    }

  }

  return {
    qualified,
    eliminated,
    contenders,
  };

}