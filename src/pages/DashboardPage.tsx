import { useNavigate } from "react-router-dom";
import { Folder, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { queueTotals, useCleanupStore } from "@/features/cleanup/cleanupStore";
import { useScanStore } from "@/features/storage/scanStore";
import { useDisks } from "@/hooks/useDisks";
import { isDesktopRuntime } from "@/lib/api/app";
import { formatBytes } from "@/lib/format/bytes";
import { formatDuration } from "@/lib/format/datetime";

export function DashboardPage() {
  const { disks } = useDisks();
  const result = useScanStore((store) => store.result);
  const queueItems = useCleanupStore((store) => store.items);
  const navigate = useNavigate();
  const queue = queueTotals(queueItems);

  if (!isDesktopRuntime()) {
    return (
      <>
        <PageHeader
          title="Overview"
          description="High-level overview of storage usage, recent scans and cleanup recommendations."
        />
        <EmptyState
          icon={LayoutDashboard}
          title="Desktop application required"
          description="Storage information is available when StorageView runs as a desktop application."
        />
      </>
    );
  }

  const totalBytes = disks?.reduce((sum, disk) => sum + disk.totalBytes, 0) ?? 0;
  const freeBytes = disks?.reduce((sum, disk) => sum + disk.availableBytes, 0) ?? 0;
  const usedBytes = Math.max(0, totalBytes - freeBytes);
  const usedPercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  const largestFolder = result?.largestDirectories[0];
  const largestFile = result?.largestFiles[0];

  return (
    <>
      <PageHeader
        title="Overview"
        description="High-level overview of storage usage, recent scans and cleanup recommendations."
        actions={
          <Button size="sm" onClick={() => navigate("/storage")}>
            Scan a drive or folder
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total storage"
          value={formatBytes(totalBytes)}
          hint={`${disks?.length ?? 0} drives`}
        />
        <StatCard label="Used storage" value={formatBytes(usedBytes)} />
        <StatCard label="Free storage" value={formatBytes(freeBytes)} />
        <StatCard
          label="Cleanup queue"
          value={formatBytes(queue.bytes)}
          hint={`${queue.count.toLocaleString()} items queued`}
        />
      </div>
      <Card className="mt-4 p-5">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="text-muted">Overall usage</span>
          <span className="text-xs text-muted">{usedPercent.toFixed(0)}%</span>
        </div>
        <ProgressBar
          value={usedPercent}
          tone={usedPercent >= 90 ? "danger" : usedPercent >= 75 ? "warning" : "primary"}
        />
      </Card>
      <h2 className="mb-3 mt-8 text-base font-medium">Last scan</h2>
      {result ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Scanned"
            value={formatBytes(result.totalBytes)}
            hint={`${result.rootPath} · ${result.totalFiles.toLocaleString()} files · ${formatDuration(result.elapsedMs)}`}
          />
          <StatCard
            label="Largest folder"
            value={largestFolder ? formatBytes(largestFolder.sizeBytes) : "—"}
            hint={largestFolder?.path}
          />
          <StatCard
            label="Largest file"
            value={largestFile ? formatBytes(largestFile.sizeBytes) : "—"}
            hint={largestFile?.path}
          />
        </div>
      ) : (
        <Card className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3 text-sm text-muted">
            <Folder className="h-4 w-4" aria-hidden="true" />
            No scans yet. Scan a drive or folder to see the largest items.
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate("/storage")}>
            Start a scan
          </Button>
        </Card>
      )}
    </>
  );
}
