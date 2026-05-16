"use client";

import React from "react";

type MatchDataBoundaryProps = {
  matchId?: string;
  loading: boolean;
  hasData: boolean;
  error?: string | null;
  children: React.ReactNode;
};

/**
 * Handles match-id validation plus loading and error states before rendering content.
 */
export default function MatchDataBoundary({
  matchId,
  loading,
  hasData,
  error,
  children,
}: MatchDataBoundaryProps) {
  if (!matchId) {
    return (
      <div className="p-10 text-center text-[var(--text-primary)]">
        Invalid match URL. Please check the URL and try again.
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 p-10 text-center">
        <p className="text-sm text-rose-300">{error}</p>
        <p className="text-xs text-white/60">Match ID: {matchId}</p>
      </div>
    );
  }

  if (loading || !hasData) {
    return <div className="p-10 text-center text-white">Loading match...</div>;
  }

  return <>{children}</>;
}
