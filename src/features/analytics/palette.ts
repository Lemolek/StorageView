import { isDarkColor, mixHex } from "@/lib/theme/color";
import type { ThemeTokens } from "@/types/theme";

export interface ChartPalette {
  categorical: string[];
  other: string;
  bar: string;
  sequence: string[];
  grid: string;
  axisText: string;
  tooltipBackground: string;
  tooltipBorder: string;
  tooltipText: string;
  markStroke: string;
}

export function chartPalette(tokens: ThemeTokens): ChartPalette {
  const dark = isDarkColor(tokens.colors.background);
  return {
    categorical: tokens.chartPalette,
    other: mixHex(tokens.colors.textSecondary, tokens.colors.card, 0.35),
    bar: tokens.chartPalette[0] ?? tokens.colors.accent,
    sequence: tokens.treemapPalette,
    grid: dark ? "rgba(255,255,255,0.07)" : "#E4E4E7",
    axisText: tokens.colors.textSecondary,
    tooltipBackground: tokens.colors.card,
    tooltipBorder: tokens.colors.border,
    tooltipText: tokens.colors.textPrimary,
    markStroke: tokens.colors.surface,
  };
}
