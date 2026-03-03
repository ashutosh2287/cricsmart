// directorProfile.ts

export type DirectorProfile =
  | "CONSERVATIVE"
  | "BALANCED"
  | "AGGRESSIVE"
  | "HYPER_TV"
  | "ANALYTICAL";

type ProfileConfig = {
  tensionMultiplier: number;
  climaxThreshold: number;
  cooldownMultiplier: number;
  commentaryAggression: number;
};

const profiles: Record<DirectorProfile, ProfileConfig> = {

  CONSERVATIVE: {
    tensionMultiplier: 0.8,
    climaxThreshold: 85,
    cooldownMultiplier: 1.3,
    commentaryAggression: 0.6
  },

  BALANCED: {
    tensionMultiplier: 1,
    climaxThreshold: 75,
    cooldownMultiplier: 1,
    commentaryAggression: 1
  },

  AGGRESSIVE: {
    tensionMultiplier: 1.2,
    climaxThreshold: 65,
    cooldownMultiplier: 0.8,
    commentaryAggression: 1.2
  },

  HYPER_TV: {
    tensionMultiplier: 1.4,
    climaxThreshold: 55,
    cooldownMultiplier: 0.6,
    commentaryAggression: 1.5
  },

  ANALYTICAL: {
    tensionMultiplier: 0.9,
    climaxThreshold: 80,
    cooldownMultiplier: 1.2,
    commentaryAggression: 0.7
  }
};

let currentProfile: DirectorProfile = "BALANCED";

export function setDirectorProfile(profile: DirectorProfile) {
  currentProfile = profile;
}

export function getDirectorProfileConfig() {
  return profiles[currentProfile];
}