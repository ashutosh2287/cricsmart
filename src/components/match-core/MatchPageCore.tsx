"use client";

import React from "react";

type MatchPageCoreProps = {
  header: React.ReactNode;
  tabs: React.ReactNode;
};

export default function MatchPageCore({ header, tabs }: MatchPageCoreProps) {
  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto max-w-[1500px] px-3 py-3 md:px-5 lg:px-6">
        <div className="mb-3">{header}</div>
        <div>{tabs}</div>
      </div>
    </main>
  );
}
