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
import AppShellContent from "@/components/layout/AppShellContent";

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
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
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
              <div className="cinematic-background__glow cinematic-background__glow--blue absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full blur-[140px]" />
              <div className="cinematic-background__glow cinematic-background__glow--accent absolute right-1/4 bottom-0 h-[600px] w-[600px] rounded-full blur-[140px]" />
              <div className="cinematic-grid-overlay" />
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="cinematic-particle"
                  style={{
                    left: `${(i * 8.3) % 100}%`,
                    bottom: `-10px`,
                    animationDelay: `${i * 0.7}s`,
                    animationDuration: `${6 + (i % 4) * 2}s`,
                  }}
                />
              ))}
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
               NAVBAR — returns null on pathname="/"
            ======================================== */}
            <Navbar />

            {/* ========================================
               MAIN CONTENT — no padding/max-width on landing
            ======================================== */}
            <AppShellContent>
              <PageTransition>{children}</PageTransition>
            </AppShellContent>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}