import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import StadiumOverlay from "@/components/StadiumOverlay";
import BroadcastDirectorOverlay from "@/components/BroadcastDirectorOverlay";
import EngineBootstrap from "@/components/EngineBootstrap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

    <html lang="en">

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-white bg-black`}
      >
        <div className="stadium-light" />

        {/* ========================================
           GLOBAL CINEMATIC BACKGROUND
        ======================================== */}

        <div className="fixed inset-0 -z-10">

          <div className="absolute inset-0 bg-black" />

          {/* Blue glow */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px]" />

          {/* Purple glow */}
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px]" />

        </div>

        {/* ========================================
           ENGINE BOOTSTRAP
        ======================================== */}

        <EngineBootstrap />

        {/* ========================================
           CINEMATIC OVERLAYS
        ======================================== */}

        <StadiumOverlay />
        <BroadcastDirectorOverlay />

        {/* ========================================
           NAVBAR
        ======================================== */}

        <Navbar />

        {/* ========================================
           MAIN CONTENT AREA
        ======================================== */}

        <main className="min-h-screen">

          <div className="max-w-7xl mx-auto px-6 py-8">

            {children}

          </div>

        </main>

      </body>

    </html>

  );

}