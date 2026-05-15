import {
  predictCommentaryContext,
  type CommentaryContextPrediction,
  type CommentaryMlContext,
} from "./commentary-predictor";
import {
  retrieveSimilarCommentary,
  type CommentaryRetrievalExample,
  type RetrievedCommentaryExample,
} from "./commentary-retrieval";

export type CommentaryTemplateCandidate = {
  id: string;
  templateCategory: string;
  commentaryType: CommentaryContextPrediction["commentaryType"];
  tone: CommentaryContextPrediction["tone"];
  importance: CommentaryContextPrediction["importance"];
  text: string;
};

export type RankedCommentaryTemplate = {
  candidate: CommentaryTemplateCandidate;
  score: number;
  retrievalMatches: RetrievedCommentaryExample[];
};

function scoreTemplate(
  candidate: CommentaryTemplateCandidate,
  prediction: CommentaryContextPrediction,
  retrievalMatches: RetrievedCommentaryExample[]
): number {
  let score = 0;
  if (candidate.templateCategory === prediction.templateCategory) score += 5;
  if (candidate.commentaryType === prediction.commentaryType) score += 3;
  if (candidate.tone === prediction.tone) score += 2;
  if (candidate.importance === prediction.importance) score += 1.5;
  score += retrievalMatches
    .filter((match) => match.commentaryType === candidate.commentaryType || match.tone === candidate.tone)
    .reduce((total, match) => total + match.score * 0.4, 0);
  return Number(score.toFixed(4));
}

export function rankCommentaryTemplates(options: {
  context: CommentaryMlContext;
  templates: CommentaryTemplateCandidate[];
  prediction?: CommentaryContextPrediction;
  retrievalExamples?: CommentaryRetrievalExample[];
  retrievalLimit?: number;
}): RankedCommentaryTemplate[] {
  const prediction = options.prediction ?? predictCommentaryContext(options.context);
  const retrievalMatches = retrieveSimilarCommentary({
    context: options.context,
    prediction,
    examples: options.retrievalExamples,
    limit: options.retrievalLimit ?? 3,
  });

  return options.templates
    .map((candidate) => ({
      candidate,
      score: scoreTemplate(candidate, prediction, retrievalMatches),
      retrievalMatches,
    }))
    .sort((left, right) => right.score - left.score);
}

export function chooseBestCommentaryTemplate(options: {
  context: CommentaryMlContext;
  templates: CommentaryTemplateCandidate[];
  prediction?: CommentaryContextPrediction;
  retrievalExamples?: CommentaryRetrievalExample[];
}): RankedCommentaryTemplate | null {
  return rankCommentaryTemplates(options)[0] ?? null;
}
