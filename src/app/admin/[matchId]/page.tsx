"use client";

import { useParams } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  if (!matchId) {
    return <div className="p-10 text-white">Invalid match</div>;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">
        Admin Panel — {matchId}
      </h1>

      <AdminDashboard matchId={matchId} />
    </div>
  );
}