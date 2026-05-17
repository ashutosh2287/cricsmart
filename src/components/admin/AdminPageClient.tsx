"use client";

import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPageClient({ matchId }: { matchId: string }) {
  if (!matchId) {
    return <div className="p-10 text-white">Invalid match</div>;
  }

  return (
    <div className="min-h-screen bg-[#020617] p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold">Admin Panel — {matchId}</h1>
      <AdminDashboard matchId={matchId} />
    </div>
  );
}
