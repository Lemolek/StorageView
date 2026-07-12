import { describe, expect, it } from "vitest";
import { squarify, type TreemapRect } from "./squarify";

function area(rect: TreemapRect): number {
  return rect.width * rect.height;
}

describe("squarify", () => {
  it("returns empty layout for empty or degenerate input", () => {
    expect(squarify([], 100, 100)).toEqual([]);
    expect(squarify([{ key: "a", value: 10 }], 0, 100)).toEqual([]);
    expect(squarify([{ key: "a", value: 0 }], 100, 100)).toEqual([]);
  });

  it("fills the whole area with a single item", () => {
    const rects = squarify([{ key: "a", value: 42 }], 200, 100);
    expect(rects).toHaveLength(1);
    expect(area(rects[0]!)).toBeCloseTo(20_000, 5);
  });

  it("produces areas proportional to values", () => {
    const rects = squarify(
      [
        { key: "a", value: 600 },
        { key: "b", value: 300 },
        { key: "c", value: 100 },
      ],
      100,
      100,
    );
    const byKey = new Map(rects.map((rect) => [rect.key, area(rect)]));
    expect(byKey.get("a")!).toBeCloseTo(6000, 4);
    expect(byKey.get("b")!).toBeCloseTo(3000, 4);
    expect(byKey.get("c")!).toBeCloseTo(1000, 4);
  });

  it("keeps every rect within bounds and covers the area", () => {
    const rects = squarify(
      Array.from({ length: 12 }, (_, index) => ({
        key: `item-${index}`,
        value: (index + 1) * 7,
      })),
      320,
      180,
    );
    let covered = 0;
    for (const rect of rects) {
      expect(rect.x).toBeGreaterThanOrEqual(-1e-6);
      expect(rect.y).toBeGreaterThanOrEqual(-1e-6);
      expect(rect.x + rect.width).toBeLessThanOrEqual(320 + 1e-6);
      expect(rect.y + rect.height).toBeLessThanOrEqual(180 + 1e-6);
      covered += area(rect);
    }
    expect(covered).toBeCloseTo(320 * 180, 3);
  });

  it("filters non-positive values and keeps the rest proportional", () => {
    const rects = squarify(
      [
        { key: "a", value: 50 },
        { key: "zero", value: 0 },
        { key: "b", value: 50 },
      ],
      100,
      100,
    );
    expect(rects.map((rect) => rect.key).sort()).toEqual(["a", "b"]);
    expect(area(rects[0]!)).toBeCloseTo(5000, 4);
  });
});
