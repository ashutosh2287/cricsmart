import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

import StadiumOverlay from "@/components/StadiumOverlay";
import BroadcastDirectorOverlay from "@/components/BroadcastDirectorOverlay";
import EngineBootstrap from "@/components/EngineBootstrap";
import PageTransition from "@/components/ui/PageTransition";
import MonitoringBootstrap from "@/components/MonitoringBootstrap";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/providers/AuthProvider";

const themeInitializerScript = `
(() => {
  try {
    const key = "cricsmart-theme";
    const saved = window.localStorage.getItem(key);
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const resolved = saved === "light" ? "light" : saved === "dark" ? "dark" : prefersLight ? "light" : "dark";
    const root = document.documentElement;
    if (resolved === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
  } catch (_) {}
})();
`;

export const metadata: Metadata = {
  title: "CricSmart",
  description: "Real-Time Cricket Analytics Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializerScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
          {/* ========================================
             CINEMATIC BACKGROUND
          ======================================== */}
          <div className="cinematic-background fixed inset-0 -z-10 overflow-hidden">
            <div className="cinematic-background__base absolute inset-0" />

            {/* Blue glow */}
            <div className="cinematic-background__glow cinematic-background__glow--blue absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full blur-[140px]" />

            {/* Accent glow */}
            <div className="cinematic-background__glow cinematic-background__glow--accent absolute right-1/4 bottom-0 h-[600px] w-[600px] rounded-full blur-[140px]" />
          </div>

          {/* ========================================
             ENGINE
          ======================================== */}
          <EngineBootstrap />
          <MonitoringBootstrap />

          {/* ========================================
             OVERLAYS
          ======================================== */}
          <StadiumOverlay />
          <BroadcastDirectorOverlay />

          {/* ========================================
             NAVBAR (UPGRADED)
          ======================================== */}
          <Navbar />

          {/* ========================================
             MAIN CONTENT (ANIMATED)
          ======================================== */}
          <main className="min-h-screen bg-[var(--bg-base)]">
            <div className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
