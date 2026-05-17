export const MAIN_TABS = [
  "overview",
  "live",
  "analysis",
  "overs",
  "squads",
  "scorecard",
  "admin",
] as const;

export type MainTab = (typeof MAIN_TABS)[number];

export function isMainTab(value: string): value is MainTab {
  return MAIN_TABS.includes(value as MainTab);
}

export function resolveRequestedTab(tab: string | null): MainTab {
  if (tab === "timeline") return "overs";
  if (!tab || !isMainTab(tab)) return "overview";
  return tab;
}
