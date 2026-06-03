"use client";

import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPageClient({ matchId }: { matchId: string }) {
  if (!matchId) {
    return (
      <div className="p-10 text-center text-red-400 font-mono text-sm">
        [FATAL ENGINE ERROR] Invalid or unallocated match identification token.
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{
      backgroundColor: "#040A14",
      color: "white",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold">Terminal Control Suite</div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Admin Workspace <span className="text-xs font-mono font-normal bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-800">{matchId}</span>
          </h1>
        </header>
        
        <AdminDashboard matchId={matchId} />
      </div>
    </div>
  );
}