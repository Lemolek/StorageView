import { create } from "zustand";
import { useHistoryStore } from "@/features/reports/historyStore";
import { useSettingsStore } from "@/features/settings/settingsStore";
import {
  cancelScan as cancelScanCommand,
  startScan as startScanCommand,
} from "@/lib/api/scanning";
import type { ScanProgress, ScanResult } from "@/types/scan";

export type ScanStatus = "idle" | "scanning" | "complete";

interface ScanStore {
  status: ScanStatus;
  scanPath: string | null;
  progress: ScanProgress | null;
  result: ScanResult | null;
  error: string | null;
  startScan: (path: string) => Promise<void>;
  cancelScan: () => Promise<void>;
  updateProgress: (progress: ScanProgress) => void;
  dismissError: () => void;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function isCancellation(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: unknown }).code === "cancelled"
  );
}

export const useScanStore = create<ScanStore>((set, get) => ({
  status: "idle",
  scanPath: null,
  progress: null,
  result: null,
  error: null,

  async startScan(path) {
    if (get().status === "scanning") {
      return;
    }
    set({ status: "scanning", scanPath: path, progress: null, error: null });
    try {
      const ignoredPaths = useSettingsStore.getState().ignoredPaths;
      const result = await startScanCommand(path, ignoredPaths);
      set({ status: "complete", result, progress: null });
      useHistoryStore.getState().addFromResult(result);
    } catch (error) {
      set({
        status: get().result ? "complete" : "idle",
        progress: null,
        error: isCancellation(error) ? null : errorMessage(error),
      });
    }
  },

  async cancelScan() {
    if (get().status !== "scanning") {
      return;
    }
    await cancelScanCommand();
  },

  updateProgress(progress) {
    if (get().status === "scanning") {
      set({ progress });
    }
  },

  dismissError() {
    set({ error: null });
  },
}));
