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
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card border border-border bg-elevated">
          <HardDrive className="h-4 w-4 text-muted" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-foreground">
            {label} ({disk.mountPoint})
          </p>
          <p className="truncate text-[11px] text-muted">
            {disk.kind} · {disk.fileSystem}
            {disk.removable ? " · Removable" : ""}
          </p>
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
          <span className="tabular-nums text-foreground">
            {formatBytes(usedBytes)}{" "}
            <span className="text-muted">of {formatBytes(disk.totalBytes)} used</span>
          </span>
          <span className="text-[11px] tabular-nums text-muted">
            {usedPercent.toFixed(0)}%
          </span>
        </div>
        <ProgressBar value={usedPercent} tone={tone} />
        <p className="mt-1.5 text-[11px] text-muted">
          {formatBytes(disk.availableBytes)} free
        </p>
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
