import { BallEvent } from "@/types/ballEvent";

export type TurningPointType =
  | "WICKET"
  | "SIX"
  | "COLLAPSE"
  | "BOUNDARY_BURST";

export type TurningPoint = {
  ballIndex: number;
  type: TurningPointType;
};

export function detectTurningPoints(
  events: BallEvent[]
): TurningPoint[] {

  const markers: TurningPoint[] = [];

  events.forEach((e, index) => {

    if (!e.valid) return;

    /*
    ============================
    WICKET
    ============================
    */

    if (e.wicket) {
      markers.push({
        ballIndex: index,
        type: "WICKET"
      });
    }

    /*
    ============================
    SIX
    ============================
    */

    if (e.type === "SIX") {
      markers.push({
        ballIndex: index,
        type: "SIX"
      });
    }

    /*
    ============================
    COLLAPSE DETECTION
    2 wickets in last 6 balls
    ============================
    */

    if (index >= 5) {

      const last6 = events.slice(index - 5, index + 1);

      const wickets = last6.filter(e => e.wicket).length;

      if (wickets >= 2) {
        markers.push({
          ballIndex: index,
          type: "COLLAPSE"
        });
      }
    }

    /*
    ============================
    BOUNDARY BURST
    3 boundaries in last 6 balls
    ============================
    */

    if (index >= 5) {

      const last6 = events.slice(index - 5, index + 1);

      const boundaries = last6.filter(
        e => e.type === "FOUR" || e.type === "SIX"
      ).length;

      if (boundaries >= 3) {
        markers.push({
          ballIndex: index,
          type: "BOUNDARY_BURST"
        });
      }
    }

  });

  return markers;
}