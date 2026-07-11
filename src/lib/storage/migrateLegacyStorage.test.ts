import { describe, expect, it } from "vitest";
import { migrateLegacyStorage } from "./migrateLegacyStorage";

function createFakeStorage(
  initial: Record<string, string> = {},
): Pick<Storage, "getItem" | "setItem"> & { entries: Map<string, string> } {
  const entries = new Map(Object.entries(initial));
  return {
    entries,
    getItem(key: string) {
      return entries.has(key) ? (entries.get(key) as string) : null;
    },
    setItem(key: string, value: string) {
      entries.set(key, value);
    },
  };
}

describe("migrateLegacyStorage", () => {
  it("writes only the marker on a fresh install", () => {
    const storage = createFakeStorage();

    migrateLegacyStorage(storage);

    expect(storage.entries.size).toBe(1);
    expect(storage.getItem("storageview.migration.v1")).toBe("1");
  });

  it("copies legacy values and preserves the old keys", () => {
    const storage = createFakeStorage({
      "diskscope.theme": "light",
      "diskscope.settings": '{"ignoredPaths":[]}',
      "diskscope.cleanup-queue": '{"items":[]}',
      "diskscope.scan-history": '{"entries":[]}',
    });

    migrateLegacyStorage(storage);

    expect(storage.getItem("storageview.theme")).toBe("light");
    expect(storage.getItem("storageview.settings")).toBe(
      '{"ignoredPaths":[]}',
    );
    expect(storage.getItem("storageview.cleanup-queue")).toBe('{"items":[]}');
    expect(storage.getItem("storageview.scan-history")).toBe('{"entries":[]}');
    expect(storage.getItem("diskscope.theme")).toBe("light");
    expect(storage.getItem("diskscope.settings")).toBe('{"ignoredPaths":[]}');
    expect(storage.getItem("diskscope.cleanup-queue")).toBe('{"items":[]}');
    expect(storage.getItem("diskscope.scan-history")).toBe('{"entries":[]}');
    expect(storage.getItem("storageview.migration.v1")).toBe("1");
  });

  it("does nothing on a second run", () => {
    const storage = createFakeStorage({ "diskscope.theme": "light" });

    migrateLegacyStorage(storage);
    storage.entries.set("storageview.theme", "dark");
    storage.entries.set("diskscope.settings", '{"late":true}');

    migrateLegacyStorage(storage);

    expect(storage.getItem("storageview.theme")).toBe("dark");
    expect(storage.getItem("storageview.settings")).toBeNull();
  });

  it("never overwrites existing new values", () => {
    const storage = createFakeStorage({
      "diskscope.theme": "light",
      "storageview.theme": "dark",
    });

    migrateLegacyStorage(storage);

    expect(storage.getItem("storageview.theme")).toBe("dark");
    expect(storage.getItem("diskscope.theme")).toBe("light");
  });
});
