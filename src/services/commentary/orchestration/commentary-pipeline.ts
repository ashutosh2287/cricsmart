import type { BallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";
import { calculatePressureLevel } from "../engines/pressure-engine";
import { calculateMomentum } from "../engines/momentum-engine";
import { calculateCurrentPartnership, evaluatePartnership } from "../engines/partnership-engine";
import { detectCollapseRisk } from "../engines/collapse-engine";
import { detectTurningPoint } from "../engines/turning-point-engine";
import { buildCommentaryPlan } from "../narrative/commentary-planner";
import { createInitialNarrativeState, updateNarrativeState } from "../narrative/narrative-state";
import { determineTone } from "../narrative/tone-engine";
import { generateCommentaryEvent } from "../generators/commentary-generator";
import { orchestrateCommentaryMl } from "@/services/ml/commentary/commentary-ml-orchestrator";
import { appendCommentaryAudit } from "../audit/commentaryAuditLog";
import { persistCommentaryContextSnapshot } from "../audit/contextSnapshotPersistence";
import type {
  CommentaryContext,
  CommentaryEvent,
  CommentaryPlan,
  CommentaryProbabilityState,
  NarrativeState,
  OverPhase,
} from "../types/commentary.types";

type PipelineInput = {
  matchId: string;
  branchId: string;
  ballEvent: BallEvent;
  state: MatchState;
  probabilityState?: CommentaryProbabilityState;
};

type PipelineResult = {
  primaryEvent: CommentaryEvent;
  emittedEvents: CommentaryEvent[];
  narrativeState: NarrativeState;
};

type MlAssistDiagnostics = {
  fallbackReasons: string[];
  confidence: {
    classifier: number;
    ranker: number;
    retrieval: number;
  };
  latencyMs: {
    classifier: number;
    ranker: number;
    retrieval: number;
  };
  retrievalCandidates: Array<{ id: string; text: string; score: number }>;
  retrievalFilters: Record<string, unknown>;
  selectedTemplate: string;
  schemaHash: string | null;
  schemaVersion: string | null;
};

const narrativeStateStore = new Map<string, NarrativeState>();

function getStoreKey(matchId: string, branchId: string) {
  return `${matchId}:${branchId}`;
}

function getBallRuns(event: BallEvent) {
  return event.totalRuns ?? event.runs ?? 0;
}

function flattenCurrentInnings(state: MatchState): BallEvent[] {
  const innings = state.innings[state.currentInningsIndex];
  if (!innings?.overs) return [];

  return Object.keys(innings.overs)
    .map(Number)
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right)
    .flatMap((over) => innings.overs[over] ?? []);
}

function detectOverPhase(over: number, totalOvers: number | null): OverPhase {
  const maxOvers = totalOvers ?? 20;
  const powerplayLimit = maxOvers <= 20 ? 6 : Math.max(6, Math.ceil(maxOvers * 0.2));
  const deathStart = maxOvers <= 20 ? Math.max(15, maxOvers - 5) : Math.max(40, maxOvers - 10);

  if (over < powerplayLimit) return "POWERPLAY";
  if (over >= deathStart) return "DEATH_OVERS";
  return "MIDDLE_OVERS";
}

function calculateDotBallStreak(events: BallEvent[]) {
  let streak = 0;

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event?.isLegalDelivery || event.wicket || getBallRuns(event) !== 0) {
      break;
    }
    streak += 1;
  }

  return streak;
}

function calculateWicketsInCluster(legalEvents: BallEvent[]) {
  return legalEvents.slice(-12).filter((event) => event.wicket).length;
}

