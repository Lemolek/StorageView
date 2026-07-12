import { describe, expect, it } from "vitest";
import { builtInThemes } from "./themes";
import { parseThemeExport, serializeTheme } from "./validateTheme";

const holo = builtInThemes[0]!.tokens;

describe("parseThemeExport", () => {
  it("accepts a serialized built-in theme", () => {
    const result = parseThemeExport(serializeTheme(holo));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tokens.name).toBe("Holo Black");
      expect(result.tokens.colors.accent).toBe("#7C6CFF");
    }
  });

  it("rejects invalid JSON", () => {
    expect(parseThemeExport("not json").ok).toBe(false);
  });

  it("rejects wrong version and format", () => {
    const bad = JSON.parse(serializeTheme(holo));
    bad.version = 2;
    const result = parseThemeExport(JSON.stringify(bad));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toContain("version");
    }
  });

  it("rejects invalid hex colors", () => {
    const bad = JSON.parse(serializeTheme(holo));
    bad.tokens.colors.accent = "purple";
    expect(parseThemeExport(JSON.stringify(bad)).ok).toBe(false);
  });

  it("rejects out-of-range numbers", () => {
    const bad = JSON.parse(serializeTheme(holo));
    bad.tokens.radiusPx = 99;
    expect(parseThemeExport(JSON.stringify(bad)).ok).toBe(false);
  });

  it("rejects unknown fields at root and token level", () => {
    const bad = JSON.parse(serializeTheme(holo));
    bad.tokens.script = "alert(1)";
    expect(parseThemeExport(JSON.stringify(bad)).ok).toBe(false);
    const badRoot = JSON.parse(serializeTheme(holo));
    badRoot.extra = true;
    expect(parseThemeExport(JSON.stringify(badRoot)).ok).toBe(false);
  });

  it("rejects unsafe name content", () => {
    const bad = JSON.parse(serializeTheme(holo));
    bad.tokens.name = "<script>";
    expect(parseThemeExport(JSON.stringify(bad)).ok).toBe(false);
  });

  it("rejects short palettes", () => {
    const bad = JSON.parse(serializeTheme(holo));
    bad.tokens.chartPalette = ["#FFFFFF"];
    expect(parseThemeExport(JSON.stringify(bad)).ok).toBe(false);
  });
});
