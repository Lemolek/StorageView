import { beforeEach, describe, expect, it } from "vitest";
import { queueTotals, useCleanupStore } from "./cleanupStore";
import type { CleanupItem } from "@/types/cleanup";

function item(path: string, sizeBytes: number): CleanupItem {
  return {
    path,
    name: path.split("\\").pop() ?? path,
    kind: "file",
    sizeBytes,
    riskLevel: "safe",
    reason: "Temporary or cache location",
    protected: false,
  };
}

describe("cleanupStore", () => {
  beforeEach(() => {
    useCleanupStore.setState({ items: [], lastReport: null, lastError: null });
  });

  it("adds classified items to the queue", () => {
    useCleanupStore.getState().addClassified([item("C:\\Temp\\a.tmp", 100)]);
    expect(useCleanupStore.getState().items).toHaveLength(1);
  });

  it("deduplicates items by path", () => {
    const store = useCleanupStore.getState();
    store.addClassified([item("C:\\Temp\\a.tmp", 100)]);
    store.addClassified([
      item("C:\\Temp\\a.tmp", 100),
      item("C:\\Temp\\b.tmp", 200),
    ]);
    expect(useCleanupStore.getState().items).toHaveLength(2);
  });

  it("removes items by path", () => {
    const store = useCleanupStore.getState();
    store.addClassified([
      item("C:\\Temp\\a.tmp", 100),
      item("C:\\Temp\\b.tmp", 200),
    ]);
    store.remove("C:\\Temp\\a.tmp");
    expect(useCleanupStore.getState().items.map((entry) => entry.path)).toEqual([
      "C:\\Temp\\b.tmp",
    ]);
  });

  it("clears the queue", () => {
    const store = useCleanupStore.getState();
    store.addClassified([item("C:\\Temp\\a.tmp", 100)]);
    store.clear();
    expect(useCleanupStore.getState().items).toHaveLength(0);
  });

  it("computes queue totals", () => {
    const items = [item("C:\\Temp\\a.tmp", 100), item("C:\\Temp\\b.tmp", 250)];
    expect(queueTotals(items)).toEqual({ count: 2, bytes: 350 });
  });
});
