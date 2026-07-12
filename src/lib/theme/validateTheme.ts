import type { ThemeColors, ThemeExport, ThemeTokens } from "@/types/theme";
import { isValidHexColor } from "./color";

const COLOR_KEYS: (keyof ThemeColors)[] = [
  "background",
  "surface",
  "card",
  "elevated",
  "border",
  "textPrimary",
  "textSecondary",
  "accent",
  "accentSecondary",
  "success",
  "warning",
  "danger",
];

const TOKEN_KEYS = [
  "name",
  "colors",
  "chartPalette",
  "treemapPalette",
  "radiusPx",
  "shadowIntensity",
  "transparency",
  "blurPx",
  "animationSpeedMs",
];

const NUMERIC_RANGES: [string, number, number][] = [
  ["radiusPx", 4, 24],
  ["shadowIntensity", 0, 1],
  ["transparency", 0, 1],
  ["blurPx", 0, 24],
  ["animationSpeedMs", 80, 400],
];

export type ThemeParseResult =
  | { ok: true; tokens: ThemeTokens }
  | { ok: false; errors: string[] };

function isSafeString(value: string): boolean {
  return !value.includes("<") && !value.toLowerCase().includes("javascript:");
}

function validatePalette(value: unknown, label: string, errors: string[]): void {
  if (!Array.isArray(value) || value.length < 4 || value.length > 8) {
    errors.push(`${label} must contain between 4 and 8 colors`);
    return;
  }
  for (const entry of value) {
    if (typeof entry !== "string" || !isValidHexColor(entry)) {
      errors.push(`${label} contains an invalid color value`);
      return;
    }
  }
}

export function parseThemeExport(json: string): ThemeParseResult {
  const errors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, errors: ["The file is not valid JSON"] };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, errors: ["The file does not contain a theme object"] };
  }
  const root = parsed as Record<string, unknown>;
  for (const key of Object.keys(root)) {
    if (!["format", "version", "tokens"].includes(key)) {
      errors.push(`Unknown field: ${key}`);
    }
  }
  if (root.format !== "storageview-theme") {
    errors.push("Unsupported format");
  }
  if (root.version !== 1) {
    errors.push("Unsupported theme version");
  }
  const tokens = root.tokens;
  if (!tokens || typeof tokens !== "object" || Array.isArray(tokens)) {
    errors.push("Missing theme tokens");
    return { ok: false, errors };
  }
  const record = tokens as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!TOKEN_KEYS.includes(key)) {
      errors.push(`Unknown token field: ${key}`);
    }
  }
  const name = record.name;
  if (
    typeof name !== "string" ||
    name.trim().length < 1 ||
    name.length > 40 ||
    !isSafeString(name)
  ) {
    errors.push("Theme name must be 1-40 safe characters");
  }
  const colors = record.colors;
  if (!colors || typeof colors !== "object" || Array.isArray(colors)) {
    errors.push("Missing color tokens");
  } else {
    const colorRecord = colors as Record<string, unknown>;
    for (const key of Object.keys(colorRecord)) {
      if (!COLOR_KEYS.includes(key as keyof ThemeColors)) {
        errors.push(`Unknown color field: ${key}`);
      }
    }
    for (const key of COLOR_KEYS) {
      const value = colorRecord[key];
      if (typeof value !== "string" || !isValidHexColor(value)) {
        errors.push(`Invalid color for ${key}`);
      }
    }
  }
  validatePalette(record.chartPalette, "chartPalette", errors);
  validatePalette(record.treemapPalette, "treemapPalette", errors);
  for (const [key, min, max] of NUMERIC_RANGES) {
    const value = record[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
      errors.push(`${key} must be a number between ${min} and ${max}`);
    }
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, tokens: record as unknown as ThemeTokens };
}

export function serializeTheme(tokens: ThemeTokens): string {
  const payload: ThemeExport = { format: "storageview-theme", version: 1, tokens };
  return JSON.stringify(payload, null, 2);
}
