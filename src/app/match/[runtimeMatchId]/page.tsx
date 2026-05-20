import RuntimeMatchPageClient from "./RuntimeMatchPageClient";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ runtimeMatchId: string }>;
}) {
  const { runtimeMatchId } = await params;

  return <RuntimeMatchPageClient runtimeMatchId={runtimeMatchId} />;
}
