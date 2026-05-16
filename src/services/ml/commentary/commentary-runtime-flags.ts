import { getCommentaryMlAssistMode } from "@/config/commentaryMlMode";
import {
  COMMENTARY_ML_LATENCY_BUDGET_MS,
  isCommentaryClassifierEnabled,
  isCommentaryRetrievalEnabled,
  isCommentaryTemplateRankerEnabled,
} from "@/config/commentaryMlRuntimeFlags";

export type CommentaryRuntimeStage =
  | "stage1_deterministic_only"
  | "stage2_classifier"
  | "stage3_ranker"
  | "stage4_retrieval"
  | "stage5_full_stack";

export function getCommentaryRuntimeFlags() {
  const classifierEnabled = isCommentaryClassifierEnabled();
  const rankerEnabled = isCommentaryTemplateRankerEnabled();
  const retrievalEnabled = isCommentaryRetrievalEnabled();

  const stage: CommentaryRuntimeStage = !classifierEnabled && !rankerEnabled && !retrievalEnabled
    ? "stage1_deterministic_only"
    : classifierEnabled && !rankerEnabled && !retrievalEnabled
      ? "stage2_classifier"
      : classifierEnabled && rankerEnabled && !retrievalEnabled
        ? "stage3_ranker"
        : classifierEnabled && rankerEnabled && retrievalEnabled
          ? "stage5_full_stack"
          : "stage4_retrieval";

  return {
    mode: getCommentaryMlAssistMode(),
    stage,
    classifierEnabled,
    rankerEnabled,
    retrievalEnabled,
    latencyBudgetMs: {
      classifier: COMMENTARY_ML_LATENCY_BUDGET_MS.classifier,
      ranking: COMMENTARY_ML_LATENCY_BUDGET_MS.ranking,
      retrieval: COMMENTARY_ML_LATENCY_BUDGET_MS.retrieval,
    },
  };
}
