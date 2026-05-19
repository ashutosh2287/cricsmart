import { NextRequest, NextResponse } from "next/server";
import { findById, updatePasswordHash } from "@/lib/repositories/user.repository";
import { hashPassword, verifyPassword } from "@/services/auth/password";
import { requireRouteAccess } from "@/services/auth/routeGuard";

const PASSWORD_MIN = 8;

function isStrongEnoughPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export async function PATCH(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Current password, new password, and confirm password are required" },
        { status: 400 },
      );
    }

    if (!isStrongEnoughPassword(newPassword)) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters and include at least one letter and one number" },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, error: "Password mismatch" }, { status: 400 });
    }

    const user = await findById(access.session.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const validCurrentPassword = await verifyPassword(currentPassword, user.passwordHash);
    if (!validCurrentPassword) {
      return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 401 });
    }

    const passwordHash = await hashPassword(newPassword);
    await updatePasswordHash(access.session.userId, passwordHash);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to change password" }, { status: 500 });
  }
}
