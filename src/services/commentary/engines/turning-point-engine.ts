import type { PressureLevel } from "../types/commentary.types";

type TurningPointInput = {
  wicketEvent: boolean;
  momentumSwing: boolean;
  probabilitySwing: number;
  partnershipBreak: boolean;
  overImpact: number;
  pressureLevel: PressureLevel;
};

export function detectTurningPoint(input: TurningPointInput): boolean {
  if (Math.abs(input.probabilitySwing) >= 12) return true;

  if (
    input.wicketEvent &&
    (input.momentumSwing || input.partnershipBreak || input.pressureLevel === "HIGH" || input.pressureLevel === "EXTREME")
  ) {
    return true;
  }

  if (input.overImpact >= 18 && (input.pressureLevel === "HIGH" || input.pressureLevel === "EXTREME")) {
    return true;
  }

  return input.momentumSwing && input.partnershipBreak;
}
