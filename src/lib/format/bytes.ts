const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
const BYTES_PER_UNIT = 1024;

export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }
  if (bytes < BYTES_PER_UNIT) {
    return `${Math.round(bytes)} B`;
  }
  let value = bytes;
  let unitIndex = 0;
  while (value >= BYTES_PER_UNIT && unitIndex < BYTE_UNITS.length - 1) {
    value /= BYTES_PER_UNIT;
    unitIndex += 1;
  }
  const unit = BYTE_UNITS[unitIndex] ?? "B";
  return `${value.toFixed(fractionDigits)} ${unit}`;
}
