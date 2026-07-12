import { invoke } from "@tauri-apps/api/core";
import type { BrowseListing } from "@/types/browse";

export function browseDirectory(
  path: string,
  refresh = false,
): Promise<BrowseListing> {
  return invoke<BrowseListing>("browse_directory", { path, refresh });
}
