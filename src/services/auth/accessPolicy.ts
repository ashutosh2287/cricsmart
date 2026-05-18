export type AccessCapability =
  | "PUBLIC_VIEW"
  | "CREATOR_ACTION"
  | "SCORER_CONTROL"
  | "ADMIN_CONTROL";

export const ACCESS_POLICY = {
  PUBLIC_VIEW: {
    requiresAuth: false,
    description: "Public viewing remains open for matches, scorecards, analytics, and replays.",
  },
  CREATOR_ACTION: {
    requiresAuth: true,
    description: "Authenticated users can create/manage teams, hosted matches, and tournaments.",
  },
  SCORER_CONTROL: {
    requiresAuth: true,
    description: "Scoring and operator controls require authenticated authorized users.",
  },
  ADMIN_CONTROL: {
    requiresAuth: true,
    description: "Internal/admin controls require elevated roles.",
  },
} as const satisfies Record<
  AccessCapability,
  {
    requiresAuth: boolean;
    description: string;
  }
>;

export function requiresAuthFor(capability: AccessCapability): boolean {
  return ACCESS_POLICY[capability].requiresAuth;
}
