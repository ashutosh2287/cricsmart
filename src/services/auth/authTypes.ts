import type { AuthRole } from "@/config/auth";

export type AuthUser = {
  id: string;
  username: string;
  role: AuthRole;
};

export type AuthSession = {
  id: string;
  user: AuthUser;
  createdAt: number;
  lastSeenAt: number;
};
