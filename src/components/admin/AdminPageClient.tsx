"use client";

import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPageClient({ matchId }: { matchId: string }) {
  if (!matchId) {
    return <div className="p-10 text-[var(--text-1)]">Invalid match</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--surface-2)] p-6 text-[var(--text-1)]">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Admin Panel — {matchId}
      </h1>
      <AdminDashboard matchId={matchId} />
    </div>
  );
}
