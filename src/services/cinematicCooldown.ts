// cinematicCooldown.ts

type CooldownMap = {
  [key: string]: number;
};

const cooldowns: CooldownMap = {};

/*
================================================
COOLDOWN CHECK
================================================
*/

export function canTrigger(
  key: string,
  cooldownMs: number
): boolean {

  const now = Date.now();
  const last = cooldowns[key] ?? 0;

  if (now - last >= cooldownMs) {
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