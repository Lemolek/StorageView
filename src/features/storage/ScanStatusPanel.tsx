import { useNavigate } from "react-router-dom";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatBytes } from "@/lib/format/bytes";
import { formatDuration } from "@/lib/format/datetime";
import { useScanStore } from "./scanStore";

function scanSpeed(bytesScanned: number, elapsedMs: number): string {
  if (elapsedMs <= 0) {
    return "—";
  }
  return `${formatBytes((bytesScanned / elapsedMs) * 1000)}/s`;
}

export function ScanStatusPanel() {
  const { status, scanPath, progress, result, error, cancelScan, dismissError } =
    useScanStore();
  const navigate = useNavigate();

  if (error) {
    return (
      <Card className="mb-6 flex items-start justify-between gap-4 border-danger/40 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Scan failed</p>
            <p className="mt-1 break-all text-sm text-muted">{error}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={dismissError}>
          Dismiss
        </Button>
      </Card>
    );
  }

  if (status === "scanning") {
    return (
      <Card className="mb-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Loader2
              className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">Scanning {scanPath}</p>
              <p className="mt-1 truncate text-xs text-muted">
                {progress?.currentPath ?? "Preparing scan…"}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void cancelScan()}>
            Cancel
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Files</p>
            <p className="font-medium">
              {(progress?.filesScanned ?? 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Scanned</p>
            <p className="font-medium">{formatBytes(progress?.bytesScanned ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Speed</p>
            <p className="font-medium">
              {progress ? scanSpeed(progress.bytesScanned, progress.elapsedMs) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Elapsed</p>
            <p className="font-medium">
              {progress ? formatDuration(progress.elapsedMs) : "—"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (status === "complete" && result) {
    return (
      <Card className="mb-6 flex items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Scan complete — {result.rootPath}</p>
            <p className="mt-1 text-sm text-muted">
              {result.totalFiles.toLocaleString()} files ·{" "}
              {formatBytes(result.totalBytes)} in {formatDuration(result.elapsedMs)}
              {result.permissionErrors > 0
                ? ` · ${result.permissionErrors.toLocaleString()} locations skipped due to permissions`
                : ""}
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate("/explorer")}>
          Explore results
        </Button>
      </Card>
    );
  }

  return null;
}
