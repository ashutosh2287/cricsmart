"use client";

import { useState } from "react";
import MenuItem from "@/components/navigation/MenuItem";
import { isPathActive } from "@/components/navigation/navigationUtils";

export type DrawerMenuItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  isLoading?: boolean;
};

type MenuSectionProps = {
  title: string;
  items: DrawerMenuItem[];
  pathname: string;
  onNavigate: () => void;
};

export default function MenuSection({ title, items, pathname, onNavigate }: MenuSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="border-t border-[var(--border-subtle)] pt-3 first:border-t-0 first:pt-0" aria-label={title}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mb-2 flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80"
        aria-expanded={expanded ? "true" : "false"}
      >
        {title}
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 transition ${expanded ? "rotate-90" : "rotate-0"}`}
          fill="none"
          aria-hidden="true"
        >
          <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded ? (
        <div className="space-y-1">
          {items.map((item) => (
            <MenuItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isLoading={item.isLoading}
              isActive={isPathActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
