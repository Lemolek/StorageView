import { invoke } from "@tauri-apps/api/core";
import type { DiskInfo } from "@/types/storage";

export function listDisks(): Promise<DiskInfo[]> {
  return invoke<DiskInfo[]>("list_disks");
}

export function openPath(path: string): Promise<void> {
  return invoke<void>("open_path", { path });
}

export function revealPath(path: string): Promise<void> {
  return invoke<void>("reveal_path", { path });
}
