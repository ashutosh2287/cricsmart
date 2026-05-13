"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AppDrawer from "@/components/navigation/AppDrawer";
import MobileMenuButton from "@/components/navigation/MobileMenuButton";
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
    (link) => pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`)),
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
            ? "bg-black/70 backdrop-blur-xl border-b border-white/10"
            : "bg-black/45 backdrop-blur-md border-b border-white/5"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <MobileMenuButton isOpen={isOpen} onClick={toggleDrawer} />
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-white transition hover:text-blue-300 md:text-xl"
            >
              CricSmart
            </Link>
          </div>

          <div className="hidden items-center gap-5 md:flex">
            {quickLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-1 py-1 text-sm font-medium transition ${
                    isActive ? "text-white" : "text-white/65 hover:text-white"
                  }`}
                >
                  {link.name}
                  {isActive ? (
                    <motion.span
                      layoutId="navbar-active-indicator"
                      className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-blue-400"
                      transition={{ type: "spring", stiffness: 500, damping: 34 }}
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="hidden min-w-[140px] justify-end md:flex">
            <span className="rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-400">
              {activeLink?.name ?? "Cricket"}
            </span>
          </div>
        </div>
      </nav>

      <AppDrawer isOpen={isOpen} pathname={pathname} onClose={closeDrawer} />
    </>
  );
}
