import { describe, expect, it } from "vitest";
import { sortByAccessor } from "./sort";

interface Row {
  name: string;
  size: number;
  modified: number | null;
}

const rows: Row[] = [
  { name: "beta", size: 300, modified: 200 },
  { name: "Alpha", size: 100, modified: null },
  { name: "gamma", size: 200, modified: 100 },
];

describe("sortByAccessor", () => {
  it("sorts numbers descending", () => {
    const sorted = sortByAccessor(rows, (row) => row.size, "desc");
    expect(sorted.map((row) => row.size)).toEqual([300, 200, 100]);
  });

  it("sorts numbers ascending", () => {
    const sorted = sortByAccessor(rows, (row) => row.size, "asc");
    expect(sorted.map((row) => row.size)).toEqual([100, 200, 300]);
  });

  it("sorts strings case-insensitively", () => {
    const sorted = sortByAccessor(rows, (row) => row.name, "asc");
    expect(sorted.map((row) => row.name)).toEqual(["Alpha", "beta", "gamma"]);
  });

  it("places null values last regardless of direction", () => {
    const ascending = sortByAccessor(rows, (row) => row.modified, "asc");
    const descending = sortByAccessor(rows, (row) => row.modified, "desc");
    expect(ascending.map((row) => row.name)).toEqual(["gamma", "beta", "Alpha"]);
    expect(descending.map((row) => row.name)).toEqual(["beta", "gamma", "Alpha"]);
  });

  it("does not mutate the input array", () => {
    const input = [...rows];
    sortByAccessor(input, (row) => row.size, "asc");
    expect(input).toEqual(rows);
  });
});
