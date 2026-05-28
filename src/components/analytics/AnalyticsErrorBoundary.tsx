"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
};

export default class AnalyticsErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ANALYTICS PANEL ERROR", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[var(--surface)] border border-red-800/50 rounded-xl p-4 text-red-300 text-sm">
          {this.props.fallbackTitle ?? "Analytics panel failed to render."}
        </div>
      );
    }

    return this.props.children;
  }
}
