"use client";

import React from "react";

type MotionFallbackBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type MotionFallbackBoundaryState = {
  hasError: boolean;
};

export default class MotionFallbackBoundary extends React.Component<
  MotionFallbackBoundaryProps,
  MotionFallbackBoundaryState
> {
  state: MotionFallbackBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MotionFallbackBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[MotionFallbackBoundary] motion failure", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <>{this.props.children}</>;
    }

    return this.props.children;
  }
}
