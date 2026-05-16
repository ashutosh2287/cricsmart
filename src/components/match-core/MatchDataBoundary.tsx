"use client";

import React from "react";

type MatchDataBoundaryProps = {
  isReady: boolean;
  error?: string | null;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  children: React.ReactNode;
};

export default function MatchDataBoundary({
  isReady,
  error,
  loadingFallback,
  errorFallback,
  children,
}: MatchDataBoundaryProps) {
  if (error) {
    return (
      errorFallback ?? (
        <div className="space-y-3 p-10 text-center">
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )
    );
  }

  if (!isReady) {
    return (
      loadingFallback ?? (
        <div className="p-10 text-center text-white">
          Loading match...
        </div>
      )
    );
  }

  return <>{children}</>;
}