"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
const links = [
  { name: "Home", href: "/" },
  { name: "Matches", href: "/matches" },
  { name: "Players", href: "/players" },
  { name: "Analytics", href: "/analytics" }
];

export default function Navbar() {

  const pathname = usePathname();

  return (

    <nav className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}

        

<Link
  href="/"
  className="text-white font-bold text-lg hover:text-blue-400 transition"
>
  CricSmart
</Link>

        {/* Links */}

        <div className="flex gap-6 relative">

          {links.map(link => {

            const active = pathname === link.href;

            return (

              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm text-gray-300 hover:text-white transition"
              >

                {link.name}

                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-2 left-0 right-0 h-[2px] bg-blue-500"
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