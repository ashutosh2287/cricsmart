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
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-200">{title}</h2>
        {subtitle ? <p className="text-[11px] text-zinc-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
