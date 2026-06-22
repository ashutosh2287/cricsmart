"use client";

import { usePathname } from "next/navigation";

export default function AppShellContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Landing page owns its full visual presentation — no wrapper, no padding
  if (pathname === "/") {
    return <>{children}</>;
  }

  // All other pages get the standard constrained layout
  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto w-full max-w-[1100px] px-3 py-6 sm:px-4 sm:py-8 md:px-6">
        {children}
      </div>
    </main>
  );
}