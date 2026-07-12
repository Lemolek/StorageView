import type { Theme, ThemeTokens } from "@/types/theme";

export const HOLO_ID = "builtin.holo-black";
export const LIGHT_ID = "builtin.light";

const holoTokens: ThemeTokens = {
  name: "Holo Black",
  colors: {
    background: "#000000",
    surface: "#050505",
    card: "#0A0A0A",
    elevated: "#080808",
    border: "#1A1A1A",
    textPrimary: "#FFFFFF",
    textSecondary: "#B7B7C2",
    accent: "#7C6CFF",
    accentSecondary: "#57D7FF",
    success: "#35D07F",
    warning: "#F0B44C",
    danger: "#FF5C74",
  },
  chartPalette: ["#7C6CFF", "#5B8CFF", "#57D7FF", "#35D07F", "#F0B44C", "#FF5C74"],
  treemapPalette: ["#7C6CFF", "#6455E0", "#5B8CFF", "#4A6BD1", "#57D7FF", "#3B3F8F"],
  radiusPx: 8,
  shadowIntensity: 0.35,
  transparency: 0.12,
  blurPx: 16,
  animationSpeedMs: 180,
};

const lightTokens: ThemeTokens = {
  name: "Light",
  colors: {
    background: "#FAFAFA",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    elevated: "#F4F4F5",
    border: "#E4E4E7",
    textPrimary: "#09090B",
    textSecondary: "#52525B",
    accent: "#6947FF",
    accentSecondary: "#007A8A",
    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
  },
  chartPalette: ["#6947FF", "#2563EB", "#0891B2", "#16A34A", "#D97706", "#DC2626"],
  treemapPalette: ["#6947FF", "#7E60FF", "#5B8CFF", "#86B6EF", "#0891B2", "#A2A8F0"],
  radiusPx: 8,
  shadowIntensity: 0.2,
  transparency: 0.05,
  blurPx: 14,
  animationSpeedMs: 180,
};

export const builtInThemes: Theme[] = [
  { id: HOLO_ID, builtIn: true, tokens: holoTokens },
  { id: LIGHT_ID, builtIn: true, tokens: lightTokens },
];
