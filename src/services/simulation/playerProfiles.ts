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
  // ── India ──
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
    economy: 0.65,
    wicketTaking: 0.55,
  },
  "Ravindra Jadeja": {
    name: "Ravindra Jadeja",
    aggression: 0.55,
    consistency: 0.75,
    wicketRisk: 0.3,
    economy: 0.6,
    wicketTaking: 0.6,
  },
  "KL Rahul": {
    name: "KL Rahul",
    aggression: 0.6,
    consistency: 0.8,
    wicketRisk: 0.25,
    economy: 0,
    wicketTaking: 0,
  },
  "Suryakumar Yadav": {
    name: "Suryakumar Yadav",
    aggression: 0.9,
    consistency: 0.65,
    wicketRisk: 0.35,
    economy: 0,
    wicketTaking: 0,
  },
  "Jasprit Bumrah": {
    name: "Jasprit Bumrah",
    aggression: 0.15,
    consistency: 0.35,
    wicketRisk: 0.7,
    economy: 0.85,
    wicketTaking: 0.95,
  },
  "Mohammed Siraj": {
    name: "Mohammed Siraj",
    aggression: 0.2,
    consistency: 0.3,
    wicketRisk: 0.6,
    economy: 0.7,
    wicketTaking: 0.8,
  },
  "Yuzvendra Chahal": {
    name: "Yuzvendra Chahal",
    aggression: 0.15,
    consistency: 0.3,
    wicketRisk: 0.5,
    economy: 0.65,
    wicketTaking: 0.75,
  },
  "Mohammed Shami": {
    name: "Mohammed Shami",
    aggression: 0.2,
    consistency: 0.35,
    wicketRisk: 0.55,
    economy: 0.72,
    wicketTaking: 0.82,
  },

  // ── Australia ──
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
  "David Warner": {
    name: "David Warner",
    aggression: 0.85,
    consistency: 0.75,
    wicketRisk: 0.3,
    economy: 0,
    wicketTaking: 0,
  },
  "Steve Smith": {
    name: "Steve Smith",
    aggression: 0.55,
    consistency: 0.88,
    wicketRisk: 0.2,
    economy: 0,
    wicketTaking: 0,
  },
  "Marnus Labuschagne": {
    name: "Marnus Labuschagne",
    aggression: 0.5,
    consistency: 0.85,
    wicketRisk: 0.2,
    economy: 0,
    wicketTaking: 0,
  },
  "Glenn Maxwell": {
    name: "Glenn Maxwell",
    aggression: 0.95,
    consistency: 0.5,
    wicketRisk: 0.45,
    economy: 0.65,
    wicketTaking: 0.55,
  },
  "Travis Head": {
    name: "Travis Head",
    aggression: 0.85,
    consistency: 0.6,
    wicketRisk: 0.35,
    economy: 0,
    wicketTaking: 0,
  },
  "Josh Inglis": {
    name: "Josh Inglis",
    aggression: 0.7,
    consistency: 0.7,
    wicketRisk: 0.3,
    economy: 0,
    wicketTaking: 0,
  },
  "Josh Hazlewood": {
    name: "Josh Hazlewood",
    aggression: 0.15,
    consistency: 0.3,
    wicketRisk: 0.65,
    economy: 0.8,
    wicketTaking: 0.85,
  },
  "Adam Zampa": {
    name: "Adam Zampa",
    aggression: 0.1,
    consistency: 0.35,
    wicketRisk: 0.45,
    economy: 0.7,
    wicketTaking: 0.78,
  },
  "Marcus Stoinis": {
    name: "Marcus Stoinis",
    aggression: 0.8,
    consistency: 0.55,
    wicketRisk: 0.4,
    economy: 0.6,
    wicketTaking: 0.5,
  },

  // ── England ──
  "Jos Buttler": {
    name: "Jos Buttler",
    aggression: 0.85,
    consistency: 0.75,
    wicketRisk: 0.3,
    economy: 0,
    wicketTaking: 0,
  },
  "Ben Stokes": {
    name: "Ben Stokes",
    aggression: 0.75,
    consistency: 0.7,
    wicketRisk: 0.35,
    economy: 0.65,
    wicketTaking: 0.65,
  },
  "Joe Root": {
    name: "Joe Root",
    aggression: 0.5,
    consistency: 0.9,
    wicketRisk: 0.15,
    economy: 0,
    wicketTaking: 0,
  },
  "Jofra Archer": {
    name: "Jofra Archer",
    aggression: 0.2,
    consistency: 0.35,
    wicketRisk: 0.55,
    economy: 0.75,
    wicketTaking: 0.82,
  },

  // ── New Zealand ──
  "Kane Williamson": {
    name: "Kane Williamson",
    aggression: 0.5,
    consistency: 0.92,
    wicketRisk: 0.15,
    economy: 0,
    wicketTaking: 0,
  },
  "Trent Boult": {
    name: "Trent Boult",
    aggression: 0.15,
    consistency: 0.35,
    wicketRisk: 0.6,
    economy: 0.78,
    wicketTaking: 0.85,
  },

  // ── South Africa ──
  "Quinton de Kock": {
    name: "Quinton de Kock",
    aggression: 0.8,
    consistency: 0.7,
    wicketRisk: 0.3,
    economy: 0,
    wicketTaking: 0,
  },
  "Kagiso Rabada": {
    name: "Kagiso Rabada",
    aggression: 0.2,
    consistency: 0.35,
    wicketRisk: 0.6,
    economy: 0.75,
    wicketTaking: 0.88,
  },

  // ── Pakistan ──
  "Babar Azam": {
    name: "Babar Azam",
    aggression: 0.6,
    consistency: 0.88,
    wicketRisk: 0.2,
    economy: 0,
    wicketTaking: 0,
  },
  "Shaheen Afridi": {
    name: "Shaheen Afridi",
    aggression: 0.15,
    consistency: 0.3,
    wicketRisk: 0.65,
    economy: 0.78,
    wicketTaking: 0.9,
  },
};
