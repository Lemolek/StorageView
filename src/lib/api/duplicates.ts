import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { DuplicateGroup, DuplicateProgress } from "@/types/cleanup";

export function scanDuplicates(
  path: string,
  minSizeBytes: number,
): Promise<DuplicateGroup[]> {
  return invoke<DuplicateGroup[]>("scan_duplicates", { path, minSizeBytes });
}

export function onDuplicateProgress(
  handler: (progress: DuplicateProgress) => void,
): Promise<UnlistenFn> {
  return listen<DuplicateProgress>("duplicate-progress", (event) =>
    handler(event.payload),
  );
}
