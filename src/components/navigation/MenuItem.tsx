"use client";

import Link from "next/link";
import { ReactNode } from "react";

type MenuItemProps = {
  label: string;
  href?: string;
  icon: ReactNode;
  isActive: boolean;
  isLoading?: boolean;
  onClick?: () => void | Promise<void>;
  onNavigate: () => void;
};

export default function MenuItem({
  label,
  href,
  icon,
  isActive,
  isLoading = false,
  onClick,
  onNavigate,
}: MenuItemProps) {
  const itemClassName = `group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 ${
    isActive
      ? "border border-blue-400/30 bg-blue-400/15 text-[var(--text-primary)]"
      : "text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]/75 hover:text-[var(--text-primary)]"
  }`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={isLoading}
        className={itemClassName}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-raised)]/70 text-[var(--text-primary)]">
          {icon}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-[13px] font-medium tracking-[0.01em]">{label}</span>
          {isLoading && (
            <span className="inline-flex h-4 items-center rounded border border-[var(--border-subtle)] bg-[var(--bg-raised)]/70 px-1.5 text-[10px] uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Loading
            </span>
          )}
        </span>
      </button>
    );
  }

  return (
    <Link
      href={href ?? "#"}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={itemClassName}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-raised)]/70 text-[var(--text-primary)]">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-[13px] font-medium tracking-[0.01em]">{label}</span>
        {isLoading && (
           <span className="inline-flex h-4 items-center rounded border border-[var(--border-subtle)] bg-[var(--bg-raised)]/70 px-1.5 text-[10px] uppercase tracking-[0.08em] text-[var(--text-secondary)]">
             Loading
           </span>
         )}
      </span>
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:text-[var(--text-secondary)]"
        fill="none"
        aria-hidden="true"
      >
        <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}