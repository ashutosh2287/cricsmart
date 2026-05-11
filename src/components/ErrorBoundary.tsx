"use client";

import React from "react";
import { reportError } from "@/lib/monitoring";

type Props = {
  children: React.ReactNode;
  /** Optional custom fallback UI */
  fallback?: React.ReactNode;
  /** Label used in error reports and the default fallback message */
  context?: string;
};

type State = {
  hasError: boolean;
  message?: string;
};

/**
 * General-purpose production error boundary.
 *
 * Wraps any subtree and prevents a single component crash from
 * bringing down the entire page. Errors are reported via the
 * production monitoring utility.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, this.props.context ?? "ErrorBoundary", {
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="rounded-xl border border-red-800/50 bg-zinc-900 p-4 text-red-300 text-sm">
          {this.props.context
            ? `${this.props.context} failed to render.`
            : "Something went wrong. Please refresh."}
        </div>
      );
    }

    return this.props.children;
  }
}
