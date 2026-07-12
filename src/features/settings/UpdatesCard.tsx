import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppInfo } from "@/hooks/useAppInfo";
import { isDesktopRuntime } from "@/lib/api/app";
import {
  checkForUpdates,
  installUpdate,
  restartApplication,
  type UpdateStatus,
} from "@/lib/api/updates";

type Phase = "idle" | "checking" | "upToDate" | "available" | "installing" | "installed" | "error";

export function UpdatesCard() {
  const appInfo = useAppInfo();
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkNow = async () => {
    setPhase("checking");
    setError(null);
    try {
      const result = await checkForUpdates(appInfo?.version ?? "");
      setStatus(result);
      setPhase(result.available ? "available" : "upToDate");
    } catch (cause) {
      setError(
        cause && typeof cause === "object" && "message" in cause
          ? String((cause as { message: unknown }).message)
          : String(cause),
      );
      setPhase("error");
    }
  };

  const install = async () => {
    if (!status?.update) {
      return;
    }
    setPhase("installing");
    try {
      await installUpdate(status.update);
      setPhase("installed");
    } catch (cause) {
      setError(
        cause && typeof cause === "object" && "message" in cause
          ? String((cause as { message: unknown }).message)
          : String(cause),
      );
      setPhase("error");
    }
  };

  if (!isDesktopRuntime()) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium">Updates</h2>
          <p className="mt-1 text-sm text-muted">
            Current version: {appInfo?.version ?? "—"}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={phase === "checking" || phase === "installing"}
          onClick={() => void checkNow()}
        >
          {phase === "checking" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Check for updates
        </Button>
      </div>
      {phase === "upToDate" ? (
        <p className="mt-3 text-sm text-success">StorageView is up to date.</p>
      ) : null}
      {phase === "available" && status ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm">
            Version {status.availableVersion} is available.
          </p>
          {status.notes ? (
            <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm text-muted">
              {status.notes}
            </p>
          ) : null}
          <Button size="sm" onClick={() => void install()}>
            Download and install
          </Button>
        </div>
      ) : null}
      {phase === "installing" ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          Downloading and installing the update…
        </p>
      ) : null}
      {phase === "installed" ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-success">
            Update installed. Restart to finish.
          </p>
          <Button size="sm" onClick={() => void restartApplication()}>
            Restart now
          </Button>
        </div>
      ) : null}
      {phase === "error" ? (
        <div className="mt-3">
          <p className="text-sm font-medium">Update service unavailable</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
        </div>
      ) : null}
    </Card>
  );
}
