"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants, type Transition } from "framer-motion";
import MenuSection, { DrawerMenuItem } from "@/components/navigation/MenuSection";
import { useAuth } from "@/providers/AuthProvider";

const icon = (path: string) => (
  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
    <path d={path} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type DrawerSection = {
  title: string;
  items: DrawerMenuItem[];
};

type AppDrawerProps = {
  isOpen: boolean;
  pathname: string;
  onClose: () => void;
};

const focusableSelector =
  "a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex='-1'])";

const sections: DrawerSection[] = [
  {
    title: "Live",
    items: [
      { label: "Home", href: "/", icon: icon("M3 9.5L10 4l7 5.5V16H3V9.5z") },
      { label: "Matches", href: "/matches", icon: icon("M4 5h12v10H4z") },
      { label: "Hosted Matches", href: "/hosted-matches", icon: icon("M5 5h10v10H5z") },
      { label: "Live Matches", href: "/live-matches", icon: icon("M4 10h4m4 0h4M10 4v12") },
      { label: "Live Scores", href: "/live-scores", icon: icon("M4 14l3-3 2 2 4-5 3 3") },
      { label: "Schedule", href: "/schedule", icon: icon("M5 4h10v12H5z M5 8h10") },
    ],
  },
  {
    title: "Cricket Hub",
    items: [
      { label: "Series", href: "/series", icon: icon("M4 6h12M4 10h12M4 14h8") },
      { label: "Teams", href: "/teams", icon: icon("M4 15a3 3 0 016 0m2 0a3 3 0 016 0M7 8a2 2 0 110-4 2 2 0 010 4zm6 0a2 2 0 110-4 2 2 0 010 4z") },
      { label: "Players", href: "/players", icon: icon("M10 11a4 4 0 100-8 4 4 0 000 8zm-6 6a6 6 0 0112 0") },
      { label: "Discover Players", href: "/players/discover", icon: icon("M4 10h12M10 4v12") },
      { label: "Tournaments", href: "/tournaments", icon: icon("M5 5h10v10H5zM5 8h10") },
      { label: "Rankings", href: "/rankings", icon: icon("M5 15h10M6 15V7m4 8V5m4 10V9") },
      { label: "Points Table", href: "/points-table", icon: icon("M4 5h12v10H4zM8 5v10M12 5v10") },
    ],
  },
  {
    title: "Data",
    items: [
      { label: "Stats Center", href: "/stats-center", icon: icon("M5 14V9m5 5V6m5 8v-3") },
      { label: "Records", href: "/records", icon: icon("M6 4h8l2 2v10H6z") },
      { label: "Venues", href: "/venues", icon: icon("M10 17s5-4.5 5-8a5 5 0 10-10 0c0 3.5 5 8 5 8z") },
    ],
  },
  {
    title: "Media & Fantasy",
    items: [
      { label: "News", href: "/news", icon: icon("M5 5h10v10H5zM7 8h6M7 11h4") },
      { label: "Highlights", href: "/highlights", icon: icon("M7 6l7 4-7 4V6z") },
      { label: "Photos", href: "/photos", icon: icon("M5 6h10v8H5zM8 10l2-2 3 3") },
      { label: "Auction Tracker", href: "/auction-tracker", icon: icon("M6 6h8M8 10h8M6 14h8") },
      { label: "Fantasy Insights", href: "/fantasy-insights", icon: icon("M10 4l2 4 4 .5-3 2.5 1 4-4-2.3-4 2.3 1-4-3-2.5 4-.5z") },
    ],
  },
];

const drawerVariants: Variants = {
  hidden: { x: "-100%", opacity: 0.5 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 } as Transition,
  },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.08 + i * 0.06, duration: 0.3, ease: "easeOut" },
  }),
};

export default function AppDrawer({ isOpen, pathname, onClose }: AppDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const accountItems: DrawerMenuItem[] = isAuthenticated
    ? [
        {
          label: "My Account",
          href: "/account",
          icon: icon("M10 11a4 4 0 100-8 4 4 0 000 8zm-6 6a6 6 0 0112 0"),
        },
        {
          label: "Profile",
          href: "/account/profile",
          icon: icon("M10 11a4 4 0 100-8 4 4 0 000 8"),
        },
        {
          label: "Settings",
          href: "/account/settings",
          icon: icon("M6 10a4 4 0 118 0 4 4 0 01-8 0zm4-6v2m0 8v2m6-6h-2M6 10H4"),
        },
        {
          label: "My Teams",
          href: "/account/teams",
          icon: icon("M4 15a3 3 0 016 0m2 0a3 3 0 016 0M7 8a2 2 0 110-4 2 2 0 010 4zm6 0a2 2 0 110-4 2 2 0 010 4z"),
        },
        {
          key: "account-logout",
          label: isLoggingOut ? "Logging out..." : "Logout",
          icon: icon("M9 6l-4 4 4 4M5 10h8m2 5H9a2 2 0 01-2-2V7a2 2 0 012-2h6"),
          isLoading: isLoggingOut,
          onClick: async () => {
            if (isLoggingOut) return;
            setIsLoggingOut(true);
            try {
              await logout();
              onClose();
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    : [
        {
          label: "Login",
          href: `/login?redirect=${encodeURIComponent(pathname || "/")}`,
          icon: icon("M11 6l4 4-4 4M15 10H7m-2 5h6a2 2 0 002-2V7a2 2 0 00-2-2H5"),
        },
        {
          label: "Signup",
          href: `/signup?redirect=${encodeURIComponent(pathname || "/")}`,
          icon: icon("M10 5v10M5 10h10"),
        },
      ];

  useEffect(() => {
    if (!isOpen || !drawerRef.current) {
      return;
    }

    const drawer = drawerRef.current;
    const focusables = drawer.querySelectorAll<HTMLElement>(focusableSelector);

    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      drawer.focus();
    }

    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const elements = drawer.querySelectorAll<HTMLElement>(focusableSelector);

      if (elements.length === 0) {
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    drawer.addEventListener("keydown", handleFocusTrap);
    return () => drawer.removeEventListener("keydown", handleFocusTrap);
  }, [isOpen]);

  const allSections = [{ title: "My Account", items: accountItems }, ...sections];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70]">
          <motion.button
            type="button"
            aria-label="Close navigation drawer"
            onClick={onClose}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-[var(--overlay-strong)] backdrop-blur-[1px]"
          />

          <motion.aside
            id="cricsmart-app-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="CricSmart main navigation"
            ref={drawerRef}
            tabIndex={-1}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onTouchStart={(event) => {
              touchStartRef.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const startX = touchStartRef.current;
              const endX = event.changedTouches[0]?.clientX;
              if (startX === null || endX === undefined) {
                return;
              }

              if (startX - endX > 70) {
                onClose();
              }
            }}
            className="absolute left-0 top-0 h-full w-[80vw] max-w-[320px] border-r border-[var(--border)] bg-[var(--surface)] md:w-[320px]"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-2)]">Navigation</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">CricSmart</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-raised)]/65 text-[var(--text-secondary)] transition hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
                {allSections.map((section, sectionIndex) => (
                  <motion.div
                    key={section.title}
                    custom={sectionIndex}
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-4"
                  >
                    <MenuSection
                      title={section.title}
                      items={section.items}
                      pathname={pathname}
                      onNavigate={onClose}
                    />
                  </motion.div>
                ))}
              </nav>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
