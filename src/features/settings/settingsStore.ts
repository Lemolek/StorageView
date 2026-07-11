import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ADVANCED_UNLOCK_PHRASE = "I understand the risk";

interface SettingsStore {
  ignoredPaths: string[];
  defaultScanLocation: string | null;
  advancedCleanupUnlocked: boolean;
  setIgnoredPaths: (paths: string[]) => void;
  setDefaultScanLocation: (path: string | null) => void;
  unlockAdvancedCleanup: (phrase: string) => boolean;
  lockAdvancedCleanup: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ignoredPaths: [],
      defaultScanLocation: null,
      advancedCleanupUnlocked: false,

      setIgnoredPaths(paths) {
        set({
          ignoredPaths: paths
            .map((path) => path.trim())
            .filter((path) => path.length > 0),
        });
      },

      setDefaultScanLocation(path) {
        set({ defaultScanLocation: path });
      },

      unlockAdvancedCleanup(phrase) {
        if (phrase.trim() !== ADVANCED_UNLOCK_PHRASE) {
          return false;
        }
        set({ advancedCleanupUnlocked: true });
        return true;
      },

      lockAdvancedCleanup() {
        set({ advancedCleanupUnlocked: false });
      },
    }),
    { name: "diskscope.settings" },
  ),
);
