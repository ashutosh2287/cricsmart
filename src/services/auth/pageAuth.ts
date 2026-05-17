import { redirect } from "next/navigation";
import { getAuthSessionFromServerCookies } from "@/services/auth/sessionStore";

function resolveSafeRedirectTarget(path: string): string {
  return `/login?redirect=${encodeURIComponent(path)}`;
}

export async function requireAuthenticatedPageSession(path: string) {
  const session = await getAuthSessionFromServerCookies();
  if (!session) {
    redirect(resolveSafeRedirectTarget(path));
  }
  return session;
}

