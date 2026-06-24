"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { heroStagger, heroChild, staggerGrid, gridItem, cardHover } from "@/components/ui/motion";
import GlowBadge from "@/components/ui/GlowBadge";
import StatCounter from "@/components/ui/StatCounter";
import { BarChart3, Zap, Trophy, Target, Smartphone, Radio } from "lucide-react";

interface LiveMatch {
  id: string;
  title: string;
  teamA: string;
  teamB: string;
  runtimeMatchId?: string;
}

interface Props {
  liveMatchCount: number;
  totalMatchCount: number;
  teamCount: number;
  liveMatches: LiveMatch[];
}

const FEATURES = [
  { icon: <Radio className="w-6 h-6" />, title: "Real-Time Analytics", desc: "Live ball-by-ball data with instant statistical breakdowns.", color: "cyan" as const },
  { icon: <Target className="w-6 h-6" />, title: "AI Predictions", desc: "Machine learning models predict match outcomes as the game unfolds.", color: "purple" as const },
  { icon: <Trophy className="w-6 h-6" />, title: "Player Rankings", desc: "Comprehensive player ratings across matches, formats, and roles.", color: "green" as const },
  { icon: <BarChart3 className="w-6 h-6" />, title: "Win Probability", desc: "Dynamic win probability charts with momentum and pressure tracking.", color: "cyan" as const },
  { icon: <Smartphone className="w-6 h-6" />, title: "Mobile First", desc: "Responsive design that works beautifully on every device.", color: "purple" as const },
  { icon: <Zap className="w-6 h-6" />, title: "Instant Updates", desc: "SSE-powered live updates with zero page refreshes.", color: "green" as const },
];

const iconColors = {
  cyan: "text-[var(--brand)]",
  purple: "text-[var(--accent)]",
  green: "text-[var(--success)]",
};

const glowColors = {
  cyan: "group-hover:shadow-[0_0_30px_rgba(0,229,255,0.2)]",
  purple: "group-hover:shadow-[0_0_30px_rgba(124,58,237,0.2)]",
  green: "group-hover:shadow-[0_0_30px_rgba(0,255,135,0.2)]",
};

