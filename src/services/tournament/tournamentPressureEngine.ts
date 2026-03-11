import { emitDirectorSignal } from "../directorSignalBus";
import { getTeamTournamentContext } from "./tournamentContextEngine";

export function evaluateTournamentPressure(
  tournamentId: string,
  matchId: string,
  team: string,
  branchId: string,
  eventId: string
) {

  const context = getTeamTournamentContext(
    tournamentId,
    team
  );

  if (!context) return;

  /*
  ------------------------------------------
  MUST WIN MATCH
  ------------------------------------------
  */

  if (context === "MUST_WIN_MATCH") {

    emitDirectorSignal({
      type: "PRESSURE_SPIKE",
      matchId,
      branchId,
      eventId
    });

  }

  /*
  ------------------------------------------
  NRR PRESSURE
  ------------------------------------------
  */

  if (context === "NRR_PRESSURE") {

    emitDirectorSignal({
      type: "STRANGLE_ALERT",
      matchId,
      branchId,
      eventId,
      intensity: 1
    });

  }

}