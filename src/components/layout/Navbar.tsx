"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const links = [
  { name: "Home", href: "/" },
  { name: "Matches", href: "/matches" },
  { name: "Players", href: "/players" },
  { name: "Analytics", href: "/analytics" }
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen]);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/70 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
          : "bg-black/40 backdrop-blur-md"
      }`}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 blur-xl" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/85 transition hover:bg-white/[0.08] md:hidden"
          >
            <span className="sr-only">Menu</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>

          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent transition-transform duration-200 hover:scale-105"
          >
            CricSmart
          </Link>
        </div>

        <div className="relative hidden gap-6 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-2 py-1 text-sm font-medium"
              >
                <span
                  className={`transition-all duration-200 ${
                    active ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {link.name}
                </span>

                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-2 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}

                <span className="absolute inset-0 rounded-md bg-white/[0.04] opacity-0 transition duration-200 hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              ref={menuRef}
              className="h-full w-full max-w-xs border-r border-white/10 bg-slate-950/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Menu</h3>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1">
                {links.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={`menu-${link.href}`}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block rounded-lg border px-3 py-2.5 text-sm transition ${
                        active
                          ? "border-sky-400/30 bg-sky-400/12 text-sky-100"
                          : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.08]"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}
