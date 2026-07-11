import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScanResult } from "@/types/scan";

const HISTORY_LIMIT = 50;

export interface ScanHistoryEntry {
  id: string;
  dateMs: number;
  rootPath: string;
  totalBytes: number;
  totalFiles: number;
  elapsedMs: number;
  largestFolderPath: string | null;
  largestFolderBytes: number | null;
  topExtension: string | null;
}

interface HistoryStore {
  entries: ScanHistoryEntry[];
  addFromResult: (result: ScanResult) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addFromResult(result) {
        const largestFolder = result.largestDirectories[0] ?? null;
        const topType = result.fileTypes[0] ?? null;
        const entry: ScanHistoryEntry = {
          id: crypto.randomUUID(),
          dateMs: Date.now(),
          rootPath: result.rootPath,
          totalBytes: result.totalBytes,
          totalFiles: result.totalFiles,
          elapsedMs: result.elapsedMs,
          largestFolderPath: largestFolder?.path ?? null,
          largestFolderBytes: largestFolder?.sizeBytes ?? null,
          topExtension: topType?.extension ?? null,
        };
        set({ entries: [entry, ...get().entries].slice(0, HISTORY_LIMIT) });
      },

      clear() {
        set({ entries: [] });
      },
    }),
    { name: "storageview.scan-history" },
  ),
);
