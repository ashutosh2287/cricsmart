import type { MatchState } from "@/services/matchEngine";

export type PlayerProfile = {
  aggression: number;
  anchor: number;
  finisher: number;
};

function getRoleBasedProfile(role?: string): PlayerProfile {
  switch (role) {
    case "batsman":
      return { aggression: 0.6, anchor: 0.7, finisher: 0.6 };

    case "allrounder":
      return { aggression: 0.7, anchor: 0.5, finisher: 0.7 };

    case "bowler":
      return { aggression: 0.3, anchor: 0.3, finisher: 0.2 };

    default:
      return { aggression: 0.5, anchor: 0.5, finisher: 0.5 };
  }
}
export function getPlayerProfile(
  state: MatchState,
  playerName?: string
): PlayerProfile {
  if (!playerName) {
    return { aggression: 0.5, anchor: 0.5, finisher: 0.5 };
  }

  const allPlayers = [
    ...(state.teamA?.squad ?? []),
    ...(state.teamB?.squad ?? []),
  ];

  const player = allPlayers.find((p) => p.name === playerName);

  return getRoleBasedProfile(player?.role);
}
export function adjustByBattingOrder(
  profile: PlayerProfile,
  position: number
): PlayerProfile {
  // Top order → anchor + controlled aggression
  if (position <= 3) {
    return {
      aggression: profile.aggression * 0.9,
      anchor: profile.anchor * 1.2,
      finisher: profile.finisher * 0.8,
    };
  }

  // Middle order → balanced
  if (position <= 6) {
    return profile;
  }

  // Lower order → tailenders
  return {
    aggression: profile.aggression * 0.6,
    anchor: profile.anchor * 0.5,
    finisher: profile.finisher * 0.3,
  };
}