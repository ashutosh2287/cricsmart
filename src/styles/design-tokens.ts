export type ThemeMode = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export type DesignTokens = {
  colors: {
    background: string;
    surface: string;
    elevatedSurface: string;
    overlay: string;
    card: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    borderSubtle: string;
    borderStrong: string;
    accentBrand: string;
    accentGlow: string;
    accentLive: string;
    accentDanger: string;
    accentSuccess: string;
    accentAmber: string;
  };
  spacing: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    8: string;
    10: string;
    12: string;
  };
  typography: {
    heading1: { size: string; lineHeight: string; weight: number; tracking: string };
    heading2: { size: string; lineHeight: string; weight: number; tracking: string };
    heading3: { size: string; lineHeight: string; weight: number; tracking: string };
    body: { size: string; lineHeight: string; weight: number; tracking: string };
    caption: { size: string; lineHeight: string; weight: number; tracking: string };
    scoreDisplay: { size: string; lineHeight: string; weight: number; tracking: string };
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    pill: string;
  };
  borders: {
    level1: string;
    level2: string;
    level3: string;
  };
  shadows: {
    level1: string;
    level2: string;
    level3: string;
    glowBrand: string;
  };
  motion: {
    fast: number;
    base: number;
    slow: number;
    easingStandard: [number, number, number, number];
    easingEmphasized: [number, number, number, number];
  };
  zIndex: {
    base: number;
    sticky: number;
    nav: number;
    overlay: number;
    modal: number;
    toast: number;
  };
};

export const darkDesignTokens: DesignTokens = {
  colors: {
    background: "#050507",
    surface: "#0D0D12",
    elevatedSurface: "#14141C",
    overlay: "color-mix(in srgb, #14141c 80%, #050507)",
    card: "#0D0D12",
    textPrimary: "#F5F7FF",
    textSecondary: "#9AA4C7",
    textMuted: "#6F7AA3",
    borderSubtle: "color-mix(in srgb, #F5F7FF 10%, transparent)",
    borderStrong: "color-mix(in srgb, #4F7CFF 30%, transparent)",
    accentBrand: "#4F7CFF",
    accentGlow: "#6E5BFF",
    accentLive: "#FF4D5A",
    accentDanger: "#FF4D5A",
    accentSuccess: "#00B894",
    accentAmber: "#F4B740",
  },
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
  },
  typography: {
    heading1: { size: "28px", lineHeight: "1.1", weight: 700, tracking: "-0.02em" },
    heading2: { size: "20px", lineHeight: "1.2", weight: 600, tracking: "-0.01em" },
    heading3: { size: "15px", lineHeight: "1.25", weight: 600, tracking: "0" },
    body: { size: "14px", lineHeight: "1.5", weight: 400, tracking: "0" },
    caption: { size: "12px", lineHeight: "1.35", weight: 400, tracking: "0.02em" },
    scoreDisplay: { size: "72px", lineHeight: "0.92", weight: 800, tracking: "-0.04em" },
  },
  radii: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    pill: "999px",
  },
  borders: {
    level1: "1px solid color-mix(in srgb, #4F7CFF 32%, transparent)",
    level2: "1px solid color-mix(in srgb, #F5F7FF 12%, transparent)",
    level3: "1px solid color-mix(in srgb, #F5F7FF 8%, transparent)",
  },
  shadows: {
    level1: "0 22px 70px rgba(3, 8, 24, 0.5)",
    level2: "0 16px 42px rgba(2, 6, 23, 0.34)",
    level3: "0 10px 26px rgba(2, 6, 23, 0.2)",
    glowBrand: "0 0 36px color-mix(in srgb, #6E5BFF 28%, transparent)",
  },
  motion: {
    fast: 0.16,
    base: 0.24,
    slow: 0.34,
    easingStandard: [0.22, 1, 0.36, 1],
    easingEmphasized: [0.2, 0.8, 0.2, 1],
  },
  zIndex: {
    base: 1,
    sticky: 20,
    nav: 50,
    overlay: 90,
    modal: 100,
    toast: 110,
  },
};

export const lightDesignTokens: DesignTokens = {
  ...darkDesignTokens,
  colors: {
    background: "#F5F7FB",
    surface: "#FFFFFF",
    elevatedSurface: "#EFF2F8",
    overlay: "color-mix(in srgb, #ffffff 80%, #e6ebf5)",
    card: "#FFFFFF",
    textPrimary: "#111827",
    textSecondary: "#374151",
    textMuted: "#6B7280",
    borderSubtle: "color-mix(in srgb, #111827 14%, transparent)",
    borderStrong: "#D1D5DB",
    accentBrand: "#3366FF",
    accentGlow: "#5B4DFF",
    accentLive: "#E63946",
    accentDanger: "#D7263D",
    accentSuccess: "#008A67",
    accentAmber: "#C08400",
  },
  borders: {
    level1: "1px solid color-mix(in srgb, #3366FF 26%, transparent)",
    level2: "1px solid #D1D5DB",
    level3: "1px solid color-mix(in srgb, #111827 12%, transparent)",
  },
  shadows: {
    level1: "0 18px 50px rgba(24, 39, 75, 0.16)",
    level2: "0 14px 32px rgba(24, 39, 75, 0.11)",
    level3: "0 6px 20px rgba(24, 39, 75, 0.08)",
    glowBrand: "0 0 24px color-mix(in srgb, #5B4DFF 16%, transparent)",
  },
};

export const designTokensByMode: Record<ResolvedTheme, DesignTokens> = {
  dark: darkDesignTokens,
  light: lightDesignTokens,
};
