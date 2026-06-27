// ═══════════════════════════════════════════════════════════════════
// FILE 1
// Path:     src/app/(landing)/layout.tsx
// Action:   CREATE (new file, new folder)
// Purpose:  Route group layout — no app shell, no Navbar.
//           The (landing) folder name is invisible to Next.js routing,
//           so this layout owns the / route without any wrapper.
// ═══════════════════════════════════════════════════════════════════

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CricLens — Cricket Intelligence, Redefined",
  description:
    "AI-powered cricket analytics platform. Real-time scores, match predictions, player insights, and fantasy tools — all in one place.",
  openGraph: {
    title: "CricLens — Cricket Intelligence, Redefined",
    description:
      "AI-powered cricket analytics. Real-time scores, predictions, and deep analytics.",
    siteName: "CricLens",
  },
};

// Intentionally bare — no Navbar, no sidebar, no cinematic background,
// no EngineBootstrap, no MonitoringBootstrap.
// The landing page owns its complete visual presentation.
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}