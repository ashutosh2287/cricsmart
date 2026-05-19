import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthSession } from "@/services/auth/authTypes";
import { readAuthSessionFromHeaders } from "@/services/auth/requestContext";

export async function getRequestAuthSession(): Promise<AuthSession | null> {
  const headerStore = await headers();
  return readAuthSessionFromHeaders(headerStore);
}

function normalizeRedirectPath(path: string): string {
  if (!path || !path.startsWith("/")) return "/";
  if (path.startsWith("//")) return "/";
  return path;
}

function resolveLoginRedirectTarget(path: string): string {
  return `/login?redirect=${encodeURIComponent(normalizeRedirectPath(path))}`;
}

export async function getRequiredRequestAuthSession(redirectPath = "/"): Promise<AuthSession> {
  const session = await getRequestAuthSession();
  if (!session) {
    redirect(resolveLoginRedirectTarget(redirectPath));
  }
  return session;
}
