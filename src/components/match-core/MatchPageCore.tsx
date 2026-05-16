"use client";

import React from "react";
import MatchVisibilityGuard from "@/components/match-core/MatchVisibilityGuard";

type MatchPageCoreProps = {
  header: React.ReactNode;
  scoreboard: React.ReactNode;
  tabs: React.ReactNode;
  main: React.ReactNode;
  commentaryShell?: React.ReactNode;
  analyticsShell?: React.ReactNode;
};

export default function MatchPageCore({
  header,
  scoreboard,
  tabs,
  main,
  commentaryShell,
  analyticsShell,
}: MatchPageCoreProps) {
  return (
    <main className="relative overflow-hidden" data-render-safe-match-core>
      <div className="mx-auto max-w-[1500px] px-3 py-3 md:px-5 lg:px-6">
        <section data-core-header>{header}</section>
        <section data-core-scoreboard>{scoreboard}</section>
        <section data-core-tabs>{tabs}</section>
        <section data-core-main>{main}</section>
        <MatchVisibilityGuard
          isVisible={Boolean(commentaryShell)}
          keepMounted
          className="sr-only"
        >
          <section data-core-commentary-shell>{commentaryShell ?? <div />}</section>
        </MatchVisibilityGuard>
        <MatchVisibilityGuard
          isVisible={Boolean(analyticsShell)}
          keepMounted
          className="sr-only"
        >
          <section data-core-analytics-shell>{analyticsShell ?? <div />}</section>
        </MatchVisibilityGuard>
      </div>
    </main>
  );
}