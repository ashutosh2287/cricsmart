import type { CommentaryContext, CommentaryPlan } from "@/services/commentary/types/commentary.types";
import { runCommentaryClassifier } from "./commentary-classifier";
import { runCommentaryTemplateRanker } from "./commentary-ranker";
import { runCommentaryRetrieval } from "./commentary-retrieval";
import { getCommentaryRuntimeFlags } from "./commentary-runtime-flags";
import { validateRuntimeContract } from "./commentary-runtime-contract";

export type CommentaryMlOrchestratorResult = {
  plan: CommentaryPlan;
  diagnostics: {
    schemaHash: string | null;
    schemaVersion: string | null;
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
    retrieval: {
      candidates: Array<{ id: string; text: string; score: number }>;
      appliedFilters: Record<string, unknown>;
    };
    selectedTemplate: string;
  };
};

export function orchestrateCommentaryMl(input: {
  context: CommentaryContext;
  plannerPlan: CommentaryPlan;
}): CommentaryMlOrchestratorResult {
  const flags = getCommentaryRuntimeFlags();
  const contract = validateRuntimeContract();

  const diagnostics: CommentaryMlOrchestratorResult["diagnostics"] = {
    schemaHash: contract.schemaHash,
    schemaVersion: contract.schemaVersion,
    fallbackReasons: [],
    confidence: { classifier: 0, ranker: 0, retrieval: 0 },
    latencyMs: { classifier: 0, ranker: 0, retrieval: 0 },
    retrieval: {
      candidates: [],
      appliedFilters: {},
    },
    selectedTemplate: input.plannerPlan.templateKey,
  };

  if (flags.mode !== "assist") {
    diagnostics.fallbackReasons.push(flags.mode === "shadow" ? "shadow_mode" : "ml_assist_disabled");
    return { plan: input.plannerPlan, diagnostics };
  }

  if (!contract.valid) {
    diagnostics.fallbackReasons.push(...contract.errors);
    return { plan: input.plannerPlan, diagnostics };
  }

  const plan = { ...input.plannerPlan };

  if (flags.classifierEnabled) {
    const classifier = runCommentaryClassifier({
      context: input.context,
      plan,
    });

    diagnostics.confidence.classifier = classifier.prediction.confidence;
    diagnostics.latencyMs.classifier = classifier.latencyMs;

    if (classifier.latencyMs > flags.latencyBudgetMs.classifier) {
      diagnostics.fallbackReasons.push("classifier_latency_budget_exceeded");
    } else if (classifier.applied) {
      plan.commentaryType = classifier.prediction.commentaryType;
      plan.tone = classifier.prediction.tone;
      plan.importance = classifier.prediction.importance;
    } else {
      diagnostics.fallbackReasons.push(...classifier.fallbackReasons);
    }
  } else {
    diagnostics.fallbackReasons.push("classifier_flag_disabled");
  }

  if (flags.rankerEnabled) {
    const ranker = runCommentaryTemplateRanker({ context: input.context, plan });
    diagnostics.confidence.ranker = ranker.confidence;
    diagnostics.latencyMs.ranker = ranker.latencyMs;

    if (ranker.latencyMs > flags.latencyBudgetMs.ranking) {
      diagnostics.fallbackReasons.push("ranker_latency_budget_exceeded");
    } else if (ranker.applied) {
      plan.templateKey = ranker.selectedTemplate;
    } else {
      diagnostics.fallbackReasons.push(...ranker.fallbackReasons);
    }
  } else {
    diagnostics.fallbackReasons.push("template_ranker_flag_disabled");
  }

  if (flags.retrievalEnabled) {
    const retrieval = runCommentaryRetrieval({
      context: input.context,
      plan,
      timeoutMs: flags.latencyBudgetMs.retrieval,
    });

    diagnostics.confidence.retrieval = retrieval.confidence;
    diagnostics.latencyMs.retrieval = retrieval.latencyMs;
    diagnostics.retrieval = {
      candidates: retrieval.candidates,
      appliedFilters: retrieval.appliedFilters,
    };

    if (retrieval.latencyMs > flags.latencyBudgetMs.retrieval) {
      diagnostics.fallbackReasons.push("retrieval_latency_budget_exceeded");
    }
    if (!retrieval.applied) {
      diagnostics.fallbackReasons.push(...retrieval.fallbackReasons);
    }
  } else {
    diagnostics.fallbackReasons.push("retrieval_flag_disabled");
  }

  diagnostics.selectedTemplate = plan.templateKey;

  return {
    plan,
    diagnostics,
  };
}
