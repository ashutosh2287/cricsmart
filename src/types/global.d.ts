export {};

declare global {
  interface Window {
    __CRIC_STATE__?: CricGlobalState;
  }
}

type CricGlobalState = {
  teams?: {
    teamA?: {
      name: string;
    };
    teamB?: {
      name: string;
    };
  };

  simulationState?: {
    isRunning?: boolean;
    isPaused?: boolean;
    speed?: number;
  };
};