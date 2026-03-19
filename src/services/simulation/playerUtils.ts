import { playerProfiles, PlayerProfile } from "./playerProfiles";

export function getPlayer(name: string): PlayerProfile {
  return (
    playerProfiles[name] || {
      name,
      aggression: 0.5,
      consistency: 0.5,
      wicketRisk: 0.3,
      economy: 0.5,
      wicketTaking: 0.5,
    }
  );
}