import type { Theme, ThemeTokens } from "@/types/theme";

export const NOIR_ID = "builtin.noir";
export const LIGHT_ID = "builtin.light";

const noirTokens: ThemeTokens = {
  name: "Noir",
  colors: {
    background: "#050505",
    surface: "#0B0B0B",
    card: "#111111",
    elevated: "#171717",
    border: "#262626",
    textPrimary: "#FFFFFF",
    textSecondary: "#A1A1AA",
    accent: "#7C5CFF",
    accentSecondary: "#00E5FF",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
  },
  chartPalette: ["#7C5CFF", "#00E5FF", "#22C55E", "#F59E0B", "#E66767", "#D55181"],
  treemapPalette: ["#7C5CFF", "#6A4CE0", "#5940BE", "#48349C", "#38287A", "#291D5C"],
  radiusPx: 12,
  shadowIntensity: 0.5,
  transparency: 0.06,
  blurPx: 12,
  animationSpeedMs: 180,
};

const lightTokens: ThemeTokens = {
  name: "Light",
  colors: {
    background: "#FAFAFA",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    elevated: "#FFFFFF",
    border: "#E4E4E7",
    textPrimary: "#0A0A0A",
    textSecondary: "#52525B",
    accent: "#6D4AFF",
    accentSecondary: "#0891B2",
    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
  },
  chartPalette: ["#6D4AFF", "#0891B2", "#16A34A", "#D97706", "#E34948", "#C2417C"],
  treemapPalette: ["#6D4AFF", "#7E60FF", "#9077FF", "#A28EFF", "#B4A6FF", "#C6BDFF"],
  radiusPx: 12,
  shadowIntensity: 0.25,
  transparency: 0.04,
  blurPx: 12,
  animationSpeedMs: 180,
};

export const builtInThemes: Theme[] = [
  { id: NOIR_ID, builtIn: true, tokens: noirTokens },
  { id: LIGHT_ID, builtIn: true, tokens: lightTokens },
];
