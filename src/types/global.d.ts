export {};

declare global {
  interface Window {
    __CRIC_STATE__?: {
      teams?: {
        teamA?: { name: string };
        teamB?: { name: string };
      };
      simulationState?: unknown;
    };
  }
}