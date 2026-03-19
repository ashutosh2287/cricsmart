export type PlayerProfile = {
  name: string;

  // Batting
  aggression: number; // 0–1 (higher = more boundaries)
  consistency: number; // 0–1 (higher = fewer dots)
  wicketRisk: number; // 0–1 (higher = more likely out)

  // Bowling
  economy: number; // lower = better
  wicketTaking: number; // higher = more wickets
};

export const playerProfiles: Record<string, PlayerProfile> = {
  "Virat Kohli": {
    name: "Virat Kohli",
    aggression: 0.6,
    consistency: 0.9,
    wicketRisk: 0.2,
    economy: 0,
    wicketTaking: 0,
  },

  "Rohit Sharma": {
    name: "Rohit Sharma",
    aggression: 0.8,
    consistency: 0.7,
    wicketRisk: 0.3,
    economy: 0,
    wicketTaking: 0,
  },

  "Shubman Gill": {
    name: "Shubman Gill",
    aggression: 0.65,
    consistency: 0.85,
    wicketRisk: 0.25,
    economy: 0,
    wicketTaking: 0,
  },

  "Hardik Pandya": {
    name: "Hardik Pandya",
    aggression: 0.85,
    consistency: 0.6,
    wicketRisk: 0.4,
    economy: 0,
    wicketTaking: 0,
  },

  "Pat Cummins": {
    name: "Pat Cummins",
    aggression: 0.3,
    consistency: 0.4,
    wicketRisk: 0.5,
    economy: 0.7,
    wicketTaking: 0.8,
  },

  "Mitchell Starc": {
    name: "Mitchell Starc",
    aggression: 0.2,
    consistency: 0.3,
    wicketRisk: 0.6,
    economy: 0.75,
    wicketTaking: 0.9,
  },
};