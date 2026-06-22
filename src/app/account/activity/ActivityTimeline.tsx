"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { stagger, revealFromLeft } from "@/components/ui/motion";

type ActivityItem = {
  id: string;
  type: "match_created" | "match_live" | "match_completed" | "team_created" | "team_joined";
  label: string;
  sublabel: string;
  href?: string;
  timestamp: Date;
  icon: string;
  colorClass: string;
  dotColor: string;
};

interface Props {
  timeline: ActivityItem[];
}

const dotColors: Record<string, string> = {
  match_live: "bg-red-400",
  match_completed: "bg-emerald-400",
  match_created: "bg-blue-400",
  team_created: "bg-emerald-400",
  team_joined: "bg-[var(--accent-brand)]",
};

export function ActivityTimeline({ timeline }: Props) {
  if (timeline.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-subtle)] py-16 text-center">
        <p className="mb-3 text-3xl">📊</p>
        <p className="text-sm text-[var(--text-secondary)]">
          No activity yet — host a match or create a team to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[0.95rem] top-0 w-px bg-[var(--border-subtle)]" />
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="space-y-3 pl-10"
      >
        {timeline.map((item) => (
          <motion.div
            key={item.id}
            variants={revealFromLeft}
            className="relative"
          >
            <div
              className={`absolute -left-[1.95rem] top-6 h-3 w-3 rounded-full border-2 border-[var(--bg-base)] ${
                dotColors[item.type] ?? "bg-[var(--text-muted)]"
              }`}
            />
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 transition hover:border-[var(--text-muted)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg">{item.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${item.colorClass}`}>{item.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.sublabel}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              {item.href ? (
                <Link
                  href={item.href}
                  className="mt-2 block text-xs text-[var(--text-secondary)] transition hover:text-[var(--accent-brand)]"
                >
                  View →
                </Link>
              ) : null}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
