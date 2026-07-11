import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { FileEntry, ScanProgress, ScanResult } from "@/types/scan";

export function startScan(
  path: string,
  ignoredPaths: string[],
): Promise<ScanResult> {
  return invoke<ScanResult>("start_scan", { path, ignoredPaths });
}

export function cancelScan(): Promise<void> {
  return invoke<void>("cancel_scan");
}

export function listExtensionFiles(
  path: string,
  extension: string,
  limit: number,
): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("list_extension_files", { path, extension, limit });
}

export function onScanProgress(
  handler: (progress: ScanProgress) => void,
): Promise<UnlistenFn> {
  return listen<ScanProgress>("scan-progress", (event) => handler(event.payload));
}
