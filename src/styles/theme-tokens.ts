import {
  darkDesignTokens,
  designTokensByMode,
  lightDesignTokens,
  type ResolvedTheme,
} from "@/styles/design-tokens";

export type { ThemeMode, ResolvedTheme } from "@/styles/design-tokens";

export type ThemeTokens = {
  colors: {
    background: string;
    surface: string;
    elevatedSurface: string;
    primaryAccent: string;
    accentGlow: string;
    livePulse: string;
    success: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
  };
  borders: {
    subtle: string;
    strong: string;
  };
  shadows: {
    card: string;
    cinematic: string;
  };
  glows: {
    primary: string;
    secondary: string;
  };
  gradients: {
    cinematic: string;
    surface: string;
  };
  typography: {
    heading: string;
    body: string;
    muted: string;
  };
  charts: {
    positive: string;
    negative: string;
    neutral: string;
    batting: string;
    bowling: string;
    grid: string;
    axis: string;
    tooltipBg: string;
    tooltipText: string;
    areaPositive: string;
    areaNegative: string;
  };
  overlays: {
    pageOverlay: string;
    modalBackdrop: string;
  };
};

export const darkTheme: ThemeTokens = {
  colors: {
    background: darkDesignTokens.colors.background,
    surface: darkDesignTokens.colors.surface,
    elevatedSurface: darkDesignTokens.colors.elevatedSurface,
    primaryAccent: darkDesignTokens.colors.accentBrand,
    accentGlow: darkDesignTokens.colors.accentGlow,
    livePulse: darkDesignTokens.colors.accentLive,
    success: darkDesignTokens.colors.accentSuccess,
    border: darkDesignTokens.colors.borderStrong,
    textPrimary: darkDesignTokens.colors.textPrimary,
    textSecondary: darkDesignTokens.colors.textSecondary,
  },
  borders: {
    subtle: darkDesignTokens.colors.borderSubtle,
    strong: darkDesignTokens.colors.borderStrong,
  },
  shadows: {
    card: darkDesignTokens.shadows.level2,
    cinematic: darkDesignTokens.shadows.level1,
  },
  glows: {
    primary: darkDesignTokens.shadows.glowBrand,
    secondary: "0 0 40px color-mix(in srgb, #6E5BFF 30%, transparent)",
  },
  gradients: {
    cinematic:
      "linear-gradient(135deg, color-mix(in srgb, #4F7CFF 22%, transparent), color-mix(in srgb, #6E5BFF 14%, transparent))",
    surface:
      "linear-gradient(160deg, color-mix(in srgb, #0D0D12 92%, #14141C), #0D0D12)",
  },
  typography: {
    heading: "#F5F7FF",
    body: "#E8ECFF",
    muted: "#9AA4C7",
  },
  charts: {
    positive: "#00B894",
    negative: "#FF4D5A",
    neutral: "#F59E0B",
    batting: "#4F7CFF",
    bowling: "#FF7A59",
    grid: "color-mix(in srgb, #F5F7FF 18%, transparent)",
    axis: "#AEB7D8",
    tooltipBg: "#0D0D12",
    tooltipText: "#F5F7FF",
    areaPositive: "rgba(0, 184, 148, 0.35)",
    areaNegative: "rgba(255, 77, 90, 0.35)",
  },
  overlays: {
    pageOverlay: "rgba(5, 5, 7, 0.72)",
    modalBackdrop: "rgba(5, 5, 7, 0.82)",
  },
};

export const lightTheme: ThemeTokens = {
  colors: {
    background: lightDesignTokens.colors.background,
    surface: lightDesignTokens.colors.surface,
    elevatedSurface: lightDesignTokens.colors.elevatedSurface,
    primaryAccent: lightDesignTokens.colors.accentBrand,
    accentGlow: lightDesignTokens.colors.accentGlow,
    livePulse: lightDesignTokens.colors.accentLive,
    success: lightDesignTokens.colors.accentSuccess,
    border: lightDesignTokens.colors.borderStrong,
    textPrimary: lightDesignTokens.colors.textPrimary,
    textSecondary: lightDesignTokens.colors.textSecondary,
  },
  borders: {
    subtle: lightDesignTokens.colors.borderSubtle,
    strong: "color-mix(in srgb, #3366FF 28%, transparent)",
  },
  shadows: {
    card: lightDesignTokens.shadows.level2,
    cinematic: lightDesignTokens.shadows.level1,
  },
  glows: {
    primary: lightDesignTokens.shadows.glowBrand,
    secondary: "0 0 24px color-mix(in srgb, #5B4DFF 14%, transparent)",
  },
  gradients: {
    cinematic:
      "linear-gradient(135deg, color-mix(in srgb, #3366FF 12%, transparent), color-mix(in srgb, #5B4DFF 8%, transparent))",
    surface:
      "linear-gradient(160deg, color-mix(in srgb, #FFFFFF 88%, #F0F3FA), #FFFFFF)",
  },
  typography: {
    heading: "#111827",
    body: "#1F2937",
    muted: "#4D5872",
  },
  charts: {
    positive: "#008A67",
    negative: "#D7263D",
    neutral: "#C08400",
    batting: "#3366FF",
    bowling: "#F97316",
    grid: "color-mix(in srgb, #111827 14%, transparent)",
    axis: "#4B556B",
    tooltipBg: "#FFFFFF",
    tooltipText: "#111827",
    areaPositive: "rgba(0, 138, 103, 0.18)",
    areaNegative: "rgba(215, 38, 61, 0.16)",
  },
  overlays: {
    pageOverlay: "rgba(245, 247, 251, 0.58)",
    modalBackdrop: "rgba(220, 227, 241, 0.62)",
  },
};

export const themeTokensByMode: Record<ResolvedTheme, ThemeTokens> = {
  dark: {
    ...darkTheme,
    colors: { ...darkTheme.colors, background: designTokensByMode.dark.colors.background },
  },
  light: {
    ...lightTheme,
    colors: { ...lightTheme.colors, background: designTokensByMode.light.colors.background },
  },
};
