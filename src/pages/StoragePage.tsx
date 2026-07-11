import { FolderSearch, HardDrive, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { DiskCard } from "@/features/storage/DiskCard";
import { ScanStatusPanel } from "@/features/storage/ScanStatusPanel";
import { useScanStore } from "@/features/storage/scanStore";
import { useSettingsStore } from "@/features/settings/settingsStore";
import { useDisks } from "@/hooks/useDisks";
import { isDesktopRuntime } from "@/lib/api/app";
import { selectFolder } from "@/lib/api/dialog";

export function StoragePage() {
  const { disks, loading, error, refresh } = useDisks();
  const status = useScanStore((store) => store.status);
  const startScan = useScanStore((store) => store.startScan);
  const scanning = status === "scanning";

  const defaultScanLocation = useSettingsStore(
    (store) => store.defaultScanLocation,
  );

  const handleScanFolder = async () => {
    const folder = await selectFolder(defaultScanLocation);
    if (folder) {
      await startScan(folder);
    }
  };

  if (!isDesktopRuntime()) {
    return (
      <>
        <PageHeader
          title="Storage"
          description="Connected drives with capacity, used and free storage."
        />
        <EmptyState
          icon={HardDrive}
          title="Desktop application required"
          description="Drive information and scanning are available when DiskScope runs as a desktop application."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Storage"
        description="Connected drives with capacity, used and free storage."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => void handleScanFolder()}
              disabled={scanning}
            >
              <FolderSearch className="h-3.5 w-3.5" aria-hidden="true" />
              Scan folder…
            </Button>
          </>
        }
      />
      <ScanStatusPanel />
      {error ? (
        <Card className="mb-6 border-danger/40 p-5">
          <p className="text-sm font-medium">Unable to read drive information</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
        </Card>
      ) : null}
      {disks && disks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {disks.map((disk) => (
            <DiskCard
              key={`${disk.mountPoint}-${disk.name}`}
              disk={disk}
              scanning={scanning}
              onScan={(path) => void startScan(path)}
            />
          ))}
        </div>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Card key={index} className="h-44 animate-pulse p-5" />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={HardDrive}
          title="No drives detected"
          description="No connected drives were found. Use Refresh to check again."
        />
      )}
    </>
  );
}
