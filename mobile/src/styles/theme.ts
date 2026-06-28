// CricLens Mobile Theme
// Ported from web CSS variables in globals.css

export const darkTheme = {
  colors: {
    brand: "#00E5FF",
    brandDark: "#00B8D4",
    brandLight: "#003D47",
    accent: "#7C3AED",
    accentLight: "#1E1040",
    danger: "#EF4444",
    dangerLight: "#3B1111",
    success: "#00FF87",
    successLight: "#003D1F",
    amber: "#F59E0B",
    amberLight: "#3D2800",

    background: "#040A14",
    surface: "#0A1628",
    surface2: "#0F1D32",
    surface3: "#162240",

    text: "#F0F4F8",
    textSecondary: "#94A3B8",
    textMuted: "#8896A6",
    textInverse: "#040A14",

    border: "rgba(255, 255, 255, 0.06)",
    borderMed: "rgba(255, 255, 255, 0.12)",
    borderBright: "rgba(0, 229, 255, 0.2)",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
    xxxxxl: 48,
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 999,
  },
  typography: {
    scoreDisplay: { size: 48, weight: "800" as const, lineHeight: 56 },
    scoreLarge: { size: 36, weight: "700" as const, lineHeight: 44 },
    heading1: { size: 28, weight: "700" as const, lineHeight: 34 },
    heading2: { size: 20, weight: "600" as const, lineHeight: 28 },
    heading3: { size: 15, weight: "600" as const, lineHeight: 22 },
    body: { size: 14, weight: "400" as const, lineHeight: 22 },
    caption: { size: 12, weight: "400" as const, lineHeight: 18 },
    small: { size: 10, weight: "600" as const, lineHeight: 14 },
  },
  shadows: {
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 4,
    },
    hover: {
      shadowColor: "#00E5FF",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  fonts: {
    display: "SpaceGrotesk",
    body: "DMSans",
    mono: "JetBrainsMono",
  },
} as const;

export type Theme = typeof darkTheme;

// Re-export for convenience
export const colors = darkTheme.colors;
export const spacing = darkTheme.spacing;
export const radii = darkTheme.radii;
export const typography = darkTheme.typography;
