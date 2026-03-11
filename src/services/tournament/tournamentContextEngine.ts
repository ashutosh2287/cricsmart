type TeamStanding = {
  team: string;
  points: number;
  netRunRate: number;
  matchesPlayed: number;
};

type TournamentState = {
  standings: TeamStanding[];
};

const tournamentCache: Record<string, TournamentState> = {};

/*
------------------------------------------------
UPDATE STANDINGS
------------------------------------------------
*/

export function updateTournamentStandings(
  tournamentId: string,
  standings: TeamStanding[]
) {

  tournamentCache[tournamentId] = {
    standings
  };

}

/*
------------------------------------------------
GET TEAM CONTEXT
------------------------------------------------
*/

export function getTeamTournamentContext(
  tournamentId: string,
  team: string
) {

  const state = tournamentCache[tournamentId];

  if (!state) return null;

  const row = state.standings.find(t => t.team === team);

  if (!row) return null;

  /*
  ------------------------------------------
  MUST WIN CHECK
  ------------------------------------------
  */

  if (row.matchesPlayed >= 3 && row.points <= 2) {
    return "MUST_WIN_MATCH";
  }

  /*
  ------------------------------------------
  NRR PRESSURE
  ------------------------------------------
  */

  if (Math.abs(row.netRunRate) < 0.25) {
    return "NRR_PRESSURE";
  }

  /*
  ------------------------------------------
  SAFE ZONE
  ------------------------------------------
  */

  if (row.points >= 6) {
    return "QUALIFICATION_SECURED";
  }

  return "NORMAL";

}