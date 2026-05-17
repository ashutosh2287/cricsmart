import type { AuthRole } from "@/config/auth";

const AUTH_ROLES: AuthRole[] = ["public", "operator", "admin", "internal"];

export function toAuthRole(role: string | null | undefined): AuthRole {
  if (!role) return "public";
  return AUTH_ROLES.includes(role as AuthRole) ? (role as AuthRole) : "public";
}

