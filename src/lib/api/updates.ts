import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface UpdateStatus {
  available: boolean;
  currentVersion: string;
  availableVersion: string | null;
  notes: string | null;
  update: Update | null;
}

export async function checkForUpdates(currentVersion: string): Promise<UpdateStatus> {
  const update = await check();
  if (!update) {
    return {
      available: false,
      currentVersion,
      availableVersion: null,
      notes: null,
      update: null,
    };
  }
  return {
    available: true,
    currentVersion,
    availableVersion: update.version,
    notes: update.body ?? null,
    update,
  };
}

export async function installUpdate(update: Update): Promise<void> {
  await update.downloadAndInstall();
}

export function restartApplication(): Promise<void> {
  return relaunch();
}
