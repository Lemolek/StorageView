const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHexColor(value: string): boolean {
  return HEX_PATTERN.test(value);
}

export function hexToRgb(hex: string): [number, number, number] | null {
  if (!isValidHexColor(hex)) {
    return null;
  }
  let normalized = hex.slice(1);
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((character) => character + character)
      .join("");
  }
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 0;
  }
  const [r, g, b] = rgb.map((channel) => {
    const scaled = channel / 255;
    return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(first: string, second: string): number {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  );
  return (luminances[0]! + 0.05) / (luminances[1]! + 0.05);
}

export function isDarkColor(hex: string): boolean {
  return relativeLuminance(hex) < 0.35;
}

export function mixHex(base: string, target: string, amount: number): string {
  const from = hexToRgb(base);
  const to = hexToRgb(target);
  if (!from || !to) {
    return base;
  }
  const clamped = Math.min(1, Math.max(0, amount));
  const channel = (index: number) =>
    Math.round(from[index]! + (to[index]! - from[index]!) * clamped);
  return `#${[channel(0), channel(1), channel(2)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}
