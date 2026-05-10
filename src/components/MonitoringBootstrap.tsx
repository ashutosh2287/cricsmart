"use client";

import { useEffect } from "react";
import { initMonitoring } from "@/lib/monitoring";

/**
 * Client-side component that bootstraps production monitoring.
 * Attach unhandled error/rejection listeners exactly once.
 * Render this component near the root (e.g., inside the root layout).
 */
export default function MonitoringBootstrap() {
  useEffect(() => {
    initMonitoring();
  }, []);

  return null;
}
