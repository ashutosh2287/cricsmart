export type RuntimePressureLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
export type RuntimeMomentumState = "BATTING" | "BOWLING" | "NEUTRAL";
export type RuntimePhaseOfMatch = "POWERPLAY" | "MIDDLE_OVERS" | "DEATH_OVERS";
export type RuntimeCommentaryTone = "neutral" | "dramatic" | "energetic" | "analytical";
export type RuntimeCommentaryImportance = "low" | "medium" | "high";
export type RuntimeCommentaryType =
  | "ball"
  | "wicket"
  | "boundary"
  | "pressure"
  | "momentum"
  | "partnership"
  | "collapse"
  | "turning_point";

export type CommentaryMlContext = {
  innings: number;
  over: number;
  ball: number;
  runs: number;
  wicket: boolean;
  extras: number;
  wicketsLost: number;
  requiredRunRate?: number;
  currentRunRate: number;
  currentScore: number;
  target?: number | null;
  recentRuns: number;
  recentWickets: number;
  dotBallStreak: number;
  partnershipRuns: number;
  partnershipBalls: number;
  boundary: boolean;
  four: boolean;
  six: boolean;
  probabilitySwing?: number;
  pressureLevel?: RuntimePressureLevel;
  momentumState?: RuntimeMomentumState;
  phaseOfMatch?: RuntimePhaseOfMatch;
};

export type CommentaryContextPrediction = {
  commentaryType: RuntimeCommentaryType;
  tone: RuntimeCommentaryTone;
  importance: RuntimeCommentaryImportance;
  templateCategory: string;
  pressureLevel: RuntimePressureLevel;
  momentumState: RuntimeMomentumState;
  scores: {
    pressureScore: number;
    momentumScore: number;
    chasePressure: number;
    partnershipStability: number;
    deathOverIntensity: number;
    battingDominance: number;
    probabilitySwing: number;
  };
};

function clamp(value: number, minimum = 0, maximum = 100): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function phaseOfMatch(context: CommentaryMlContext): RuntimePhaseOfMatch {
  if (context.phaseOfMatch) return context.phaseOfMatch;
  if (context.over < 6) return "POWERPLAY";
  if (context.over >= 16) return "DEATH_OVERS";
  return "MIDDLE_OVERS";
}