function buildCommentaryContext(input: PipelineInput): CommentaryContext {
  const inningsIndex = input.state.currentInningsIndex;
  const innings = input.state.innings[inningsIndex];
  const events = flattenCurrentInnings(input.state);
  const legalEvents = events.filter((event) => event.isLegalDelivery);
  const recentLegal = legalEvents.slice(-6);
  const previousLegal = legalEvents.slice(-12, -6);
  const summaryOver = input.ballEvent.isLegalDelivery && innings.ball === 0 ? Math.max(0, innings.over - 1) : innings.over;
  const overEvents = innings?.overs?.[summaryOver] ?? [];
  const target = inningsIndex > 0 ? (input.state.innings[0]?.runs ?? 0) + 1 : null;
  const ballsBowled = innings.over * 6 + innings.ball;
  const totalBalls = (input.state.configOvers ?? 20) * 6;
  const ballsRemaining = Math.max(0, totalBalls - ballsBowled);
  const currentRunRate = ballsBowled > 0 ? (innings.runs / ballsBowled) * 6 : 0;
  const requiredRunRate = target && ballsRemaining > 0 ? Math.max(0, ((target - innings.runs) / ballsRemaining) * 6) : 0;
  const currentPartnership = calculateCurrentPartnership(events);
  const recentRuns = recentLegal.reduce((sum, event) => sum + getBallRuns(event), 0);
  const recentWickets = recentLegal.filter((event) => event.wicket).length;
  const recentBoundaryCount = recentLegal.filter((event) => (event.runs ?? 0) === 4 || (event.runs ?? 0) === 6).length;
  const recentAverage = recentLegal.length > 0 ? recentRuns / recentLegal.length : 0;
  const previousRuns = previousLegal.reduce((sum, event) => sum + getBallRuns(event), 0);
  const previousAverage = previousLegal.length > 0 ? previousRuns / previousLegal.length : 0;
  const recentOverRuns = overEvents.reduce((sum, event) => sum + getBallRuns(event), 0);
  const wicketsInOver = overEvents.filter((event) => event.wicket).length;
  const battingControl = Math.max(0, Math.min(100, recentRuns * 5 + recentBoundaryCount * 8 - recentWickets * 20 - calculateDotBallStreak(legalEvents) * 5 + 45));
  const chaseComplexity = Math.max(
    0,
    Math.min(
      100,
      requiredRunRate * 4 + Math.max(0, requiredRunRate - currentRunRate) * 6 + innings.wickets * 3,
    ),
  );

  return {
    matchId: input.matchId,
    branchId: input.branchId,
    eventId: input.ballEvent.id,
    innings: inningsIndex + 1,
    over: innings.over,
    ball: innings.ball,
    battingTeam: innings.battingTeam ?? "",
    bowlingTeam: innings.bowlingTeam ?? "",
    batter: input.ballEvent.batsman,
    nonStriker: input.ballEvent.nonStriker,
    bowler: input.ballEvent.bowler,
    dismissedPlayer: input.ballEvent.type === "WICKET" ? input.ballEvent.dismissedBatsman : undefined,
    eventType: input.ballEvent.type,
    runsThisBall: getBallRuns(input.ballEvent),
    battingScore: innings.runs,
    wickets: innings.wickets,
    target,
    ballsRemaining,
    wicketsRemaining: Math.max(0, 10 - innings.wickets),
    requiredRunRate,
    currentRunRate,
    dotBallStreak: calculateDotBallStreak(legalEvents),
    recentRuns,
    recentWickets,
    recentBoundaryCount,
    currentPartnershipRuns: currentPartnership.runs,
    currentPartnershipBalls: currentPartnership.balls,
    wicketsInCluster: calculateWicketsInCluster(legalEvents),
    recentOverRuns,
    wicketsInOver,
    scoringAcceleration: recentAverage - previousAverage,
    overPhase: detectOverPhase(innings.over, input.state.configOvers),
    battingControl,
    chaseComplexity,
    probabilitySwing: Math.abs(
      (input.probabilityState?.currentWinProbability ?? 0) -
        (input.probabilityState?.previousWinProbability ?? 0),
    ),
    isOverComplete: input.ballEvent.isLegalDelivery && innings.ball === 0,
  };
}

