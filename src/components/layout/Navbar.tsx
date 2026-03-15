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

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);

  }, []);

  return (

    <nav
      className={`sticky top-0 z-50 backdrop-blur transition-all duration-300
      ${
        scrolled
          ? "bg-zinc-950/90 shadow-lg shadow-black/40 border-b border-zinc-800"
          : "bg-zinc-950/70"
      }`}
    >

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* LOGO */}

        <Link
          href="/"
          className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:scale-105 transition"
        >
          CricSmart
        </Link>

        {/* NAV LINKS */}

        <div className="flex gap-8 relative">

          {links.map((link) => {

            const active = pathname === link.href;

            return (

              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm transition ${
                  active
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >

                {link.name}

                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-2 left-0 right-0 h-0.5 bg-blue-500 rounded"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}

              </Link>

            );

          })}

        </div>

      </div>

    </nav>

  );

}