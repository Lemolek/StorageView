import { describe, expect, it } from "vitest";
import { buildScanReportCsv, csvEscape, toCsv } from "./csv";
import type { ScanResult } from "@/types/scan";

describe("csvEscape", () => {
  it("returns plain values unchanged", () => {
    expect(csvEscape("report")).toBe("report");
    expect(csvEscape(42)).toBe("42");
  });

  it("returns empty string for missing values", () => {
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
  });

  it("quotes values with commas, quotes and newlines", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("toCsv", () => {
  it("joins rows with CRLF", () => {
    expect(toCsv([["a", "b"], ["c", 1]])).toBe("a,b\r\nc,1");
  });
});

describe("buildScanReportCsv", () => {
  const result: ScanResult = {
    rootPath: "C:\\Data",
    totalFiles: 2,
    totalDirectories: 1,
    totalBytes: 3072,
    permissionErrors: 0,
    elapsedMs: 1500,
    largestFiles: [
      {
        name: "video, final.mp4",
        path: "C:\\Data\\video, final.mp4",
        extension: "mp4",
        sizeBytes: 2048,
        modifiedMs: 1700000000000,
      },
    ],
    largestDirectories: [
      { name: "Data", path: "C:\\Data\\sub", sizeBytes: 3072, fileCount: 2 },
    ],
    fileTypes: [
      { extension: "mp4", totalBytes: 2048, fileCount: 1, largestFileBytes: 2048 },
    ],
    ageDistribution: [],
  };

  it("contains header, sections and escaped values", () => {
    const csv = buildScanReportCsv(result);
    expect(csv).toContain("StorageView Scan Report");
    expect(csv).toContain("Largest Files");
    expect(csv).toContain("Largest Folders");
    expect(csv).toContain("File Types");
    expect(csv).toContain('"video, final.mp4"');
    expect(csv).toContain("C:\\Data\\sub");
  });
});
