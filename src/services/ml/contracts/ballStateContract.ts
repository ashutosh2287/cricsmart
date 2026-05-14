import type { BallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";

export type CricSmartBallStateContract = {
  matchId: string;
  source: "historical" | "live" | "mock" | "simulation" | "replay";
  format: "T20" | "ODI" | "TEST";
  innings: number;
  over: number;
  ball: number;
  timestamp: number;
  battingTeam: string;
  bowlingTeam: string;
  batsman: string;
  nonStriker: string;
  bowler: string;
  eventType: BallEvent["type"];
  runs: number;
  totalRuns: number;
  isLegalDelivery: boolean;
  wicket: boolean;
  scoreAfterBall: number;
  wicketsAfterBall: number;
  target: number | null;
};

export function toBallStateContract(
  state: MatchState,
  ballEvent: BallEvent,
  source: CricSmartBallStateContract["source"] = "live"
): CricSmartBallStateContract {
  const innings = state.innings[state.currentInningsIndex];

  return {
    matchId: state.matchId,
    source,
    format: state.format,
    innings: state.currentInningsIndex + 1,
    over: innings.over,
    ball: innings.ball,
    timestamp: ballEvent.timestamp,
    battingTeam: innings.battingTeam ?? "",
    bowlingTeam: innings.bowlingTeam ?? "",
    batsman: ballEvent.batsman,
    nonStriker: ballEvent.nonStriker,
    bowler: ballEvent.bowler,
    eventType: ballEvent.type,
    runs: ballEvent.runs,
    totalRuns: ballEvent.totalRuns,
    isLegalDelivery: ballEvent.isLegalDelivery,
    wicket: ballEvent.wicket,
    scoreAfterBall: innings.runs,
    wicketsAfterBall: innings.wickets,
    target: state.currentInningsIndex === 1 ? (state.innings[0]?.runs ?? 0) + 1 : null,
  };
}
