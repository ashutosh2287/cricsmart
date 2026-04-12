import { Team, Player } from "@/data/teams";

/* =====================================================
   🧠 EXTENDED PLAYER (WITH STATS)
===================================================== */

type PlayerStats = {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets?: number;
  runsConceded?: number;
  ballsBowled?: number;
};

export type SimPlayer = Player & {
  stats: PlayerStats;
};

/* =====================================================
   🏏 PLAYING XI
===================================================== */

export type PlayingXI = {
  team: string;
  players: SimPlayer[];
};

/* =====================================================
   🔧 HELPER: CREATE PLAYER WITH STATS
===================================================== */

function createSimPlayer(player: Player): SimPlayer {
  return {
    ...player,
    stats: {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      runsConceded: 0,
      ballsBowled: 0
    }
  };
}

/* =====================================================
   ✅ AUTO PICK XI
===================================================== */

export function getPlayingXI(team: Team): PlayingXI {
  const batsmen = team.squad.filter(p => p.role === "BAT");
  const bowlers = team.squad.filter(p => p.role === "BOWL");
  const allRounders = team.squad.filter(p => p.role === "AR");
  const wicketKeepers = team.squad.filter(p => p.role === "WK");

  const selected: Player[] = [];

  // 1. Top order batsmen (4)
  selected.push(...batsmen.slice(0, 4));

  // 2. 1 WK
  if (wicketKeepers.length > 0) {
    selected.push(wicketKeepers[0]);
  }

  // 3. All-rounders (2)
  selected.push(...allRounders.slice(0, 2));

  // 4. Bowlers (4)
  selected.push(...bowlers.slice(0, 4));

  // 🔥 CONVERT TO SIM PLAYERS (IMPORTANT)
  const simPlayers: SimPlayer[] = selected
    .slice(0, 11)
    .map(createSimPlayer);

  return {
    team: team.name,
    players: simPlayers,
  };
}