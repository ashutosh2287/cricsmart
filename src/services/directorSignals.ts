export type AnalyticsSignal =
  | {
      type: "MOMENTUM_UPDATE"
      value: number
      eventId: string
    }
  | {
      type: "PRESSURE_SPIKE"
      value: number
      eventId: string
    }
    export type HighlightSignal =
  | {
      type: "HIGHLIGHT_DETECTED"
      subtype: "SIX" | "WICKET"
      eventId: string
    }
    export type DirectorSignal =
  | AnalyticsSignal
  | HighlightSignal