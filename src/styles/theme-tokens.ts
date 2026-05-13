export type ThemeMode = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

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
    background: "#050507",
    surface: "#0D0D12",
    elevatedSurface: "#14141C",
    primaryAccent: "#4F7CFF",
    accentGlow: "#6E5BFF",
    livePulse: "#FF4D5A",
    success: "#00B894",
    border: "#232336",
    textPrimary: "#F5F7FF",
    textSecondary: "#9AA4C7",
  },
  borders: {
    subtle: "color-mix(in srgb, #F5F7FF 10%, transparent)",
    strong: "color-mix(in srgb, #4F7CFF 30%, transparent)",
  },
  shadows: {
    card: "0 24px 80px rgba(2, 6, 23, 0.35)",
    cinematic: "0 35px 120px rgba(1, 3, 14, 0.6)",
  },
  glows: {
    primary: "0 0 30px color-mix(in srgb, #4F7CFF 35%, transparent)",
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
    background: "#F5F7FB",
    surface: "#FFFFFF",
    elevatedSurface: "#F0F3FA",
    primaryAccent: "#3366FF",
    accentGlow: "#5B4DFF",
    livePulse: "#E63946",
    success: "#008A67",
    border: "#DCE3F1",
    textPrimary: "#111827",
    textSecondary: "#5B647A",
  },
  borders: {
    subtle: "color-mix(in srgb, #111827 12%, transparent)",
    strong: "color-mix(in srgb, #3366FF 28%, transparent)",
  },
  shadows: {
    card: "0 16px 44px rgba(29, 41, 69, 0.12)",
    cinematic: "0 28px 64px rgba(51, 102, 255, 0.1)",
  },
  glows: {
    primary: "0 0 24px color-mix(in srgb, #3366FF 16%, transparent)",
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
    muted: "#5B647A",
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
  dark: darkTheme,
  light: lightTheme,
};
