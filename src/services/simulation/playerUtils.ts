import { playerProfiles, PlayerProfile } from "./playerProfiles";

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededDefault(name: string): PlayerProfile {
  const h = hashName(name);
  const aggression = 0.3 + (h % 50) / 100;
  const consistency = 0.4 + ((h >> 8) % 40) / 100;
  const wicketRisk = 0.2 + ((h >> 16) % 40) / 100;
  const economy = 0.4 + ((h >> 4) % 35) / 100;
  const wicketTaking = 0.3 + ((h >> 12) % 45) / 100;

  return {
    name,
    aggression: Math.min(aggression, 0.95),
    consistency: Math.min(consistency, 0.95),
    wicketRisk: Math.min(wicketRisk, 0.8),
    economy: Math.min(economy, 0.9),
    wicketTaking: Math.min(wicketTaking, 0.85),
  };
}

export function getPlayer(name: string): PlayerProfile {
  return playerProfiles[name] || seededDefault(name);
}
