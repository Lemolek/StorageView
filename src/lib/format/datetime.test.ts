import { describe, expect, it } from "vitest";
import { formatDateTime, formatDuration } from "./datetime";

describe("formatDuration", () => {
  it("formats sub-second durations", () => {
    expect(formatDuration(0)).toBe("<1s");
    expect(formatDuration(999)).toBe("<1s");
  });

  it("formats seconds", () => {
    expect(formatDuration(1000)).toBe("1s");
    expect(formatDuration(59_000)).toBe("59s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(60_000)).toBe("1m 0s");
    expect(formatDuration(125_000)).toBe("2m 5s");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3_600_000)).toBe("1h 0m");
    expect(formatDuration(7_500_000)).toBe("2h 5m");
  });

  it("returns a placeholder for invalid input", () => {
    expect(formatDuration(-1)).toBe("—");
    expect(formatDuration(Number.NaN)).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("returns a placeholder for missing values", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime(0)).toBe("—");
  });

  it("formats valid timestamps", () => {
    expect(formatDateTime(Date.UTC(2026, 0, 15, 12, 0))).not.toBe("—");
  });
});
