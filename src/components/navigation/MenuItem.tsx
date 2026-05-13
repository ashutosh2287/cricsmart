"use client";

import Link from "next/link";
import { ReactNode } from "react";

type MenuItemProps = {
  label: string;
  href: string;
  icon: ReactNode;
  isActive: boolean;
  isLoading?: boolean;
  onNavigate: () => void;
};

export default function MenuItem({
  label,
  href,
  icon,
  isActive,
  isLoading = false,
  onNavigate,
}: MenuItemProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-md px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 ${
        isActive
          ? "bg-blue-500/20 text-white"
          : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-200">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-[13px] font-medium tracking-[0.01em]">{label}</span>
        {isLoading && (
          <span className="inline-flex h-4 items-center rounded bg-white/10 px-1.5 text-[10px] uppercase tracking-[0.08em] text-zinc-300">
            Loading
          </span>
        )}
      </span>
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4 shrink-0 text-zinc-500 transition group-hover:text-zinc-300"
        fill="none"
        aria-hidden="true"
      >
        <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
