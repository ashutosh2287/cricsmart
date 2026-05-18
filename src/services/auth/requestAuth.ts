import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/services/auth/sessionStore";

export async function requireAuthenticatedRequestSession(req: Request) {
  const session = await getAuthSessionFromRequest(req);
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    ok: true as const,
    session,
  };
}
