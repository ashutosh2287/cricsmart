"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import AppDrawer from "@/components/navigation/AppDrawer";
import MobileMenuButton from "@/components/navigation/MobileMenuButton";
import { isPathActive } from "@/components/navigation/navigationUtils";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useDrawer } from "@/hooks/useDrawer";

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Matches", href: "/matches" },
  { name: "Players", href: "/players" },
  { name: "Analytics", href: "/analytics" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { isOpen, closeDrawer, toggleDrawer } = useDrawer();

  const activeLink = quickLinks.find(
    (link) => isPathActive(pathname, link.href),
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  return (
    <>
      <nav
        className={`relative transition-all duration-300 ${
          scrolled
            ? "border-b border-[var(--nav-border-strong)] bg-[var(--nav-bg-scrolled)] backdrop-blur-xl"
            : "border-b border-[var(--nav-border-soft)] bg-[var(--nav-bg)] backdrop-blur-md"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[var(--gradient-surface)] opacity-50" />

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <MobileMenuButton isOpen={isOpen} onClick={toggleDrawer} />
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-[var(--text-primary)] transition hover:text-[var(--accent-brand)] md:text-xl"
            >
              CricSmart
            </Link>
          </div>

          <div className="hidden items-center gap-5 md:flex">
            {quickLinks.map((link) => {
              const isActive = isPathActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-1 py-1 text-sm font-medium transition ${
                    isActive
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {link.name}
                  {isActive ? (
                    <motion.span
                      layoutId="navbar-active-indicator"
                      className="absolute -bottom-[9px] right-0 left-0 h-[2px] rounded-full bg-[var(--accent-brand)]"
                      transition={{ type: "spring", stiffness: 500, damping: 34 }}
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="flex min-w-[120px] items-center justify-end gap-3 md:min-w-[190px]">
            <span className="hidden rounded-md border border-[var(--nav-border-soft)] bg-[var(--bg-raised)]/40 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)] md:inline-flex">
              {activeLink?.name ?? "Cricket"}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <AppDrawer isOpen={isOpen} pathname={pathname} onClose={closeDrawer} />
    </>
  );
}
