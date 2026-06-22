"use client";

import { motion } from "framer-motion";

type MobileMenuButtonProps = {
  isOpen: boolean;
  onClick: () => void;
};

const lineVariants = {
  closed: {
    rotate: 0,
    y: 0,
    scaleX: 1,
    opacity: 1,
  },
  open: (i: number) => ({
    rotate: i === 0 ? 45 : i === 2 ? -45 : 0,
    y: i === 0 ? 0 : i === 2 ? 0 : 0,
    scaleX: i === 1 ? 0 : 1,
    opacity: i === 1 ? 0 : 1,
  }),
};

export default function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen ? "true" : "false"}
      aria-controls="cricsmart-app-drawer"
      onClick={onClick}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-border-subtle bg-(--bg-raised)/65 text-text-primary transition hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80"
    >
      <span className="flex flex-col items-center justify-center gap-[5px]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            custom={i}
            variants={lineVariants}
            animate={isOpen ? "open" : "closed"}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="block h-[1.5px] w-5 origin-center rounded-full bg-current"
          />
        ))}
      </span>
    </button>
  );
}
