import type { ThemeTokens } from "@/types/theme";
import { hexToRgb, isDarkColor, mixHex } from "./color";

export function applyTheme(tokens: ThemeTokens): void {
  const style = document.documentElement.style;
  const { colors } = tokens;
  const dark = isDarkColor(colors.background);
  const accentRgb = hexToRgb(colors.accent) ?? [124, 108, 255];
  style.setProperty("--background", colors.background);
  style.setProperty("--surface", colors.surface);
  style.setProperty("--card", colors.card);
  style.setProperty("--elevated", colors.elevated);
  style.setProperty("--border", colors.border);
  style.setProperty("--foreground", colors.textPrimary);
  style.setProperty("--muted", colors.textSecondary);
  style.setProperty("--primary", colors.accent);
  style.setProperty(
    "--primary-foreground",
    isDarkColor(colors.accent) ? "#FFFFFF" : "#0A0A0A",
  );
  style.setProperty("--accent-secondary", colors.accentSecondary);
  style.setProperty("--success", colors.success);
  style.setProperty("--warning", colors.warning);
  style.setProperty("--danger", colors.danger);
  style.setProperty(
    "--sidebar",
    mixHex(colors.background, colors.surface, dark ? 0.4 : 1),
  );
  style.setProperty(
    "--card-hover",
    mixHex(colors.card, dark ? "#FFFFFF" : "#000000", 0.03),
  );
  style.setProperty(
    "--border-strong",
    mixHex(colors.border, dark ? "#FFFFFF" : "#000000", 0.09),
  );
  style.setProperty(
    "--accent-blue",
    mixHex(colors.accent, colors.accentSecondary, 0.45),
  );
  style.setProperty("--glow-rgb", accentRgb.join(", "));
  style.setProperty("--radius-app", `${tokens.radiusPx}px`);
  style.setProperty("--shadow-intensity", String(tokens.shadowIntensity));
  style.setProperty("--glass-alpha", String(1 - tokens.transparency));
  style.setProperty("--glass-blur", `${tokens.blurPx}px`);
  style.setProperty("--motion-ms", `${tokens.animationSpeedMs}ms`);
  style.setProperty("color-scheme", dark ? "dark" : "light");
}
