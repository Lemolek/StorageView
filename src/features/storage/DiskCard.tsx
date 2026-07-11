import { HardDrive } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatBytes } from "@/lib/format/bytes";
import type { DiskInfo } from "@/types/storage";

interface DiskCardProps {
  disk: DiskInfo;
  scanning: boolean;
  onScan: (path: string) => void;
}

export function DiskCard({ disk, scanning, onScan }: DiskCardProps) {
  const usedBytes = Math.max(0, disk.totalBytes - disk.availableBytes);
  const usedPercent = disk.totalBytes > 0 ? (usedBytes / disk.totalBytes) * 100 : 0;
  const tone = usedPercent >= 90 ? "danger" : usedPercent >= 75 ? "warning" : "primary";
  const label = disk.name.trim() || "Local Disk";

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface">
          <HardDrive className="h-5 w-5 text-muted" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {label} ({disk.mountPoint})
          </p>
          <p className="truncate text-xs text-muted">
            {disk.kind} · {disk.fileSystem}
            {disk.removable ? " · Removable" : ""}
          </p>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span>
            {formatBytes(usedBytes)}{" "}
            <span className="text-muted">of {formatBytes(disk.totalBytes)} used</span>
          </span>
          <span className="text-xs text-muted">{usedPercent.toFixed(0)}%</span>
        </div>
        <ProgressBar value={usedPercent} tone={tone} />
        <p className="mt-2 text-xs text-muted">{formatBytes(disk.availableBytes)} free</p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        disabled={scanning}
        onClick={() => onScan(disk.mountPoint)}
        className="self-start"
      >
        Scan drive
      </Button>
    </Card>
  );
}
