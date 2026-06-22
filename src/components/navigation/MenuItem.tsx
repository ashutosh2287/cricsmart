"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode } from "react";

type MenuItemProps = {
  label: string;
  href?: string;
  icon: ReactNode;
  isActive: boolean;
  isLoading?: boolean;
  onClick?: () => void | Promise<void>;
  onNavigate: () => void;
  index?: number;
};

export default function MenuItem({
  label,
  href,
  icon,
  isActive,
  isLoading = false,
  onClick,
  onNavigate,
  index = 0,
}: MenuItemProps) {
  const itemClassName = `group flex items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 ${
    isActive
      ? "border border-blue-400/30 bg-blue-400/15 text-[var(--text-primary)]"
      : "text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] hover:translate-x-0.5"
  }`;
  const buttonClassName = `${itemClassName} w-full text-left`;

  const iconContainerClass = `flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
    isActive
      ? "border-blue-400/30 bg-blue-400/15 text-[var(--brand)]"
      : "border-[var(--border-subtle)] bg-[var(--bg-raised)]/70 text-[var(--text-primary)] group-hover:border-[var(--brand)]/40 group-hover:bg-[var(--brand)]/10 group-hover:text-[var(--brand)]"
  }`;

  const content = (child: ReactNode) => (
    <>
      <span className={iconContainerClass}>
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
      {child}
    </>
  );

  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className={buttonClassName}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
      >
        {content(null)}
      </motion.button>
    );
  }

  if (!href) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        onClick={onNavigate}
        className={itemClassName}
      >
        {content(
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-colors duration-200 group-hover:text-[var(--brand)]"
            fill="none"
            aria-hidden="true"
          >
            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </Link>
    </motion.div>
  );
}