export default function LandingPageClient({
  liveMatchCount,
  totalMatchCount,
  teamCount,
  liveMatches,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--surface-2)] text-[var(--text-1)] overflow-hidden">
      {/* ─── NAVBAR ─── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--accent)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              <span className="text-[var(--brand)]">Cric</span>Smart
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">Features</a>
            <a href="#stats" className="text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">Stats</a>
            {liveMatchCount > 0 && (
              <Link href="/matches" className="flex items-center gap-2 text-sm">
                <GlowBadge color="red" pulse>Live</GlowBadge>
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors rounded-lg hover:bg-[var(--surface-3)]">
              Sign In
            </Link>
            <Link href="/signup" className="px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--brand)] to-[#0077FF] text-white hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all duration-300">
              Get Started
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-[var(--text-2)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass mx-4 mt-2 rounded-xl p-4 space-y-3"
            >
              <a href="#features" className="block text-sm text-[var(--text-2)] py-2">Features</a>
              <a href="#stats" className="block text-sm text-[var(--text-2)] py-2">Stats</a>
              <Link href="/login" className="block text-sm text-[var(--text-2)] py-2">Sign In</Link>
              <Link href="/signup" className="block text-sm font-semibold text-[var(--brand)] py-2">Get Started</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ─── HERO ─── */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex items-center justify-center pt-20"
      >
        <div className="gradient-mesh absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.06),transparent_70%)]" />

        <motion.div
          variants={heroStagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center max-w-4xl mx-auto px-6"
        >
          <motion.div variants={heroChild} className="mb-6">
            <GlowBadge color="cyan" pulse>
              Cricket Intelligence Platform
            </GlowBadge>
          </motion.div>

          <motion.h1
            variants={heroChild}
            className="text-5xl md:text-7xl font-bold leading-[1.05] mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="gradient-text">Cricket</span>{" "}
            <span className="text-[var(--text-1)]">Intelligence</span>
            <br />
            <span className="text-[var(--text-1)]">Redefined</span>
          </motion.h1>

          <motion.p
            variants={heroChild}
            className="text-lg md:text-xl text-[var(--text-2)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Real-time analytics, AI-powered predictions, and deep match insights.
            Experience cricket like never before.
          </motion.p>

          <motion.div variants={heroChild} className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-[var(--brand)] to-[#0077FF] text-white hover:shadow-[0_0_30px_rgba(0,229,255,0.35)] transition-all duration-300 hover:-translate-y-0.5"
            >
              Start for Free
            </Link>
            <Link
              href="/matches"
              className="px-8 py-3.5 text-sm font-semibold rounded-xl border border-[var(--border-med)] text-[var(--text-2)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all duration-300"
            >
              View Live Matches
            </Link>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-[var(--border-med)] flex justify-center pt-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
          </motion.div>
        </div>
      </motion.section>

      {/* ─── LIVE MATCHES TICKER ─── */}
      {liveMatches.length > 0 && (
        <section className="py-8 border-y border-[var(--border)] bg-[var(--surface)]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-4">
              <GlowBadge color="red" pulse>LIVE NOW</GlowBadge>
              <span className="text-sm text-[var(--text-3)]">{liveMatches.length} match{liveMatches.length !== 1 ? "es" : ""} in progress</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveMatches.slice(0, 6).map((match) => (
                <Link
                  key={match.id}
                  href={match.runtimeMatchId ? `/match/${match.runtimeMatchId}` : "#"}
                  className="card-cinematic group p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-1)]">{match.teamA} vs {match.teamB}</div>
                    <div className="text-xs text-[var(--text-3)] mt-1">{match.title}</div>
                  </div>
                  <div className="live-pulse-dot" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── STATS ─── */}
      <section id="stats" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            variants={staggerGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <motion.div variants={gridItem}>
              <StatCounter value={totalMatchCount} label="Matches Analyzed" color="cyan" />
            </motion.div>
            <motion.div variants={gridItem}>
              <StatCounter value={teamCount} label="Teams Tracked" color="green" />
            </motion.div>
            <motion.div variants={gridItem}>
              <StatCounter value={500} label="Players in Database" suffix="+" color="purple" />
            </motion.div>
            <motion.div variants={gridItem}>
              <StatCounter value={94} label="Prediction Accuracy" suffix="%" color="amber" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
              <span className="gradient-text">Powerful</span> Features
            </h2>
            <p className="text-[var(--text-2)] max-w-lg mx-auto">
              Everything you need to understand the game at a deeper level.
            </p>
          </motion.div>

          <motion.div
            variants={staggerGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                variants={gridItem}
                className="group card-cinematic p-6 cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[var(--surface-3)] ${iconColors[f.color]} group-hover:bg-[rgba(0,229,255,0.08)] transition-colors duration-300 ${glowColors[f.color]}`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-1)] mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-2)] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden p-10 md:p-14 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,229,255,0.1)] via-[rgba(124,58,237,0.08)] to-[rgba(0,255,135,0.06)]" />
            <div className="absolute inset-0 border border-[rgba(0,229,255,0.15)] rounded-2xl" />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Ready to elevate your cricket experience?
              </h2>
              <p className="text-[var(--text-2)] mb-8 max-w-md mx-auto">
                Join thousands of cricket enthusiasts using CricSmart for real-time analytics.
              </p>
              <Link
                href="/signup"
                className="inline-flex px-8 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-[var(--brand)] to-[#0077FF] text-white hover:shadow-[0_0_30px_rgba(0,229,255,0.35)] transition-all duration-300"
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-10 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--brand)] to-[var(--accent)] flex items-center justify-center">
              <span className="text-white font-bold text-xs">CS</span>
            </div>
            <span className="text-sm font-semibold text-[var(--text-2)]">CricSmart</span>
          </div>
          <p className="text-xs text-[var(--text-3)]">
            Real-Time Cricket Analytics Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
