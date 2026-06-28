// Design tokens exported as JS objects for React Native / cross-platform use
// Mirror of the CSS custom properties in globals.css

export const colors = {
  brand: "#00E5FF",
  brandDark: "#00B8D4",
  brandLight: "#003D47",
  brandText: "#B2EBF2",
  accent: "#7C3AED",
  accentLight: "#1E1040",
  danger: "#EF4444",
  dangerLight: "#3B1111",
  success: "#00FF87",
  successLight: "#003D1F",
  amber: "#F59E0B",
  amberLight: "#3D2800",

  surface: "#0A1628",
  surface2: "#040A14",
  surface3: "#0F1D32",
  surface4: "#162240",

  text1: "#F0F4F8",
  text2: "#94A3B8",
  text3: "#8896A6",
  textInv: "#040A14",

  border: "rgba(255, 255, 255, 0.06)",
  borderMed: "rgba(255, 255, 255, 0.12)",
  borderBright: "rgba(0, 229, 255, 0.2)",
} as const;

export const lightColors = {
  brand: "#0891B2",
  brandDark: "#0E7490",
  brandLight: "#E0F7FA",
  brandText: "#164E63",
  accent: "#7C3AED",
  accentLight: "#EDE9FE",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",
  success: "#16A34A",
  successLight: "#DCFCE7",
  amber: "#D97706",
  amberLight: "#FEF3C7",

  surface: "#FFFFFF",
  surface2: "#F8FAFC",
  surface3: "#F1F5F9",
  surface4: "#E2E8F0",

  text1: "#0F172A",
  text2: "#475569",
  text3: "#94A3B8",
  textInv: "#FFFFFF",

  border: "rgba(0, 0, 0, 0.08)",
  borderMed: "rgba(0, 0, 0, 0.14)",
  borderBright: "rgba(8, 145, 178, 0.3)",
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
} as const;

export const typography = {
  scoreDisplay: { size: 72, weight: "800" as const, lineHeight: 0.92 },
  scoreLarge: { size: 48, weight: "700" as const, lineHeight: 0.95 },
  heading1: { size: 28, weight: "700" as const, lineHeight: 1.1 },
  heading2: { size: 20, weight: "600" as const, lineHeight: 1.2 },
  heading3: { size: 15, weight: "600" as const, lineHeight: 1.25 },
  body: { size: 14, weight: "400" as const, lineHeight: 1.5 },
  caption: { size: 12, weight: "400" as const, lineHeight: 1.35 },
  liveMetric: { size: 13, weight: "600" as const, lineHeight: 1.2 },
  tabular: { size: 13, weight: "500" as const, lineHeight: 1.2 },
} as const;

export const shadows = {
  card: "0 1px 3px rgba(0, 0, 0, 0.5), 0 4px 20px rgba(0, 0, 0, 0.4)",
  hover: "0 8px 30px rgba(0, 229, 255, 0.15)",
  glowCyan: "0 0 20px rgba(0, 229, 255, 0.3)",
  glowPurple: "0 0 20px rgba(124, 58, 237, 0.3)",
  glowGreen: "0 0 20px rgba(0, 255, 135, 0.3)",
} as const;

export const fonts = {
  display: "Space Grotesk, DM Sans, sans-serif",
  body: "DM Sans, sans-serif",
  mono: "JetBrains Mono, monospace",
} as const;
