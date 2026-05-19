import AdminPageClient from "@/components/admin/AdminPageClient";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  return <AdminPageClient matchId={matchId} />;
}
