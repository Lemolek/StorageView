export function formatPercent(fraction: number, fractionDigits = 1): string {
  if (!Number.isFinite(fraction) || fraction < 0) {
    return "—";
  }
  return `${(fraction * 100).toFixed(fractionDigits)}%`;
}
