"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { stagger, springBounce } from "@/components/ui/motion";

const actions = [
  {
    label: "Create Team",
    icon: "🏏",
    href: "/teams/create",
    color: "from-emerald-500/20 to-emerald-500/5",
    borderColor: "border-emerald-500/20",
    textColor: "text-emerald-400",
  },
  {
    label: "Host Match",
    icon: "📋",
    href: "/host/matches/create",
    color: "from-blue-500/20 to-blue-500/5",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-400",
  },
  {
    label: "Create Tournament",
    icon: "🏆",
    href: "/tournaments/create",
    color: "from-amber-500/20 to-amber-500/5",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-400",
  },
  {
    label: "Discover Players",
    icon: "👤",
    href: "/players/discover",
    color: "from-purple-500/20 to-purple-500/5",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-400",
  },
];

export function ProfileQuickActions() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {actions.map((action) => (
          <motion.div key={action.label} variants={springBounce}>
            <Link href={action.href}>
              <Card hover className="p-4 text-center cursor-pointer group">
                <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${action.color} border ${action.borderColor} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <p className={`text-sm font-medium ${action.textColor} group-hover:opacity-80 transition-opacity`}>
                  {action.label}
                </p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
