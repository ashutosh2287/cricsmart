"use client";

import React from "react";

let enabled = false;

export async function enableWhyDidYouRender() {
  if (enabled || process.env.NODE_ENV === "production") return;

  const mod = await import("@welldone-software/why-did-you-render");
  const whyDidYouRender = mod.default;

  whyDidYouRender(React, {
    trackAllPureComponents: false,
    collapseGroups: true,
    include: [
      /WagonWheel/,
      /MomentumChart/,
      /WinProbabilityChart/,
      /LiveCommentaryFeed/,
      /LiveScoreCard/,
      /MatchInsightsPanel/,
    ],
  });

  enabled = true;
}
