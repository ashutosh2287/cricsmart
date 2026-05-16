"use client";

import React from "react";

type MatchRenderBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type MatchRenderBoundaryState = {
  hasError: boolean;
};

export default class MatchRenderBoundary extends React.Component<
  MatchRenderBoundaryProps,
  MatchRenderBoundaryState
> {
  state: MatchRenderBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MatchRenderBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[MatchRenderBoundary] render failure", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
            Match page failed to render. Please refresh.
          </div>
        )
      );
    }

    return this.props.children;
  }
}
