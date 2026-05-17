import { redirect } from "next/navigation";
import { isAdminProtectionEnabled } from "@/config/auth";
import AdminPageClient from "@/components/admin/AdminPageClient";
import { getAuthSessionFromServerCookies } from "@/services/auth/sessionStore";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const session = await getAuthSessionFromServerCookies();

  if (
    isAdminProtectionEnabled() &&
    (!session || ![\"admin\", \"operator\", \"internal\"].includes(session.user.role))
  ) {
    redirect(`/login?next=${encodeURIComponent(`/admin/${matchId}`)}`);
  }

  return <AdminPageClient matchId={matchId} />;
}
