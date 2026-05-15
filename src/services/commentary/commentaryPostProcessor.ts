import type { CommentaryContext, CommentaryNarrativeState, CommentaryToneTag } from "./commentaryContextTypes";

type PostProcessInput = {
  text: string;
  matchId: string;
  eventId: string;
  tone: CommentaryToneTag;
  context: CommentaryContext;
  narrative: CommentaryNarrativeState;
};

const bannedWords = ["damn", "hell"];
const recentByMatch: Record<string, string[]> = {};

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function normalizePunctuation(text: string) {
  const compact = text.replace(/\.{2,}/g, ".").replace(/!{2,}/g, "!").replace(/\?{2,}/g, "?").trim();
  if (!compact) return "No significant update on that delivery.";
  return /[.!?]$/.test(compact) ? compact : `${compact}.`;
}

function sanitize(text: string) {
  let blockedTerms: string[] = [];
  const cleaned = bannedWords.reduce((acc, word) => {
    const pattern = new RegExp(`\\b${word}\\b`, "gi");
    if (pattern.test(acc)) blockedTerms = [...blockedTerms, word];
    return acc.replace(pattern, "****");
  }, text);
  return { text: cleaned, blockedTerms };
}

function keepNarrativeConsistency(text: string, narrative: CommentaryNarrativeState, context: CommentaryContext) {
  if (narrative.activeNarratives.includes("pressure mounting") && !/pressure|tension|tight/i.test(text)) {
    return `${text} Pressure remains intense.`;
  }

  if (context.phaseOfMatch === "chaseClimax" && !/chase|finish|target|required/i.test(text)) {
    return `${text} The chase remains alive deep into the finish.`;
  }

  return text;
}

function isDuplicate(matchId: string, text: string) {
  const existing = recentByMatch[matchId] ?? [];
  return existing.includes(text.toLowerCase());
}

function remember(matchId: string, text: string) {
  if (!recentByMatch[matchId]) recentByMatch[matchId] = [];
  recentByMatch[matchId].unshift(text.toLowerCase());
  recentByMatch[matchId] = recentByMatch[matchId].slice(0, 50);
}

export function postProcessCommentaryText(input: PostProcessInput) {
  const normalized = normalizePunctuation(normalizeWhitespace(input.text));
  const consistent = keepNarrativeConsistency(normalized, input.narrative, input.context);
  const { text: safeText, blockedTerms } = sanitize(consistent);

  const duplicate = isDuplicate(input.matchId, safeText);
  const finalText = duplicate
    ? `${safeText.replace(/[.!?]$/, "")}. New phase, same pressure building.`
    : safeText;

  remember(input.matchId, finalText);

  return {
    text: finalText,
    duplicatePrevented: duplicate,
    blockedTerms,
  };
}