function dedupeEventPlans(pairs: Array<{ event: CommentaryEvent; plan: CommentaryPlan }>) {
  const seen = new Set<string>();
  return pairs.filter((pair) => {
    const key = `${pair.event.eventId}:${pair.event.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyMlAssistToPlan(input: { context: CommentaryContext; plan: CommentaryPlan }): {
  plan: CommentaryPlan;
  diagnostics: MlAssistDiagnostics;
} {
  try {
    const result = orchestrateCommentaryMl({
      context: input.context,
      plannerPlan: input.plan,
    });

    return {
      plan: result.plan,
      diagnostics: {
        fallbackReasons: result.diagnostics.fallbackReasons,
        confidence: result.diagnostics.confidence,
        latencyMs: result.diagnostics.latencyMs,
        retrievalCandidates: result.diagnostics.retrieval.candidates,
        retrievalFilters: result.diagnostics.retrieval.appliedFilters,
        selectedTemplate: result.diagnostics.selectedTemplate,
        schemaHash: result.diagnostics.schemaHash,
        schemaVersion: result.diagnostics.schemaVersion,
      },
    };
  } catch {
    return {
      plan: input.plan,
      diagnostics: {
        fallbackReasons: ["ml_runtime_exception"],
        confidence: { classifier: 0, ranker: 0, retrieval: 0 },
        latencyMs: { classifier: 0, ranker: 0, retrieval: 0 },
        retrievalCandidates: [],
        retrievalFilters: {},
        selectedTemplate: input.plan.templateKey,
        schemaHash: null,
        schemaVersion: null,
      },
    };
  }
}

export function processCommentaryPipeline(input: PipelineInput): PipelineResult {
  const storeKey = getStoreKey(input.matchId, input.branchId);
  const previousState = narrativeStateStore.get(storeKey) ?? createInitialNarrativeState();
  const context = buildCommentaryContext(input);
  const pressureLevel = calculatePressureLevel({
    requiredRunRate: context.requiredRunRate,
    currentRunRate: context.currentRunRate,
    wicketsRemaining: context.wicketsRemaining,
    ballsRemaining: context.ballsRemaining,
    dotBallStreak: context.dotBallStreak,
    overPhase: context.overPhase,
  });
  const momentum = calculateMomentum({
    recentRuns: context.recentRuns,
    recentWickets: context.recentWickets,
    recentBoundaryCount: context.recentBoundaryCount,
    scoringAcceleration: context.scoringAcceleration,
    dotBallStreak: context.dotBallStreak,
    previousMomentumTeam: previousState.momentumTeam,
    battingTeam: context.battingTeam,
    bowlingTeam: context.bowlingTeam,
  });
  const partnership = evaluatePartnership(
    {
      runs: context.currentPartnershipRuns,
      balls: context.currentPartnershipBalls,
      boundaries: context.recentBoundaryCount,
    },
    input.ballEvent,
  );
  const collapseRisk = detectCollapseRisk({
    wicketsInCluster: context.wicketsInCluster,
    recentRuns: context.recentRuns,
    pressureLevel,
    battingControl: context.battingControl,
    recentWickets: context.recentWickets,
  });
  const turningPointDetected = detectTurningPoint({
    wicketEvent: input.ballEvent.type === "WICKET",
    momentumSwing: momentum.swingDetected,
    probabilitySwing: context.probabilitySwing,
    partnershipBreak: partnership.broken,
    overImpact: context.recentOverRuns + context.wicketsInOver * 6,
    pressureLevel,
  });

  const narrativeState = updateNarrativeState({
    previousState,
    ballEvent: input.ballEvent,
    context,
    probabilityState: input.probabilityState,
    pressureLevel,
    momentumState: momentum.state,
    momentumTeam: momentum.momentumTeam,
    collapseRisk,
    turningPointDetected,
  });

  narrativeStateStore.set(storeKey, narrativeState);

  const primaryPlan = buildCommentaryPlan({
    ballEvent: input.ballEvent,
    context,
    narrativeState,
    pressureLevel,
    momentumState: momentum.state,
    collapseRisk,
    turningPointDetected,
    momentumShift: momentum.swingDetected,
    partnershipStrength: partnership.strength,
  });
  primaryPlan.tone = determineTone({
    ballEvent: input.ballEvent,
    context,
    narrativeState,
    plan: primaryPlan,
    pressureLevel,
    momentumState: momentum.state,
    turningPointDetected,
  });
  const mlAssist = applyMlAssistToPlan({ context, plan: primaryPlan });
  const finalPrimaryPlan = mlAssist.plan;

  const primaryEvent = generateCommentaryEvent({
    matchId: input.matchId,
    ballEvent: input.ballEvent,
    context,
    plan: finalPrimaryPlan,
    narrativeState,
    mlMetadata: {
      retrieval: {
        candidates: mlAssist.diagnostics.retrievalCandidates,
        appliedFilters: mlAssist.diagnostics.retrievalFilters,
      },
      confidence: mlAssist.diagnostics.confidence,
      fallbackReasons: mlAssist.diagnostics.fallbackReasons,
      latencyMs: mlAssist.diagnostics.latencyMs,
      schemaHash: mlAssist.diagnostics.schemaHash,
      schemaVersion: mlAssist.diagnostics.schemaVersion,
    },
  });

  const eventPlanPairs: Array<{ event: CommentaryEvent; plan: CommentaryPlan }> = [{ event: primaryEvent, plan: finalPrimaryPlan }];

  if (context.isOverComplete) {
    const overPlan = buildCommentaryPlan({
      ballEvent: input.ballEvent,
      context,
      narrativeState,
      pressureLevel,
      momentumState: momentum.state,
      collapseRisk,
      turningPointDetected,
      momentumShift: momentum.swingDetected,
      partnershipStrength: partnership.strength,
      commentaryType: "over-summary",
    });
    overPlan.tone = determineTone({
      ballEvent: input.ballEvent,
      context,
      narrativeState,
      plan: overPlan,
      pressureLevel,
      momentumState: momentum.state,
      turningPointDetected,
    });
    eventPlanPairs.push({
      event: generateCommentaryEvent({
        matchId: input.matchId,
        ballEvent: input.ballEvent,
        context,
        plan: overPlan,
        narrativeState,
        mlMetadata: {
          retrieval: {
            candidates: mlAssist.diagnostics.retrievalCandidates,
            appliedFilters: mlAssist.diagnostics.retrievalFilters,
          },
          confidence: mlAssist.diagnostics.confidence,
          fallbackReasons: mlAssist.diagnostics.fallbackReasons,
          latencyMs: mlAssist.diagnostics.latencyMs,
          schemaHash: mlAssist.diagnostics.schemaHash,
          schemaVersion: mlAssist.diagnostics.schemaVersion,
        },
      }),
      plan: overPlan,
    });
  }

  if (
    context.target &&
    (pressureLevel === "HIGH" || pressureLevel === "EXTREME") &&
    (context.isOverComplete || input.ballEvent.type === "WICKET")
  ) {
    const pressurePlan = buildCommentaryPlan({
      ballEvent: input.ballEvent,
      context,
      narrativeState,
      pressureLevel,
      momentumState: momentum.state,
      collapseRisk,
      turningPointDetected,
      momentumShift: momentum.swingDetected,
      partnershipStrength: partnership.strength,
      commentaryType: "pressure-summary",
    });
    pressurePlan.tone = determineTone({
      ballEvent: input.ballEvent,
      context,
      narrativeState,
      plan: pressurePlan,
      pressureLevel,
      momentumState: momentum.state,
      turningPointDetected,
    });
    eventPlanPairs.push({
      event: generateCommentaryEvent({
        matchId: input.matchId,
        ballEvent: input.ballEvent,
        context,
        plan: pressurePlan,
        narrativeState,
        mlMetadata: {
          retrieval: {
            candidates: mlAssist.diagnostics.retrievalCandidates,
            appliedFilters: mlAssist.diagnostics.retrievalFilters,
          },
          confidence: mlAssist.diagnostics.confidence,
          fallbackReasons: mlAssist.diagnostics.fallbackReasons,
          latencyMs: mlAssist.diagnostics.latencyMs,
          schemaHash: mlAssist.diagnostics.schemaHash,
          schemaVersion: mlAssist.diagnostics.schemaVersion,
        },
      }),
      plan: pressurePlan,
    });
  }

  if (momentum.swingDetected || (context.isOverComplete && momentum.state !== "NEUTRAL")) {
    const momentumPlan = buildCommentaryPlan({
      ballEvent: input.ballEvent,
      context,
      narrativeState,
      pressureLevel,
      momentumState: momentum.state,
      collapseRisk,
      turningPointDetected,
      momentumShift: momentum.swingDetected,
      partnershipStrength: partnership.strength,
      commentaryType: "momentum-summary",
    });
    momentumPlan.tone = determineTone({
      ballEvent: input.ballEvent,
      context,
      narrativeState,
      plan: momentumPlan,
      pressureLevel,
      momentumState: momentum.state,
      turningPointDetected,
    });
    eventPlanPairs.push({
      event: generateCommentaryEvent({
        matchId: input.matchId,
        ballEvent: input.ballEvent,
        context,
        plan: momentumPlan,
        narrativeState,
        mlMetadata: {
          retrieval: {
            candidates: mlAssist.diagnostics.retrievalCandidates,
            appliedFilters: mlAssist.diagnostics.retrievalFilters,
          },
          confidence: mlAssist.diagnostics.confidence,
          fallbackReasons: mlAssist.diagnostics.fallbackReasons,
          latencyMs: mlAssist.diagnostics.latencyMs,
          schemaHash: mlAssist.diagnostics.schemaHash,
          schemaVersion: mlAssist.diagnostics.schemaVersion,
        },
      }),
      plan: momentumPlan,
    });
  }

  if (turningPointDetected) {
    const turningPlan = buildCommentaryPlan({
      ballEvent: input.ballEvent,
      context,
      narrativeState,
      pressureLevel,
      momentumState: momentum.state,
      collapseRisk,
      turningPointDetected,
      momentumShift: momentum.swingDetected,
      partnershipStrength: partnership.strength,
      commentaryType: "turning-point",
    });
    turningPlan.tone = determineTone({
      ballEvent: input.ballEvent,
      context,
      narrativeState,
      plan: turningPlan,
      pressureLevel,
      momentumState: momentum.state,
      turningPointDetected,
    });
    eventPlanPairs.push({
      event: generateCommentaryEvent({
        matchId: input.matchId,
        ballEvent: input.ballEvent,
        context,
        plan: turningPlan,
        narrativeState,
        mlMetadata: {
          retrieval: {
            candidates: mlAssist.diagnostics.retrievalCandidates,
            appliedFilters: mlAssist.diagnostics.retrievalFilters,
          },
          confidence: mlAssist.diagnostics.confidence,
          fallbackReasons: mlAssist.diagnostics.fallbackReasons,
          latencyMs: mlAssist.diagnostics.latencyMs,
          schemaHash: mlAssist.diagnostics.schemaHash,
          schemaVersion: mlAssist.diagnostics.schemaVersion,
        },
      }),
      plan: turningPlan,
    });
  }

  const deduped = dedupeEventPlans(eventPlanPairs);

  for (const pair of deduped) {
    persistCommentaryContextSnapshot({
      matchId: input.matchId,
      branchId: input.branchId,
      context,
      narrativeState,
      plan: pair.plan,
      retrievalCandidates: mlAssist.diagnostics.retrievalCandidates,
      event: pair.event,
    });
  }

  appendCommentaryAudit({
    timestamp: Date.now(),
    matchId: input.matchId,
    branchId: input.branchId,
    eventId: input.ballEvent.id,
    modelDecisions: {
      plannerTemplate: primaryPlan.templateKey,
      selectedTemplate: mlAssist.diagnostics.selectedTemplate,
      finalCommentaryType: finalPrimaryPlan.commentaryType,
    },
    confidenceScores: {
      classifier: mlAssist.diagnostics.confidence.classifier,
      ranker: mlAssist.diagnostics.confidence.ranker,
      retrieval: mlAssist.diagnostics.confidence.retrieval,
    },
    latencyMs: mlAssist.diagnostics.latencyMs,
    retrievalMatches: mlAssist.diagnostics.retrievalCandidates,
    retrievalFilters: mlAssist.diagnostics.retrievalFilters,
    selectedTemplate: finalPrimaryPlan.templateKey,
    fallbackTriggers: mlAssist.diagnostics.fallbackReasons,
    schemaHash: mlAssist.diagnostics.schemaHash,
    schemaVersion: mlAssist.diagnostics.schemaVersion,
    source: input.ballEvent.eventSource ?? "MANUAL",
  });

  return {
    primaryEvent,
    emittedEvents: deduped.map((item) => item.event),
    narrativeState,
  };
}

export function resetCommentaryPipelineState(matchId?: string) {
  if (!matchId) {
    narrativeStateStore.clear();
    return;
  }

  for (const key of Array.from(narrativeStateStore.keys())) {
    if (key.startsWith(`${matchId}:`)) {
      narrativeStateStore.delete(key);
    }
  }
}
