// Font configuration for cross-platform use
// On web: loads from Google Fonts via <link> tag in layout.tsx
// On React Native: loads from bundled .ttf files in assets/fonts/

export const fontFamilies = {
  display: {
    web: '"Space Grotesk", "DM Sans", sans-serif',
    native: "SpaceGrotesk",
  },
  body: {
    web: '"DM Sans", sans-serif',
    native: "DMSans",
  },
  mono: {
    web: '"JetBrains Mono", monospace',
    native: "JetBrainsMono",
  },
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
} as const;

// For React Native, import fonts like:
// import { useFonts } from "expo-font";
// import SpaceGrotesk from "../../assets/fonts/SpaceGrotesk-Regular.ttf";
// import SpaceGroteskBold from "../../assets/fonts/SpaceGrotesk-Bold.ttf";
//
// const [loaded] = useFonts({
//   SpaceGrotesk,
//   "SpaceGrotesk-Bold": SpaceGroteskBold,
// });

export const googleFontsUrl = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
