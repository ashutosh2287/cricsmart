import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthSession } from "@/services/auth/authTypes";
import { readAuthSessionFromHeaders } from "@/services/auth/requestContext";
import { getAuthSessionFromServerCookies } from "@/services/auth/sessionStore";

export async function getRequestAuthSession(): Promise<AuthSession | null> {
  const headerStore = await headers();
  const sessionFromHeaders = readAuthSessionFromHeaders(headerStore);
  if (sessionFromHeaders) return sessionFromHeaders;
  return getAuthSessionFromServerCookies();
}

function normalizeRedirectPath(path: string): string {
  if (!path) return "/";
  const decodedPath = (() => {
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  })().trim();
  if (!decodedPath.startsWith("/")) return "/";
  const normalizedPath = decodedPath.replace(/\\/g, "/");
  if (normalizedPath.startsWith("//")) return "/";
  if (normalizedPath.includes("://")) return "/";
  const pathname = normalizedPath.split("?")[0].split("#")[0];
  const hasTraversalSegment = pathname.split("/").some((segment) => segment === "." || segment === "..");
  if (hasTraversalSegment) return "/";
  return normalizedPath;
}

function resolveLoginRedirectTarget(path: string): string {
  return `/login?redirect=${encodeURIComponent(normalizeRedirectPath(path))}`;
}

/**
 * Returns the authenticated request session, or redirects unauthenticated requests to login.
 * `redirectPath` should be an internal app-relative path; invalid values are normalized to `/`.
 */
export async function getRequiredRequestAuthSession(redirectPath = "/"): Promise<AuthSession> {
  const session = await getRequestAuthSession();
  if (!session) {
    redirect(resolveLoginRedirectTarget(redirectPath));
  }
  return session;
}
