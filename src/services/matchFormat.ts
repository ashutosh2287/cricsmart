export type MatchFormat =
  | "T20"
  | "ODI"
  | "TEST";

export type MatchConfig = {
  format: MatchFormat;
  oversPerInnings: number | null; // null for Test
  inningsPerSide: number;
};

export function getMatchConfig(format: MatchFormat): MatchConfig {
  switch (format) {
    case "T20":
      return {
        format,
        oversPerInnings: 20,
        inningsPerSide: 1
      };

    case "ODI":
      return {
        format,
        oversPerInnings: 50,
        inningsPerSide: 1
      };

    case "TEST":
      return {
        format,
        oversPerInnings: null,
        inningsPerSide: 2
      };
  }
}