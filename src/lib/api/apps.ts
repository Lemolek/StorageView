import { invoke } from "@tauri-apps/api/core";
import type {
  InstalledApp,
  LeftoverCandidate,
  RecycleBinSummary,
} from "@/types/apps";

export function listInstalledApps(): Promise<InstalledApp[]> {
  return invoke<InstalledApp[]>("list_installed_apps");
}

export function launchUninstall(appId: string): Promise<void> {
  return invoke<void>("launch_uninstall", { appId });
}

export function findAppLeftovers(
  name: string,
  publisher: string | null,
  installLocation: string | null,
): Promise<LeftoverCandidate[]> {
  return invoke<LeftoverCandidate[]>("find_app_leftovers", {
    name,
    publisher,
    installLocation,
  });
}

export function recycleBinSummary(): Promise<RecycleBinSummary> {
  return invoke<RecycleBinSummary>("recycle_bin_summary");
}

export function emptyRecycleBin(): Promise<void> {
  return invoke<void>("empty_recycle_bin");
}
