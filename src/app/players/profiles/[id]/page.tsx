"use client";

import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { stagger, fadeUp } from "@/components/ui/motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

interface StatsSnapshot {
  batting?: {
    runs?: number;
    balls?: number;
    fours?: number;
    sixes?: number;
    strikeRate?: number;
    average?: number;
  };
  bowling?: {
    wickets?: number;
    overs?: number;
    economy?: number;
    strikeRate?: number;
  };
}

interface ProfileData {
  id: string;
  displayName: string;
  role?: string | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  statsSnapshot?: StatsSnapshot | null;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

export default function PlayerProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/player-profiles/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((json) => setProfile(json.data ?? json))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (error) notFound();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded" style={{ background: "var(--surface-3)" }} />
        <div className="h-4 w-32 animate-pulse rounded" style={{ background: "var(--surface-3)" }} />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg" style={{ background: "var(--surface-3)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) notFound();

  const stats = profile?.statsSnapshot;
  const batting = stats?.batting;
  const bowling = stats?.bowling;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <Breadcrumbs items={[{ label: "Players", href: "/players" }, { label: profile!.displayName }]} />
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{profile!.displayName}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {profile!.role ?? "All-rounder"}
        </p>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-3 gap-2">
        <Stat label="Role" value={profile!.role ?? "—"} index={0} />
        <Stat label="Batting" value={profile!.battingStyle ?? "—"} index={1} />
        <Stat label="Bowling" value={profile!.bowlingStyle ?? "—"} index={2} />
      </motion.div>

      {(batting?.runs != null || batting?.balls != null) && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Batting Statistics
            </h2>
            <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-3 gap-2 mb-4">
              <Stat label="Runs" value={batting?.runs ?? 0} index={0} accent />
              <Stat label="Balls" value={batting?.balls ?? 0} index={1} />
              <Stat label="Average" value={batting?.average != null ? batting.average.toFixed(1) : "—"} index={2} />
            </motion.div>
            <div className="space-y-0">
              <StatRow label="Fours" value={batting?.fours ?? 0} />
              <StatRow label="Sixes" value={batting?.sixes ?? 0} />
              <StatRow label="Strike Rate" value={batting?.strikeRate != null ? batting.strikeRate.toFixed(1) : "—"} />
            </div>
          </Card>
        </motion.div>
      )}

      {(bowling?.wickets != null || bowling?.overs != null) && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Bowling Statistics
            </h2>
            <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-3 gap-2 mb-4">
              <Stat label="Wickets" value={bowling?.wickets ?? 0} index={0} accent />
              <Stat label="Overs" value={bowling?.overs ?? 0} index={1} />
              <Stat label="Economy" value={bowling?.economy != null ? bowling.economy.toFixed(2) : "—"} index={2} />
            </motion.div>
            <div className="space-y-0">
              <StatRow label="Strike Rate" value={bowling?.strikeRate != null ? bowling.strikeRate.toFixed(1) : "—"} />
            </div>
          </Card>
        </motion.div>
      )}

      {!batting && !bowling && (
        <Card className="p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            No stats recorded yet. Play some matches to build your profile.
          </p>
        </Card>
      )}
    </div>
  );
}
