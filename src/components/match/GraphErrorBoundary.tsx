"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  label?: string;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class GraphErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[GraphErrorBoundary][${this.props.label ?? "unknown"}] crashed:`,
      error.message,
      info.componentStack
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="my-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
          <p className="text-xs font-semibold text-red-400">
            {this.props.label ?? "Section"} failed to render
          </p>
          <p className="mt-1 font-mono text-xs text-[var(--text-3)]">
            {this.state.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
