import { getAuthCookieName } from "@/config/auth";
import {
  applyAuthSessionToRequestHeaders,
  clearAuthSessionRequestHeaders,
} from "@/services/auth/requestContext";
import { getAuthSessionById } from "@/services/auth/sessionLookup";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type RouteAccess = "public" | "authenticated" | "creator" | "admin";

type RoutePolicyRule = {
  access: RouteAccess;
  match: RegExp;
};

const ADMIN_ROLES = new Set(["operator", "admin", "internal"]);

const ROUTE_POLICY: RoutePolicyRule[] = [
  { access: "admin", match: /^\/admin(?:\/.*)?$/ },
  { access: "authenticated", match: /^\/account(?:\/.*)?$/ },
  { access: "creator", match: /^\/teams\/create$/ },
  { access: "creator", match: /^\/tournaments\/create$/ },
  { access: "creator", match: /^\/host\/matches\/create$/ },
  { access: "creator", match: /^\/hosted-matches\/[^/]+\/control$/ },
  { access: "public", match: /^\/$/ },
  { access: "public", match: /^\/login$/ },
  { access: "public", match: /^\/signup$/ },
  { access: "public", match: /^\/matches(?:\/.*)?$/ },
  { access: "public", match: /^\/match(?:\/.*)?$/ },
  { access: "public", match: /^\/hosted-matches(?:\/[^/]+)?$/ },
];

function normalizePathname(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

function resolveRouteAccess(pathname: string): RouteAccess {
  const normalizedPath = normalizePathname(pathname);
  for (const rule of ROUTE_POLICY) {
    if (rule.match.test(normalizedPath)) {
      return rule.access;
    }
  }
  return "public";
}

function isAuthorizedForRoute(access: RouteAccess, role: string): boolean {
  if (access !== "admin") return true;
  return ADMIN_ROLES.has(role);
}

export async function middleware(req: NextRequest) {
  const access = resolveRouteAccess(req.nextUrl.pathname);
  const requestHeaders = new Headers(req.headers);
  clearAuthSessionRequestHeaders(requestHeaders);

  const sessionId = req.cookies.get(getAuthCookieName())?.value;
  const session = sessionId ? await getAuthSessionById(sessionId) : null;

  if (session && normalizePathname(req.nextUrl.pathname) === "/login") {
    const accountUrl = new URL("/account", req.url);
    return NextResponse.redirect(accountUrl);
  }

  if (session && isAuthorizedForRoute(access, session.user.role)) {
    applyAuthSessionToRequestHeaders(requestHeaders, session);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (access === "public") {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", `${req.nextUrl.pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/teams",
    "/api/teams/:slug/members",
    "/api/teams/:slug/members/:userId",
  ],
};

export const runtime = "nodejs";
