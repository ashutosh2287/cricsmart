"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

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

  // All other pages get the standard constrained layout with enter animation
  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <motion.div
        className="mx-auto w-full max-w-[1100px] px-3 py-6 sm:px-4 sm:py-8 md:px-6"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {children}
      </motion.div>
    </main>
  );
}