import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  hexToRgb,
  isDarkColor,
  isValidHexColor,
  relativeLuminance,
} from "./color";

describe("color utilities", () => {
  it("validates hex colors", () => {
    expect(isValidHexColor("#FFFFFF")).toBe(true);
    expect(isValidHexColor("#abc")).toBe(true);
    expect(isValidHexColor("#GGGGGG")).toBe(false);
    expect(isValidHexColor("FFFFFF")).toBe(false);
    expect(isValidHexColor("#12345")).toBe(false);
  });

  it("parses hex colors including shorthand", () => {
    expect(hexToRgb("#FF0000")).toEqual([255, 0, 0]);
    expect(hexToRgb("#0f0")).toEqual([0, 255, 0]);
    expect(hexToRgb("bad")).toBeNull();
  });

  it("computes WCAG contrast of black on white as 21", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 1);
  });

  it("computes luminance ordering", () => {
    expect(relativeLuminance("#FFFFFF")).toBeGreaterThan(
      relativeLuminance("#7C5CFF"),
    );
    expect(relativeLuminance("#7C5CFF")).toBeGreaterThan(
      relativeLuminance("#050505"),
    );
  });

  it("classifies dark and light colors", () => {
    expect(isDarkColor("#050505")).toBe(true);
    expect(isDarkColor("#FAFAFA")).toBe(false);
  });
});
