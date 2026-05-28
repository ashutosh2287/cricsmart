import Link from "next/link";
import { notFound } from "next/navigation";

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

const toTitle = (value: string) =>
  value
    .split("-")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");

export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const isValidSlug = /^[a-z0-9-]+$/.test(slug) && slug in sectionDescriptions;
  if (!isValidSlug) {
    notFound();
  }

  const title = toTitle(slug);
  const description = sectionDescriptions[slug];

  return (
    <section
      className="mx-auto max-w-3xl space-y-6 rounded-xl p-6 md:p-8"
      style={{
        border: "1px solid var(--border-subtle)",
        background: "color-mix(in srgb, var(--bg-surface) 92%, transparent)",
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">CricSmart Section</p>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">{title}</h1>
      <p className="text-sm text-[var(--text-secondary)] md:text-base">{description}</p>
      <div
        className="rounded-lg p-4 text-sm"
        style={{
          border: "1px solid color-mix(in srgb, var(--accent-brand) 25%, transparent)",
          background: "color-mix(in srgb, var(--accent-brand) 10%, transparent)",
          color: "var(--text-primary)",
        }}
      >
        Content scaffolding is ready. Data integration and deeper views will be rolled in without changing the drawer navigation structure.
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-md px-3 py-2 text-xs font-medium transition"
          style={{
            border: "1px solid var(--border-subtle)",
            background: "color-mix(in srgb, var(--bg-overlay) 90%, transparent)",
            color: "var(--text-primary)",
          }}
        >
          Back to Home
        </Link>
        <Link
          href="/matches"
          className="inline-flex items-center rounded-md px-3 py-2 text-xs font-medium text-[#ffffff] transition hover:opacity-90"
          style={{ background: "var(--accent-brand)" }}
        >
          Open Matches
        </Link>
      </div>
    </section>
  );
}
