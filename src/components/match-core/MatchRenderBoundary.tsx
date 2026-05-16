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

  componentDidCatch(error: Error) {
    console.error("MatchRenderBoundary caught render error", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-6 text-sm text-rose-300">
            Match UI is temporarily unavailable.
          </div>
        )
      );
    }

    return this.props.children;
  }
}