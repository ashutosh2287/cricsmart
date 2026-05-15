"use client";

import { useSyncExternalStore } from "react";

import { useTheme } from "@/context/ThemeContext";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 2.8v2.2" />
        <path d="M12 19v2.2" />
        <path d="m4.9 4.9 1.6 1.6" />
        <path d="m17.5 17.5 1.6 1.6" />
        <path d="M2.8 12H5" />
        <path d="M19 12h2.2" />
        <path d="m4.9 19.1 1.6-1.6" />
        <path d="m17.5 6.5 1.6-1.6" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M17.5 14.8A7.8 7.8 0 0 1 9.2 6.5 8.2 8.2 0 1 0 17.5 14.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const hasHydrated = useSyncExternalStore(
    (callback) => {
      void callback;
      return () => {};
    },
    () => true,
    () => false,
  );

  const isLight = resolvedTheme === "light";
  const ariaLabel = hasHydrated
    ? isLight
      ? "Switch to dark theme"
      : "Switch to light theme"
    : "Toggle theme preference";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={hasHydrated && isLight ? "true" : "false"}
      onClick={toggleTheme}
      className="theme-toggle"
    >
      <span className="theme-toggle__icon theme-toggle__icon--sun">
        <SunIcon />
      </span>
      <span className="theme-toggle__icon theme-toggle__icon--moon">
        <MoonIcon />
      </span>
      <span className="theme-toggle__knob" />
    </button>
  );
}
