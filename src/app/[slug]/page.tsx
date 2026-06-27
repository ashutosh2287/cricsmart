"use client";

import React from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { 
  Activity, BarChart3, Calendar, Trophy, Users, 
  TrendingUp, Table, ShieldAlert, Award, MapPin, 
  Newspaper, PlayCircle, Image, Gavel, Lightbulb, 
  ArrowLeft, Layers, Database
} from "lucide-react";

// Synchronized descriptions matching your database router configuration
const sectionDescriptions: Record<string, string> = {
  "live-matches": "Track active fixtures, momentum shifts, and real-time match flow.",
  "live-scores": "Follow current scores and over-by-over updates across competitions.",
  schedule: "Browse upcoming fixtures and build your watchlist.",
  series: "Explore ongoing and upcoming cricket series.",
  teams: "View team snapshots and performance trends.",
  rankings: "Check updated team and player standings.",
  "points-table": "Monitor group standings and qualification races.",
  "stats-center": "Dive into advanced metrics and split-based analysis.",
  records: "Discover milestone performances and historical achievements.",
  venues: "Find venue profiles and ground-specific patterns.",
  news: "Read latest cricket stories and match reports.",
  highlights: "Catch quick recap moments and key passages of play.",
  photos: "Explore visual match moments and cricket galleries.",
  "auction-tracker": "Track bids, squads, and auction movement.",
  "fantasy-insights": "Get matchup-driven picks and fantasy context.",
};

// Maps appropriate icon vectors to each internal dynamic slug
const sectionIcons: Record<string, React.ReactNode> = {
  "live-matches": <Activity size={22} />,
  "live-scores": <TrendingUp size={22} />,
  schedule: <Calendar size={22} />,
  series: <Layers size={22} />,
  teams: <Users size={22} />,
  rankings: <Trophy size={22} />,
  "points-table": <Table size={22} />,
  "stats-center": <BarChart3 size={22} />,
  records: <Award size={22} />,
  venues: <MapPin size={22} />,
  news: <Newspaper size={22} />,
  highlights: <PlayCircle size={22} />,
  photos: <Image size={22} />,
  "auction-tracker": <Gavel size={22} />,
  "fantasy-insights": <Lightbulb size={22} />,
};

export default function SectionPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const isValidSlug = /^[a-z0-9-]+$/.test(slug) && slug in sectionDescriptions;
  if (!isValidSlug && slug !== "") {
    notFound();
  }

  const toTitle = (value: string) =>
    value
      .split("-")
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(" ");

  const title = toTitle(slug || "System");
  const description = sectionDescriptions[slug] || "Engine processing core pipeline...";

  return (
    <div className="section-viewport-wrapper">
      <style>{`
        .section-viewport-wrapper {
          --primary: #00E5FF;
          --bg-dark: #040A14;
          --card-bg: #0A1220;
          --border: rgba(255, 255, 255, 0.06);
          color: white;
          font-family: 'Inter', sans-serif;
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .section-panel {
          width: 100%;
          max-w: 720px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          position: relative;
          overflow: hidden;
        }
        .section-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--primary);
        }
        .section-header-tag {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #64748B;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .section-title-area {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .section-icon-box {
          color: var(--primary);
          background: rgba(0, 229, 255, 0.08);
          border: 1px solid rgba(0, 229, 255, 0.15);
          padding: 0.5rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .scaffolding-notice {
          background: rgba(0, 229, 255, 0.02);
          border: 1px solid rgba(0, 229, 255, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          margin: 2rem 0;
          font-size: 0.85rem;
          line-height: 1.6;
          color: #94A3B8;
          display: flex;
          gap: 0.75rem;
        }
        .btn-nav-back {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: #111B2B;
          color: #94A3B8;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .btn-nav-back:hover {
          color: white;
          border-color: rgba(255,255,255,0.2);
        }
        .btn-nav-action {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          background: var(--primary);
          color: #040A14;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: opacity 0.2s;
        }
        .btn-nav-action:hover {
          opacity: 0.9;
        }
      `}</style>

      <section className="section-panel">
        <div className="section-header-tag">CricLens Platform Data Node</div>
        
        <div className="section-title-area">
          <div className="section-icon-box">
            {sectionIcons[slug] || <Database size={22} />}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
            {title}
          </h1>
        </div>

        <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl">
          {description}
        </p>

        {/* Scaffold Sandbox Alert Block */}
        <div className="scaffolding-notice">
          <ShieldAlert size={20} className="text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block mb-0.5">Scaffolding Layer Connected</span>
            Core metrics configuration complete. Data pipelines and advanced analytics splits will mount here without impacting global sidebar layout trees.
          </div>
        </div>

        {/* Action Controller Tray */}
        <div className="flex items-center gap-3">
          <Link href="/" className="btn-nav-back">
            <ArrowLeft size={14} /> Back to Terminal Home
          </Link>
          <Link href="/matches" className="btn-nav-action">
            Monitor Live Matches <Activity size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}