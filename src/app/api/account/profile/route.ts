import { NextRequest, NextResponse } from "next/server";
import { findByUsername, updateUsername } from "@/lib/repositories/user.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

const USERNAME_MIN = 3;

function isValidDisplayName(displayName: string): boolean {
  return displayName.length >= USERNAME_MIN && /^[a-z0-9_]+$/.test(displayName);
}

export async function PATCH(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { displayName?: string };
    const normalizedDisplayName = body.displayName?.trim().toLowerCase() ?? "";

    if (!isValidDisplayName(normalizedDisplayName)) {
      return NextResponse.json(
        {
          success: false,
          error: "Display name must be at least 3 characters and contain only lowercase letters, numbers, or underscores",
        },
        { status: 400 },
      );
    }

    const existing = await findByUsername(normalizedDisplayName);
    if (existing && existing.id !== access.session.userId) {
      return NextResponse.json({ success: false, error: "Display name already taken" }, { status: 409 });
    }

    const updated = await updateUsername(access.session.userId, normalizedDisplayName);
    return NextResponse.json({
      success: true,
      user: {
        userId: updated.id,
        displayName: updated.username,
        email: updated.email,
        avatarUrl: updated.avatarUrl,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
