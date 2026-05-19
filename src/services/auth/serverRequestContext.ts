import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthSession } from "@/services/auth/authTypes";
import { readAuthSessionFromHeaders } from "@/services/auth/requestContext";

export async function getRequestAuthSession(): Promise<AuthSession | null> {
  const headerStore = await headers();
  return readAuthSessionFromHeaders(headerStore);
}

function resolveLoginRedirectTarget(path: string): string {
  return `/login?redirect=${encodeURIComponent(path)}`;
}

export async function getRequiredRequestAuthSession(redirectPath = "/"): Promise<AuthSession> {
  const session = await getRequestAuthSession();
  if (!session) {
    redirect(resolveLoginRedirectTarget(redirectPath));
  }
  return session;
}