function pressureLevelFromScore(score: number): RuntimePressureLevel {
  if (score >= 85) return "EXTREME";
  if (score >= 65) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

function momentumStateFromScore(score: number): RuntimeMomentumState {
  if (score >= 25) return "BATTING";
  if (score <= -25) return "BOWLING";
  return "NEUTRAL";
}

function pressureScore(context: CommentaryMlContext): number {
  if (context.pressureLevel) {
    if (context.pressureLevel === "EXTREME") return 90;
    if (context.pressureLevel === "HIGH") return 70;
    if (context.pressureLevel === "MEDIUM") return 45;
    return 20;
  }

  const chaseGap = Math.max((context.requiredRunRate ?? 0) - context.currentRunRate, 0);
  const targetGap = context.target ? Math.max(context.target - context.currentScore, 0) : 0;
  return clamp(chaseGap * 14 + context.wicketsLost * 4.5 + targetGap / 2.5 + context.over * 1.6);
}

function battingDominance(context: CommentaryMlContext): number {
  return clamp(
    context.currentRunRate * 8.5 + context.recentRuns * 2 - (context.requiredRunRate ?? 0) * 4.5 - context.recentWickets * 15
  );
}

function momentumScore(context: CommentaryMlContext, dominance: number): number {
  if (context.momentumState) {
    if (context.momentumState === "BATTING") return 65;
    if (context.momentumState === "BOWLING") return -65;
    return 0;
  }

  return clamp(
    context.recentRuns * 4 + (context.boundary ? 18 : 0) + dominance * 0.35 - context.recentWickets * 28 - context.dotBallStreak * 5.5 - (context.wicket ? 22 : 0),
    -100,
    100
  );
}

function partnershipStability(context: CommentaryMlContext): number {
  const strikeValue = context.partnershipBalls > 0 ? (context.partnershipRuns * 100) / context.partnershipBalls : 0;
  return clamp(strikeValue * 0.55 + context.partnershipRuns * 0.6 - context.recentWickets * 18);
}

function chooseCommentaryType(
  context: CommentaryMlContext,
  pressure: RuntimePressureLevel,
  momentum: RuntimeMomentumState,
  probability: number
): RuntimeCommentaryType {
  if (context.wicket && (probability >= 45 || pressure === "HIGH" || pressure === "EXTREME")) {
    return "turning_point";
  }
  if (context.recentWickets >= 2 && context.wicketsLost >= 4) {
    return "collapse";
  }
  if (context.wicket) return "wicket";
  if (context.boundary) return "boundary";
  if (context.partnershipRuns >= 40 && context.recentWickets === 0) return "partnership";
  if (pressure === "HIGH" || pressure === "EXTREME") return "pressure";
  if (momentum !== "NEUTRAL") return "momentum";
  return "ball";
}

export function predictCommentaryContext(context: CommentaryMlContext): CommentaryContextPrediction {
  const resolvedPhase = phaseOfMatch(context);
  const resolvedBattingDominance = battingDominance(context);
  const resolvedPressureScore = pressureScore(context);
  const resolvedMomentumScore = momentumScore(context, resolvedBattingDominance);
  const resolvedPressure = pressureLevelFromScore(resolvedPressureScore);
  const resolvedMomentum = momentumStateFromScore(resolvedMomentumScore);
  const resolvedProbabilitySwing =
    context.probabilitySwing ??
    clamp(
      Math.abs(resolvedMomentumScore) * 0.45 +
        resolvedPressureScore * 0.25 +
        (context.wicket ? 20 : 0) +
        (context.boundary ? 10 : 0) +
        context.recentWickets * 6
    );
  const resolvedDeathIntensity = clamp((resolvedPhase === "DEATH_OVERS" ? (context.over - 15) * 12 : 0) + resolvedPressureScore * 0.4);
  const resolvedChasePressure =
    context.target && context.innings === 2
      ? clamp(((context.requiredRunRate ?? 0) - context.currentRunRate) * 12 + context.over * 2.5)
      : 0;
  const resolvedPartnershipStability = partnershipStability(context);

  const commentaryType = chooseCommentaryType(context, resolvedPressure, resolvedMomentum, resolvedProbabilitySwing);
  const tone: RuntimeCommentaryTone =
    commentaryType === "turning_point" || commentaryType === "wicket" || resolvedPressure === "EXTREME"
      ? "dramatic"
      : commentaryType === "boundary" || context.six
        ? "energetic"
        : commentaryType === "pressure" || commentaryType === "partnership" || commentaryType === "collapse"
          ? "analytical"
          : "neutral";
  const importance: RuntimeCommentaryImportance =
    commentaryType === "turning_point" || commentaryType === "wicket" || commentaryType === "collapse" || resolvedPressure === "EXTREME"
      ? "high"
      : commentaryType === "boundary" || commentaryType === "pressure" || commentaryType === "partnership" || commentaryType === "momentum"
        ? "medium"
        : "low";

  return {
    commentaryType,
    tone,
    importance,
    templateCategory: `${commentaryType}:${resolvedPhase.toLowerCase()}:${tone}`,
    pressureLevel: resolvedPressure,
    momentumState: resolvedMomentum,
    scores: {
      pressureScore: resolvedPressureScore,
      momentumScore: resolvedMomentumScore,
      chasePressure: resolvedChasePressure,
      partnershipStability: resolvedPartnershipStability,
      deathOverIntensity: resolvedDeathIntensity,
      battingDominance: resolvedBattingDominance,
      probabilitySwing: resolvedProbabilitySwing,
    },
  };
}
