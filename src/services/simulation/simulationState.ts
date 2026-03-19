export type SimulationState = {
  over: number;
  ball: number;

  totalRuns: number;
  wickets: number;

  striker: string;
  nonStriker: string;
  bowler: string;

  battingOrder: string[];
  nextBatsmanIndex: number;

  // 🔥 NEW
  bowlingOrder: string[];
  currentBowlerIndex: number;

  // 🔥 TARGET MODE
  target?: number;

  phase: "POWERPLAY" | "MIDDLE" | "DEATH";
};