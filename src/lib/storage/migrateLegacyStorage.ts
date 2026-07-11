const MIGRATION_MARKER = "storageview.migration.v1";

const KEY_MAPPINGS: [string, string][] = [
  ["diskscope.theme", "storageview.theme"],
  ["diskscope.settings", "storageview.settings"],
  ["diskscope.cleanup-queue", "storageview.cleanup-queue"],
  ["diskscope.scan-history", "storageview.scan-history"],
];

export function migrateLegacyStorage(
  storage: Pick<Storage, "getItem" | "setItem">,
): void {
  if (storage.getItem(MIGRATION_MARKER) !== null) {
    return;
  }
  for (const [legacyKey, newKey] of KEY_MAPPINGS) {
    if (storage.getItem(newKey) !== null) {
      continue;
    }
    const legacyValue = storage.getItem(legacyKey);
    if (legacyValue !== null) {
      storage.setItem(newKey, legacyValue);
    }
  }
  storage.setItem(MIGRATION_MARKER, "1");
}
