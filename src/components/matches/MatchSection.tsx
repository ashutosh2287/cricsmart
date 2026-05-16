import { ReactNode } from "react";

export function MatchSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">{title}</h2>
        {subtitle ? <p className="text-[11px] text-[var(--text-muted)]">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
