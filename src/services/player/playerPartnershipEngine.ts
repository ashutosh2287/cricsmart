// src/services/player/playerPartnershipEngine.ts

export type PartnershipState = {
  batterA: string;
  batterB: string;
  runs: number;
};

let currentPartnership: PartnershipState | null = null;

export type PartnershipMilestone = {
  message: string;
};

export function startPartnership(
  batterA: string,
  batterB: string
) {
  currentPartnership = {
    batterA,
    batterB,
    runs: 0
  };
}

export function addPartnershipRuns(
  runs: number
): PartnershipMilestone[] {

  if (!currentPartnership) return [];

  currentPartnership.runs += runs;

  const milestones: PartnershipMilestone[] = [];

  if (currentPartnership.runs === 50) {
    milestones.push({
      message: `${currentPartnership.batterA} and ${currentPartnership.batterB} bring up a solid 50 run partnership.`,
    });
  }

  if (currentPartnership.runs === 100) {
    milestones.push({
      message: `${currentPartnership.batterA} and ${currentPartnership.batterB} reach a massive 100 run partnership.`,
    });
  }

  if (currentPartnership.runs >= 150) {
    milestones.push({
      message: `${currentPartnership.batterA} and ${currentPartnership.batterB} are dominating with a huge partnership.`,
    });
  }

  return milestones;
}

export function endPartnership() {
  currentPartnership = null;
}

export function getCurrentPartnership() {
  return currentPartnership;
}