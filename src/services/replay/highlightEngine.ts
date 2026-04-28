import { BallEvent } from "@/types/ballEvent";

export type Highlight = {
  index: number;
  type: "WICKET" | "FOUR" | "SIX";
};

export function extractHighlights(events: BallEvent[]): Highlight[] {
  const highlights: Highlight[] = [];

  events.forEach((e, i) => {
    // ✅ FIXED: use correct property
    if (e.wicket) {
      highlights.push({ index: i, type: "WICKET" });
    } else if (e.runs === 6) {
      highlights.push({ index: i, type: "SIX" });
    } else if (e.runs === 4) {
      highlights.push({ index: i, type: "FOUR" });
    }
  });

  return highlights;
}