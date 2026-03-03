import { getCurrentTick } from "./timeEngine";
import { getDirectorProfileConfig } from "./directorProfile";

// cinematicCooldown.ts

type CooldownMap = {
  [key: string]: number;
};

const cooldowns: CooldownMap = {};

/*
================================================
COOLDOWN CHECK (INTELLIGENCE-AWARE)
================================================
*/

export function canTrigger(
  matchId: string,
  key: string,
  cooldownTicks: number,
  tension?: number,
  intensity?: "MINOR" | "MODERATE" | "MAJOR" | "SHOCK"
)   : boolean {

  const now = getCurrentTick(matchId);
  const last = cooldowns[key] ?? 0;
  

  let adjustedCooldown = cooldownTicks;
  const profile = getDirectorProfileConfig();
adjustedCooldown *= profile.cooldownMultiplier;

  /*
  --------------------------------------------
  SHOCK OVERRIDE
  --------------------------------------------
  */

  if (intensity === "SHOCK") {
    adjustedCooldown = cooldownTicks * 0.3;
  }

  /*
  --------------------------------------------
  TENSION-BASED SCALING
  --------------------------------------------
  */

  if (tension !== undefined) {

    if (tension > 85) {
      adjustedCooldown *= 0.5;
    } else if (tension > 65) {
      adjustedCooldown *= 0.7;
    } else if (tension < 25) {
      adjustedCooldown *= 1.3;
    }
  }

  if (now - last >= adjustedCooldown) {
    cooldowns[key] = now;
    return true;
  }

  return false;
}

/*
================================================
RESET (for replay stop / branch switch)
================================================
*/

export function resetCinematicCooldown() {
  for (const key in cooldowns) {
    delete cooldowns[key];
  }
}