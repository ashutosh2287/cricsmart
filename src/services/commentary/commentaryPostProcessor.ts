export function postProcessCommentaryText(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "No significant update on that delivery.";
  if (/[.!?]$/.test(compact)) return compact;
  return `${compact}.`;
}
