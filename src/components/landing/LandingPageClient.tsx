// src/components/landing/LandingPageClient.tsx
// Redesigned with framer-motion animations

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */

interface LiveMatch {
  id: string;
  title: string;
  teamA: string;
  teamB: string;
  runtimeMatchId?: string;
}

interface LandingPageClientProps {
  liveMatchCount: number;
  totalMatchCount: number;
  teamCount: number;
  liveMatches: LiveMatch[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   CUSTOM HOOK: useInViewRef (avoids react-hooks/refs error)
═══════════════════════════════════════════════════════════════════════════ */

function useInViewRef(threshold = 0.15): [React.RefCallback<HTMLElement>, boolean] {
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const refCallback = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observerRef.current?.disconnect();
          }
        },
        { threshold }
      );

      observerRef.current.observe(node);
    },
    [threshold]
  );

  return [refCallback, inView];
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

function CountUp({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInViewRef(0.5);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

function LiveDot() {
  return (
    <span className="lp-live-dot">
      <span className="lp-live-dot-ping" />
      <span className="lp-live-dot-core" />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
═══════════════════════════════════════════════════════════════════════════ */

const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const heroBadge = {
  hidden: { opacity: 0, x: -20, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const heroWord = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const heroSubtitle = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const heroCta = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const statsContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const statCard = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const matchesContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const matchCard = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const featuresContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const featureFromLeft = {
  hidden: { opacity: 0, x: -40, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const featureFromRight = {
  hidden: { opacity: 0, x: 40, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const ctaBox = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPageClient({
  liveMatchCount,
  totalMatchCount,
  teamCount,
  liveMatches,
}: LandingPageClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { scrollY } = useScroll();
  const ambientY = useTransform(scrollY, [0, 1000], [0, 150]);
  const gridY = useTransform(scrollY, [0, 1000], [0, 80]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: "📊",
      title: "Real-Time Analytics",
      desc: "Live ball-by-ball data with instant statistical breakdowns and performance metrics.",
    },
    {
      icon: "🤖",
      title: "AI Predictions",
      desc: "Machine learning models trained on historical data to predict match outcomes.",
    },
    {
      icon: "📈",
      title: "Player Rankings",
      desc: "Dynamic ELO-based ranking system that updates after every match.",
    },
    {
      icon: "🎯",
      title: "Win Probability",
      desc: "Real-time win probability calculated using advanced statistical models.",
    },
    {
      icon: "📱",
      title: "Mobile First",
      desc: "Fully responsive design optimized for cricket fans on the go.",
    },
    {
      icon: "⚡",
      title: "Instant Updates",
      desc: "WebSocket-powered live updates with sub-second latency.",
    },
  ];

  return (
    <>
      <style>{`
        .lp-root {
          --lp-bg: #040A14;
          --lp-surface: #0A1628;
          --lp-border: rgba(0, 229, 255, 0.12);
          --lp-text: #E8F4F8;
          --lp-text-muted: #8BA3B8;
          --lp-cyan: #00E5FF;
          --lp-purple: #A855F7;
          --lp-green: #22C55E;
          
          min-height: 100vh;
          background: var(--lp-bg);
          color: var(--lp-text);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
        }

        .lp-ambient {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: 
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 229, 255, 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 100% 0%, rgba(168, 85, 247, 0.06), transparent);
        }

        .lp-grid-texture {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.025;
          background-image: 
            linear-gradient(rgba(0, 229, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 229, 255, 0.5) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        @media (max-width: 768px) {
          .lp-grid-texture { display: none; }
        }

        .lp-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.3s, backdrop-filter 0.3s;
        }

        .lp-nav.scrolled {
          background: rgba(4, 10, 20, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--lp-border);
        }

        .lp-logo {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--lp-cyan);
          text-decoration: none;
        }

        .lp-nav-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .lp-nav-link {
          color: var(--lp-text-muted);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s;
        }

        .lp-nav-link:hover {
          color: var(--lp-text);
        }

        .lp-nav-cta {
          display: flex;
          gap: 0.75rem;
        }

        .lp-btn {
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }

        .lp-btn-ghost {
          background: transparent;
          color: var(--lp-text);
          border: 1px solid var(--lp-border);
        }

        .lp-btn-ghost:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--lp-cyan);
        }

        .lp-btn-primary {
          background: var(--lp-cyan);
          color: #040A14;
        }

        .lp-btn-primary:hover {
          background: #33EBFF;
          transform: translateY(-1px);
        }

        .lp-btn-large {
          padding: 1rem 2rem;
          font-size: 1rem;
        }

        .lp-mobile-toggle {
          display: none;
          background: transparent;
          border: none;
          color: var(--lp-text);
          font-size: 1.5rem;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .lp-nav-links { display: none; }
          .lp-nav-cta { display: none; }
          .lp-mobile-toggle { display: block; }
        }

        .lp-mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 280px;
          background: var(--lp-surface);
          z-index: 200;
          padding: 5rem 2rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .lp-mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 150;
          pointer-events: auto;
        }

        .lp-mobile-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: transparent;
          border: none;
          color: var(--lp-text);
          font-size: 1.5rem;
          cursor: pointer;
        }

        .lp-mobile-link {
          color: var(--lp-text);
          text-decoration: none;
          font-size: 1.1rem;
          font-weight: 500;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--lp-border);
        }

        .lp-hero {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 8rem 2rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .lp-hero-content {
          will-change: transform, opacity;
        }

        .lp-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid var(--lp-border);
          border-radius: 100px;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          color: var(--lp-cyan);
          margin-bottom: 1.5rem;
        }

        .lp-hero h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(2.5rem, 8vw, 4.5rem);
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 1.5rem;
          display: flex;
          flex-wrap: wrap;
        }

        .lp-hero-word {
          display: inline-block;
          margin-right: 0.3em;
        }

        .lp-hero-word-accent {
          background: linear-gradient(135deg, var(--lp-cyan), var(--lp-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lp-hero-sub {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          color: var(--lp-text-muted);
          max-width: 600px;
          line-height: 1.6;
          margin: 0 0 2rem;
        }

        .lp-hero-ctas {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .lp-live-dot {
          position: relative;
          width: 8px;
          height: 8px;
        }

        .lp-live-dot-ping {
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: var(--lp-green);
          animation: lp-ping 1.5s infinite;
        }

        .lp-live-dot-core {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: var(--lp-green);
        }

        @keyframes lp-ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        .lp-stats {
          position: relative;
          z-index: 1;
          padding: 4rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .lp-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .lp-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .lp-stat {
          text-align: center;
          padding: 1.5rem;
          background: var(--lp-surface);
          border: 1px solid var(--lp-border);
          border-radius: 16px;
        }

        .lp-stat-value {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--lp-cyan);
        }

        .lp-stat-label {
          font-size: 0.9rem;
          color: var(--lp-text-muted);
          margin-top: 0.25rem;
        }

        .lp-matches {
          position: relative;
          z-index: 1;
          padding: 4rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .lp-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .lp-section-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .lp-matches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .lp-match-card {
          display: block;
          background: var(--lp-surface);
          border: 1px solid var(--lp-border);
          border-radius: 16px;
          padding: 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.2s;
        }

        .lp-match-card:hover {
          border-color: var(--lp-cyan);
        }

        .lp-match-title {
          font-size: 0.85rem;
          color: var(--lp-text-muted);
          margin-bottom: 1rem;
        }

        .lp-match-teams {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .lp-match-team {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .lp-match-vs {
          color: var(--lp-text-muted);
          font-size: 0.9rem;
        }

        .lp-match-live {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          font-size: 0.8rem;
          color: var(--lp-green);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .lp-no-matches {
          text-align: center;
          padding: 3rem;
          color: var(--lp-text-muted);
          background: var(--lp-surface);
          border: 1px solid var(--lp-border);
          border-radius: 16px;
          grid-column: 1 / -1;
        }

        .lp-features {
          position: relative;
          z-index: 1;
          padding: 6rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .lp-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 900px) {
          .lp-features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .lp-features-grid {
            grid-template-columns: 1fr;
          }
        }

        .lp-feature {
          background: var(--lp-surface);
          border: 1px solid var(--lp-border);
          border-radius: 16px;
          padding: 2rem;
          cursor: default;
        }

        .lp-feature-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .lp-feature-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .lp-feature-desc {
          color: var(--lp-text-muted);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .lp-cta {
          position: relative;
          z-index: 1;
          padding: 6rem 2rem;
          text-align: center;
        }

        .lp-cta-box {
          max-width: 700px;
          margin: 0 auto;
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.1), rgba(168, 85, 247, 0.1));
          border: 1px solid var(--lp-border);
          border-radius: 24px;
          padding: 4rem 2rem;
        }

        .lp-cta h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 800;
          margin: 0 0 1rem;
        }

        .lp-cta p {
          color: var(--lp-text-muted);
          font-size: 1.1rem;
          margin: 0 0 2rem;
        }

        .lp-footer {
          position: relative;
          z-index: 1;
          padding: 3rem 2rem;
          border-top: 1px solid var(--lp-border);
          text-align: center;
        }

        .lp-footer-text {
          color: var(--lp-text-muted);
          font-size: 0.9rem;
        }

        .lp-footer-link {
          color: var(--lp-cyan);
          text-decoration: none;
          transition: color 0.2s;
        }

        .lp-footer-link:hover {
          color: #33EBFF;
        }
      `}</style>

      <div className="lp-root">
        <motion.div className="lp-ambient" style={{ y: ambientY }} />
        <motion.div className="lp-grid-texture" style={{ y: gridY }} />

        {/* Navigation */}
        <motion.nav
          className={`lp-nav ${scrolled ? "scrolled" : ""}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        >
          <Link href="/" className="lp-logo">
            CricSmart
          </Link>

          <div className="lp-nav-links">
            <Link href="/matches" className="lp-nav-link">
              Live Matches
            </Link>
            <Link href="/rankings" className="lp-nav-link">
              Rankings
            </Link>
            <Link href="/teams" className="lp-nav-link">
              Teams
            </Link>
          </div>

          <div className="lp-nav-cta">
            <Link href="/login" className="lp-btn lp-btn-ghost">
              Sign In
            </Link>
            <Link href="/signup" className="lp-btn lp-btn-primary">
              Get Started
            </Link>
          </div>

          <button
            className="lp-mobile-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
        </motion.nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                className="lp-mobile-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                className="lp-mobile-menu"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <button
                  className="lp-mobile-close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  ✕
                </button>
                <Link
                  href="/matches"
                  className="lp-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Live Matches
                </Link>
                <Link
                  href="/rankings"
                  className="lp-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Rankings
                </Link>
                <Link
                  href="/teams"
                  className="lp-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Teams
                </Link>
                <Link href="/login" className="lp-btn lp-btn-ghost">
                  Sign In
                </Link>
                <Link href="/signup" className="lp-btn lp-btn-primary">
                  Get Started
                </Link>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Hero */}
        <section className="lp-hero">
          <motion.div
            className="lp-hero-content"
            variants={heroContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="lp-hero-badge" variants={heroBadge}>
              <LiveDot />
              {liveMatchCount > 0
                ? `${liveMatchCount} match${liveMatchCount > 1 ? "es" : ""} live now`
                : "AI-Powered Cricket Analytics"}
            </motion.div>

            <h1>
              <motion.span className="lp-hero-word lp-hero-word-accent" variants={heroWord}>
                Cricket{" "}
              </motion.span>
              <motion.span className="lp-hero-word lp-hero-word-accent" variants={heroWord}>
                Intelligence{" "}
              </motion.span>
              <motion.span className="lp-hero-word" variants={heroWord}>
                Redefined
              </motion.span>
            </h1>

            <motion.p className="lp-hero-sub" variants={heroSubtitle}>
              Real-time analytics, AI predictions, and comprehensive match data.
              The smartest way to follow cricket.
            </motion.p>

            <motion.div className="lp-hero-ctas" variants={heroCta}>
              <Link href="/signup" className="lp-btn lp-btn-primary lp-btn-large">
                Start for Free
              </Link>
              <Link href="/matches" className="lp-btn lp-btn-ghost lp-btn-large">
                View Live Matches
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="lp-stats">
          <motion.div
            className="lp-stats-grid"
            variants={statsContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div className="lp-stat" variants={statCard}>
              <div className="lp-stat-value">
                <CountUp target={totalMatchCount || 500} />+
              </div>
              <div className="lp-stat-label">Matches Analyzed</div>
            </motion.div>
            <motion.div className="lp-stat" variants={statCard}>
              <div className="lp-stat-value">
                <CountUp target={teamCount || 50} />+
              </div>
              <div className="lp-stat-label">Teams Tracked</div>
            </motion.div>
            <motion.div className="lp-stat" variants={statCard}>
              <div className="lp-stat-value">
                <CountUp target={8400} />+
              </div>
              <div className="lp-stat-label">Players in Database</div>
            </motion.div>
            <motion.div className="lp-stat" variants={statCard}>
              <div className="lp-stat-value">74.3%</div>
              <div className="lp-stat-label">Prediction Accuracy</div>
            </motion.div>
          </motion.div>
        </section>

        {/* Live Matches */}
        <section className="lp-matches">
          <div className="lp-section-header">
            <h2 className="lp-section-title">
              <LiveDot />
              Live Matches
            </h2>
            <Link href="/matches" className="lp-btn lp-btn-ghost">
              View All
            </Link>
          </div>

          <motion.div
            className="lp-matches-grid"
            variants={matchesContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {liveMatches.length > 0 ? (
              liveMatches.map((match) => (
                <motion.div
                  key={match.id}
                  variants={matchCard}
                  whileHover={{
                    y: -4,
                    transition: { duration: 0.2 },
                  }}
                >
                  <Link
                    href={
                      match.runtimeMatchId
                        ? `/match/${match.runtimeMatchId}`
                        : `/hosted-matches/${match.id}`
                    }
                    className="lp-match-card"
                  >
                    <div className="lp-match-title">{match.title}</div>
                    <div className="lp-match-teams">
                      <span className="lp-match-team">{match.teamA}</span>
                      <span className="lp-match-vs">vs</span>
                      <span className="lp-match-team">{match.teamB}</span>
                    </div>
                    <div className="lp-match-live">
                      <LiveDot />
                      Live
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <motion.div
                className="lp-no-matches"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                No live matches right now. Check back soon or explore past matches.
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* Features */}
        <section className="lp-features">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Why CricSmart?</h2>
          </div>

          <motion.div
            className="lp-features-grid"
            variants={featuresContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                className="lp-feature"
                variants={idx % 2 === 0 ? featureFromLeft : featureFromRight}
                whileHover={{
                  scale: 1.03,
                  y: -6,
                  borderColor: "rgba(0, 229, 255, 0.4)",
                  boxShadow: "0 8px 32px rgba(0, 229, 255, 0.12)",
                  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="lp-feature-icon">{feat.icon}</div>
                <div className="lp-feature-title">{feat.title}</div>
                <div className="lp-feature-desc">{feat.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA */}
        <section className="lp-cta">
          <motion.div
            className="lp-cta-box"
            variants={ctaBox}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <h2>Ready to elevate your cricket experience?</h2>
            <p>
              Join thousands of cricket fans using AI-powered analytics to stay
              ahead of the game.
            </p>
            <Link href="/signup" className="lp-btn lp-btn-primary lp-btn-large">
              Get Started — It&apos;s Free
            </Link>
          </motion.div>
        </section>

        {/* Footer */}
        <motion.footer
          className="lp-footer"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="lp-footer-text">
            © 2025 CricSmart. Built with ❤️ for cricket fans.{" "}
            <a
              href="[github.com](https://github.com/ashutosh2287/cricsmart)"
              className="lp-footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </motion.footer>
      </div>
    </>
  );
}
