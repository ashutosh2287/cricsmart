import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import BootstrapRealtime from "@/components/BootstrapRealtime";
import StadiumOverlay from "@/components/StadiumOverlay"; // ⭐ NEW

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

        {/* ⭐ Global realtime bootstrapping (runs once) */}
        <BootstrapRealtime />

        {/* ⭐ GLOBAL STADIUM OVERLAY (NEW 😈) */}
        <StadiumOverlay />

        {/* ⭐ Navigation */}
        <Navbar />

        {/* ⭐ Page Content */}
        {children}

      </body>
    </html>
  );
}
