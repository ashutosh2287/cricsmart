import type { AuthRole } from "@/config/auth";

export type AuthUser = {
  userId: string;
  username: string;
  role: AuthRole;
  email?: string;
  avatarUrl?: string | null;
};

export type AuthSession = {
  sessionId: string;
  userId: string;
  username: string;
  role: AuthRole;
  createdAt: number;
  expiresAt: number;
  lastSeenAt: number;
  user: AuthUser;
};
