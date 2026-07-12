export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  elevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentSecondary: string;
  success: string;
  warning: string;
  danger: string;
}

export interface ThemeTokens {
  name: string;
  colors: ThemeColors;
  chartPalette: string[];
  treemapPalette: string[];
  radiusPx: number;
  shadowIntensity: number;
  transparency: number;
  blurPx: number;
  animationSpeedMs: number;
}

export interface Theme {
  id: string;
  builtIn: boolean;
  tokens: ThemeTokens;
}

export interface ThemeExport {
  format: "storageview-theme";
  version: 1;
  tokens: ThemeTokens;
}
