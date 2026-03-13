import type { Metadata } from "next";
import Navbar from "../components/Navbar";
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >

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