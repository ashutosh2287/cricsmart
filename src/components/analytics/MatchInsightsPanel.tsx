"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { getMatchInsights } from "@/services/analytics/matchInsightsEngine";
import { getAIInsights } from "@/services/analytics/aiInsightEngine";
import MomentumChart from "./MomentumChart";
import AnalyticsErrorBoundary from "./AnalyticsErrorBoundary";

type Props = {
  matchId: string;
};
type MatchInsight = {
  text: string;
};

type AIInsight = {
  type: string;
  text: string;
};

function MatchInsightsPanel({ matchId }: Props) {

  const [insights, setInsights] = useState<MatchInsight[]>(() =>
    getMatchInsights(matchId)
  );
  const [aiInsights, setAIInsights] = useState<AIInsight[]>(
    () => getAIInsights(matchId) ?? []
  );

  // 🔥 LIVE UPDATE (IMPORTANT)
  const refreshInsights = useCallback(() => {
    setInsights(getMatchInsights(matchId));
    setAIInsights(getAIInsights(matchId) ?? []);
  }, [matchId]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshInsights();
    }, 1000); // update every second

    return () => clearInterval(interval);

  }, [refreshInsights]);

  return (
    <AnalyticsErrorBoundary fallbackTitle="Insights panel is temporarily unavailable.">
      <div className="space-y-6">

      {/* 📊 MOMENTUM + WIN PROB */}
      <MomentumChart matchId={matchId} />

      {/* 🤖 AI INSIGHTS (PREMIUM CARD) */}
      {(aiInsights?.length ?? 0) > 0 && (

        <div
          className="rounded-xl border p-4 shadow-[var(--shadow-card)]"
          style={{
            borderColor: "color-mix(in srgb, var(--accent-brand) 30%, transparent)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--brand-light) 70%, transparent), color-mix(in srgb, var(--accent-light) 60%, transparent))",
          }}
        >

          <h3 className="text-xs text-[var(--accent-brand)] uppercase mb-3 tracking-wide">
            🤖 AI Insights
          </h3>

          <div className="space-y-2">

            {aiInsights?.slice(-3).map((insight, i) => (

              <div
                key={i}
                className="text-sm px-3 py-2 rounded-md border"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--bg-overlay)",
                  color: "var(--text-primary)",
                }}
              >
                {insight.text}
              </div>

            ))}

          </div>

        </div>

      )}

      {/* ⚡ MATCH INSIGHTS */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">

        <h3 className="text-xs text-[var(--text-muted)] uppercase mb-3 tracking-wide">
          ⚡ Match Insights
        </h3>

        {insights.length === 0 && (
          <div className="text-[var(--text-muted)] text-sm">
            No insights yet
          </div>
        )}

        <div className="space-y-2">

          {insights.slice(-5).map((i, index) => (

              <div key={index} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                <span className="text-[var(--accent-brand)]">•</span>
                <span>{i.text}</span>
              </div>

          ))}

        </div>

      </div>

      </div>
    </AnalyticsErrorBoundary>

  );
}

const MemoizedMatchInsightsPanel = memo(MatchInsightsPanel);

MemoizedMatchInsightsPanel.displayName = "MatchInsightsPanel";

export default MemoizedMatchInsightsPanel;
