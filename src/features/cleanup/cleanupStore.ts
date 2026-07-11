import { create } from "zustand";
import { persist } from "zustand/middleware";
import { classifyPaths, executeCleanup } from "@/lib/api/cleanup";
import type {
  CleanupItem,
  CleanupItemKind,
  CleanupReport,
} from "@/types/cleanup";

export interface CleanupEntry {
  path: string;
  name: string;
  kind: CleanupItemKind;
  sizeBytes: number;
}

interface CleanupStore {
  items: CleanupItem[];
  executing: boolean;
  lastReport: CleanupReport | null;
  lastError: string | null;
  addClassified: (items: CleanupItem[]) => void;
  addEntries: (entries: CleanupEntry[]) => Promise<void>;
  remove: (path: string) => void;
  clear: () => void;
  execute: (permanent: boolean) => Promise<void>;
  dismissReport: () => void;
}

export function queueTotals(items: CleanupItem[]): {
  count: number;
  bytes: number;
} {
  return {
    count: items.length,
    bytes: items.reduce((sum, item) => sum + item.sizeBytes, 0),
  };
}

export const useCleanupStore = create<CleanupStore>()(
  persist(
    (set, get) => ({
      items: [],
      executing: false,
      lastReport: null,
      lastError: null,

      addClassified(newItems) {
        const existing = new Set(get().items.map((item) => item.path));
        const additions = newItems.filter((item) => !existing.has(item.path));
        if (additions.length > 0) {
          set({ items: [...get().items, ...additions] });
        }
      },

      async addEntries(entries) {
        const assessments = await classifyPaths(entries.map((entry) => entry.path));
        const items = entries.map((entry, index) => {
          const assessment = assessments[index];
          return {
            ...entry,
            riskLevel: assessment?.riskLevel ?? "moderate",
            reason: assessment?.reason ?? "Review this item before cleanup",
            protected: assessment?.protected ?? false,
          };
        });
        get().addClassified(items);
      },

      remove(path) {
        set({ items: get().items.filter((item) => item.path !== path) });
      },

      clear() {
        set({ items: [] });
      },

      async execute(permanent) {
        const { items, executing } = get();
        if (executing || items.length === 0) {
          return;
        }
        set({ executing: true, lastError: null });
        try {
          const report = await executeCleanup(
            items.map((item) => ({ path: item.path, sizeBytes: item.sizeBytes })),
            permanent,
          );
          const succeeded = new Set(
            report.outcomes
              .filter((outcome) => outcome.success)
              .map((outcome) => outcome.path),
          );
          set({
            items: get().items.filter((item) => !succeeded.has(item.path)),
            lastReport: report,
          });
        } catch (error) {
          set({
            lastError:
              error && typeof error === "object" && "message" in error
                ? String((error as { message: unknown }).message)
                : String(error),
          });
        } finally {
          set({ executing: false });
        }
      },

      dismissReport() {
        set({ lastReport: null, lastError: null });
      },
    }),
    {
      name: "diskscope.cleanup-queue",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
