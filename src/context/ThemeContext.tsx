"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ResolvedTheme, ThemeMode } from "@/styles/theme-tokens";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

type ThemeProviderProps = {
  children: React.ReactNode;
};

const THEME_STORAGE_KEY = "cricsmart-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "dark";
  }

  if (typeof window.matchMedia !== "function") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light" || saved === "system") {
    return saved;
  }

  return null;
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return getSystemTheme();
  }

  return mode;
}

function applyHtmlTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  if (resolved === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme");
  }
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme() ?? "system");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handleSystemChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "light" : "dark");
    };

    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  useEffect(() => {
    applyHtmlTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);

    const nextResolved = resolveTheme(mode);
    if (mode !== "system") {
      applyHtmlTheme(nextResolved);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
