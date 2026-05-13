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
    <section className="mx-auto max-w-3xl space-y-6 rounded-xl border border-white/10 bg-zinc-950/70 p-6 md:p-8">
      <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">CricSmart Section</p>
      <h1 className="text-2xl font-semibold text-zinc-100 md:text-3xl">{title}</h1>
      <p className="text-sm text-zinc-300 md:text-base">{description}</p>
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
        Content scaffolding is ready. Data integration and deeper views will be rolled in without changing the drawer navigation structure.
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.1]"
        >
          Back to Home
        </Link>
        <Link
          href="/matches"
          className="inline-flex items-center rounded-md bg-blue-500/80 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-400"
        >
          Open Matches
        </Link>
      </div>
    </section>
  );
}
