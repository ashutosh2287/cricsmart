import { headers } from "next/headers";
import type { AuthSession } from "@/services/auth/authTypes";
import { readAuthSessionFromHeaders } from "@/services/auth/requestContext";

export async function getRequestAuthSession(): Promise<AuthSession | null> {
  const headerStore = await headers();
  return readAuthSessionFromHeaders(headerStore);
}

export async function getRequiredRequestAuthSession(): Promise<AuthSession> {
  const session = await getRequestAuthSession();
  if (!session) {
    throw new Error("Missing authenticated request context");
  }
  return session;
}
