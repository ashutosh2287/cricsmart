"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const links = [
  { name: "Home", href: "/" },
  { name: "Matches", href: "/matches" },
  { name: "Players", href: "/players" },
  { name: "Analytics", href: "/analytics" }
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
    
      className={`sticky top-0 z-50 transition-all duration-300
      ${
        scrolled
          ? "bg-black/70 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
          : "bg-black/40 backdrop-blur-md"
      }`}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 blur-xl" >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* 🔥 LOGO */}
        <Link
          href="/"
          className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 
                     bg-clip-text text-transparent transition-transform duration-200 hover:scale-105"
        >
          CricSmart
        </Link>

        {/* 🔥 NAV LINKS */}
        <div className="flex gap-6 relative">

          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-2 py-1 text-sm font-medium"
              >
                {/* TEXT */}
                <span
                  className={`transition-all duration-200 ${
                    active
                      ? "text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {link.name}
                </span>

                {/* 🔥 ACTIVE UNDERLINE */}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-2 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}

                {/* 🔥 HOVER GLOW */}
                <span
                  className="absolute inset-0 rounded-md opacity-0 hover:opacity-100 
                             transition duration-200 bg-white/[0.04]"
                />
              </Link>
            );
          })}
        </div>
        </div>

      </div>
    </nav>
  );
}