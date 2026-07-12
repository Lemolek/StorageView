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

function ScanStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export function ScanStatusPanel() {
  const { status, scanPath, progress, result, error, cancelScan, dismissError } =
    useScanStore();
  const navigate = useNavigate();

  if (error) {
    return (
      <Card className="mb-4 flex items-start justify-between gap-4 border-danger/40 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground">Scan failed</p>
            <p className="mt-1 break-all text-xs text-muted">{error}</p>
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
      <Card className="glow-accent-soft mb-4 border-primary/40 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Loader2
              className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground">
                Scanning {scanPath}
              </p>
              <p className="mt-1 truncate text-[11px] text-muted">
                {progress?.currentPath ?? "Preparing scan…"}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void cancelScan()}>
            Cancel
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScanStat
            label="Files"
            value={(progress?.filesScanned ?? 0).toLocaleString()}
          />
          <ScanStat label="Scanned" value={formatBytes(progress?.bytesScanned ?? 0)} />
          <ScanStat
            label="Speed"
            value={progress ? scanSpeed(progress.bytesScanned, progress.elapsedMs) : "—"}
          />
          <ScanStat
            label="Elapsed"
            value={progress ? formatDuration(progress.elapsedMs) : "—"}
          />
        </div>
      </Card>
    );
  }

  if (status === "complete" && result) {
    return (
      <Card className="mb-4 flex items-start justify-between gap-4 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground">
              Scan complete — {result.rootPath}
            </p>
            <p className="mt-1 text-xs text-muted">
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
