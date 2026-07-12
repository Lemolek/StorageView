import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ThemeSection } from "@/features/settings/ThemeSection";
import { UpdatesCard } from "@/features/settings/UpdatesCard";
import {
  ADVANCED_UNLOCK_PHRASE,
  useSettingsStore,
} from "@/features/settings/settingsStore";
import { useAppInfo } from "@/hooks/useAppInfo";
import { isDesktopRuntime } from "@/lib/api/app";
import { selectFolder } from "@/lib/api/dialog";

export function SettingsPage() {
  const appInfo = useAppInfo();
  const {
    ignoredPaths,
    defaultScanLocation,
    advancedCleanupUnlocked,
    setIgnoredPaths,
    setDefaultScanLocation,
    unlockAdvancedCleanup,
    lockAdvancedCleanup,
  } = useSettingsStore();
  const [ignoredDraft, setIgnoredDraft] = useState(ignoredPaths.join("\n"));
  const [unlockPhrase, setUnlockPhrase] = useState("");
  const [unlockError, setUnlockError] = useState(false);
  const desktop = isDesktopRuntime();

  const saveIgnored = () => {
    setIgnoredPaths(ignoredDraft.split("\n"));
  };

  const browseDefaultLocation = async () => {
    const folder = await selectFolder(defaultScanLocation);
    if (folder) {
      setDefaultScanLocation(folder);
    }
  };

  const tryUnlock = () => {
    const unlocked = unlockAdvancedCleanup(unlockPhrase);
    setUnlockError(!unlocked);
    if (unlocked) {
      setUnlockPhrase("");
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Application preferences and information."
      />
      <div className="space-y-6">
        <ThemeSection />
        <Card>
          <h2 className="text-base font-medium">Scanning</h2>
          <p className="mt-1 text-sm text-muted">
            Control the default scan location and paths excluded from scans.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium">Default scan location</p>
              <div className="mt-2 flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
                  {defaultScanLocation ?? "Not set"}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!desktop}
                  onClick={() => void browseDefaultLocation()}
                >
                  Browse…
                </Button>
                {defaultScanLocation ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDefaultScanLocation(null)}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Ignored paths</p>
              <p className="mt-1 text-xs text-muted">
                One path per line. Ignored paths are skipped by future scans.
              </p>
              <textarea
                value={ignoredDraft}
                onChange={(event) => setIgnoredDraft(event.target.value)}
                rows={4}
                spellCheck={false}
                className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary"
              />
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={saveIgnored}
              >
                Save ignored paths
              </Button>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-medium">Advanced Cleanup</h2>
          <p className="mt-1 text-sm text-muted">
            Advanced Cleanup enables permanent deletion for experienced users.
            Cleanup always requires confirmation, and protected system paths remain
            blocked.
          </p>
          {advancedCleanupUnlocked ? (
            <div className="mt-4 flex items-center gap-3">
              <p className="text-sm text-success">Advanced Cleanup is enabled.</p>
              <Button variant="secondary" size="sm" onClick={lockAdvancedCleanup}>
                Disable
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <label className="block text-xs text-muted" htmlFor="unlock-phrase">
                Type "{ADVANCED_UNLOCK_PHRASE}" to enable
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="unlock-phrase"
                  value={unlockPhrase}
                  onChange={(event) => setUnlockPhrase(event.target.value)}
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
                <Button variant="secondary" size="sm" onClick={tryUnlock}>
                  Enable
                </Button>
              </div>
              {unlockError ? (
                <p className="mt-2 text-xs text-danger">
                  The phrase does not match. Type it exactly as shown.
                </p>
              ) : null}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="text-base font-medium">Privacy</h2>
          <p className="mt-1 text-sm text-muted">
            Telemetry is disabled. StorageView works entirely locally and never
            uploads file paths, filenames or scan results.
          </p>
        </Card>
        <UpdatesCard />
        <Card>
          <h2 className="text-base font-medium">About</h2>
          <div className="mt-3 space-y-1 text-sm text-muted">
            <p className="text-foreground">
              {appInfo?.name ?? "StorageView"}
              {appInfo ? ` ${appInfo.version}` : ""}
            </p>
            <p>{appInfo?.tagline ?? "Analyze. Visualize. Optimize."}</p>
            <p>Created by Lemolek</p>
            <p>Copyright © 2026 Lemolek. All rights reserved.</p>
          </div>
        </Card>
      </div>
    </>
  );
}
