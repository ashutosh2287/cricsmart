export type AnalyticsSignal =
  | {
      type: "MOMENTUM_UPDATE"
      value: number
      eventId: string
      branchId?: string
    }
  | {
      type: "PRESSURE_SPIKE"
      value: number
      eventId: string
      branchId?: string
    }

export type HighlightSignal =
  | {
      type: "HIGHLIGHT_DETECTED"
      subtype: "SIX" | "WICKET"
      eventId: string
      branchId?: string
    }

export type DirectorSignal =
  | AnalyticsSignal
  | HighlightSignal