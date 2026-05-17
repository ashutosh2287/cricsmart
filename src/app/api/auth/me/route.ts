import { NextResponse } from "next/server";
import { isAuthEnabled } from "@/config/auth";
import { getAuthSessionFromRequest } from "@/services/auth/sessionStore";

export async function GET(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ success: true, authEnabled: false, user: null });
  }

  const session = await getAuthSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: true, authEnabled: true, user: null });
  }

  return NextResponse.json({
    success: true,
    authEnabled: true,
    user: {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
    },
  });
}
