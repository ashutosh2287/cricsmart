// src/services/player/playerMilestoneEngine.ts

import { getPlayerStats } from "./playerStore";

export type PlayerMilestone = {
  player: string;
  message: string;
};

export function detectPlayerMilestones(player: string): PlayerMilestone[] {

  const stats = getPlayerStats(player);

  if (!stats) return [];

  const milestones: PlayerMilestone[] = [];

  /*
  --------------------------------------------
  Batting Milestones
  --------------------------------------------
  */

  if (stats.runs === 50) {
    milestones.push({
      player,
      message: `${player} brings up a brilliant half century.`,
    });
  }

  if (stats.runs === 100) {
    milestones.push({
      player,
      message: `${player} reaches a magnificent century.`,
    });
  }

  /*
  --------------------------------------------
  Bowling Milestones
  --------------------------------------------
  */

  if (stats.wickets === 3) {
    milestones.push({
      player,
      message: `${player} picks up three wickets and puts the opposition under pressure.`,
    });
  }

  /*
  --------------------------------------------
  Hat-trick Threat
  --------------------------------------------
  */

  if (stats.wickets === 2 && stats.ballsBowled <= 2) {
    milestones.push({
      player,
      message: `${player} is on a hat-trick.`,
    });
  }

  /*
  --------------------------------------------
  Strike Rate Surge
  --------------------------------------------
  */

  const strikeRate =
    stats.balls > 0 ? (stats.runs / stats.balls) * 100 : 0;

  if (stats.runs >= 30 && strikeRate > 180) {
    milestones.push({
      player,
      message: `${player} is scoring at a blistering strike rate.`,
    });
  }

  return milestones;
}