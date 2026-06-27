"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Globe, MessageCircle, Mail } from "lucide-react";
import AnimatedLogo from "@/components/ui/AnimatedLogo";

const footerLinks = {
  product: [
    { label: "Live Matches", href: "/matches" },
    { label: "Analytics", href: "/analytics" },
    { label: "Players", href: "/players" },
    { label: "Teams", href: "/teams" },
    { label: "Tournaments", href: "/tournaments" },
  ],
  platform: [
    { label: "Host a Match", href: "/host/matches/create" },
    { label: "Create Team", href: "/teams/create" },
    { label: "Hosted Matches", href: "/hosted-matches" },
    { label: "My Account", href: "/account" },
  ],
  resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Changelog", href: "#" },
    { label: "Status", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

const socialLinks = [
  { label: "Website", href: "#", icon: Globe },
  { label: "Community", href: "#", icon: MessageCircle },
  { label: "Email", href: "mailto:hello@cricsmart.app", icon: Mail },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function AppFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <motion.div
        className="mx-auto max-w-6xl px-4 py-12 md:px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <motion.div variants={itemVariants} className="col-span-2 md:col-span-1">
            <AnimatedLogo size="sm" className="mb-4" />
            <p className="text-xs text-[var(--text-3)] leading-relaxed mb-4">
              AI-powered cricket intelligence platform with real-time analytics and match insights.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{ scale: 1.15, boxShadow: "0 0 12px rgba(0, 229, 255, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-lg bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-3)] hover:text-[var(--brand)] hover:bg-[var(--surface-4)] transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <motion.div key={category} variants={itemVariants}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-2)] mb-3">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="group relative text-xs text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors inline-block"
                    >
                      {label}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[var(--brand)] transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          variants={itemVariants}
          className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="text-[11px] text-[var(--text-3)]">
            &copy; {new Date().getFullYear()} CricLens. All rights reserved.
          </p>
          <p className="text-[11px] text-[var(--text-3)]">
            Built with AI for cricket intelligence
          </p>
        </motion.div>
      </motion.div>
    </footer>
  );
}
