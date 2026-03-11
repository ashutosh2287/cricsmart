import { BallEvent } from "@/types/ballEvent";

export type TurningPoint = {
  ballIndex: number;
  type: "WICKET" | "SIX";
};

export function detectTurningPoints(
  events: BallEvent[]
): TurningPoint[] {

  const markers: TurningPoint[] = [];

  events.forEach((e, index) => {

    if (!e.valid) return;

    if (e.wicket) {
      markers.push({
        ballIndex: index,
        type: "WICKET"
      });
    }

    if (e.type === "SIX") {
      markers.push({
        ballIndex: index,
        type: "SIX"
      });
    }

  });

  return markers;
}