import { describe, expect, it } from "vitest";
import { formatBytes } from "./bytes";

describe("formatBytes", () => {
  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats values below one kilobyte without fraction", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes and gigabytes", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
  });

  it("formats terabytes and petabytes", () => {
    expect(formatBytes(1024 ** 4)).toBe("1.0 TB");
    expect(formatBytes(3 * 1024 ** 5)).toBe("3.0 PB");
  });

  it("caps at the largest unit", () => {
    expect(formatBytes(1024 ** 6)).toBe("1024.0 PB");
  });

  it("respects custom fraction digits", () => {
    expect(formatBytes(1536, 2)).toBe("1.50 KB");
    expect(formatBytes(1536, 0)).toBe("2 KB");
  });

  it("returns a placeholder for invalid input", () => {
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes(Number.NaN)).toBe("—");
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe("—");
  });
});
