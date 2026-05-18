import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthRole } from "@/config/auth";
import {
  isAdminProtectionEnabled,
  isAuthEnabled,
  isInternalProtectionEnabled,
  isSseAuthEnabled,
} from "@/config/auth";
import { logger } from "@/lib/logger";
import { requiresAuthFor } from "@/services/auth/accessPolicy";
import type { AuthSession } from "@/services/auth/authTypes";
import { getAuthSessionFromRequest } from "@/services/auth/sessionStore";

type GuardScope = "creator" | "admin" | "internal" | "sse";

type AuthGuardOptions = {
  req: NextRequest | Request;
  scope: GuardScope;
  allowedRoles?: AuthRole[];
};

function isScopeEnabled(scope: GuardScope): boolean {
  if (scope === "creator") return requiresAuthFor("CREATOR_ACTION") && isAuthEnabled();
  if (!isAuthEnabled()) return false;
  if (scope === "internal") return isInternalProtectionEnabled();
  if (scope === "admin") return isAdminProtectionEnabled();
  return isSseAuthEnabled();
}

function defaultRolesForScope(scope: GuardScope): AuthRole[] {
  if (scope === "creator") return ["public", "operator", "admin", "internal"];
  if (scope === "internal") return ["internal", "admin"];
  return ["operator", "admin", "internal"];
}

function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function forbiddenResponse(): NextResponse {
  return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
}

export async function requireRouteAccess(options: AuthGuardOptions): Promise<
  | {
      ok: true;
      session: AuthSession | null;
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
  const { req, scope } = options;

  if (!isScopeEnabled(scope)) {
    return { ok: true, session: null };
  }

  const session = await getAuthSessionFromRequest(req);
  if (!session) {
    logger.warn("AUTH", "access_denied_unauthenticated", {
      scope,
      path: new URL(req.url).pathname,
    });
    return { ok: false, response: unauthorizedResponse() };
  }

  const allowedRoles = options.allowedRoles ?? defaultRolesForScope(scope);
  if (!allowedRoles.includes(session.user.role)) {
    logger.warn("AUTH", "access_denied_forbidden", {
      scope,
      path: new URL(req.url).pathname,
      role: session.user.role,
    });
    return { ok: false, response: forbiddenResponse() };
  }

  return { ok: true, session };
}

export function logAuthSensitiveAction(
  action: string,
  data: {
    matchId?: string;
    route: string;
    role?: string;
    username?: string;
  }
) {
  logger.info("AUTH_AUDIT", action, data);
}
