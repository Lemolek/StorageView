import { useState } from "react";
import {
  BarChart3,
  FolderSearch,
  Grid2x2,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { AgeBarChart } from "@/features/analytics/AgeBarChart";
import { FileTypesDonut } from "@/features/analytics/FileTypesDonut";
import { SizeBarChart } from "@/features/analytics/SizeBarChart";
import { chartPalette } from "@/features/analytics/palette";
import { DuplicatesPanel } from "@/features/explorer/DuplicatesPanel";
import { ExtensionDrilldown } from "@/features/explorer/ExtensionDrilldown";
import { FileTypesTable } from "@/features/explorer/FileTypesTable";
import { LargestFilesTable } from "@/features/explorer/LargestFilesTable";
import { LargestFoldersTable } from "@/features/explorer/LargestFoldersTable";
import { TreemapExplorer } from "@/features/storage/browse/TreemapExplorer";
import { DiskCard } from "@/features/storage/DiskCard";
import { ScanStatusPanel } from "@/features/storage/ScanStatusPanel";
import { useScanStore } from "@/features/storage/scanStore";
import { useSettingsStore } from "@/features/settings/settingsStore";
import { useDisks } from "@/hooks/useDisks";
import { isDesktopRuntime } from "@/lib/api/app";
import { selectFolder } from "@/lib/api/dialog";
import { formatBytes } from "@/lib/format/bytes";

type StorageTab = "treemap" | "files" | "folders" | "types" | "duplicates" | "insights";

const tabs: { id: StorageTab; label: string }[] = [
  { id: "treemap", label: "Treemap" },
  { id: "files", label: "Largest Files" },
  { id: "folders", label: "Largest Folders" },
  { id: "types", label: "File Types" },
  { id: "duplicates", label: "Duplicates" },
  { id: "insights", label: "Insights" },
];

const TOP_ITEMS = 10;

function shortName(name: string): string {
  return name.length > 22 ? `${name.slice(0, 21)}…` : name;
}

export function StoragePage() {
  const { disks, loading, error, refresh } = useDisks();
  const status = useScanStore((store) => store.status);
  const result = useScanStore((store) => store.result);
  const startScan = useScanStore((store) => store.startScan);
  const scanning = status === "scanning";
  const { activeTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<StorageTab>("treemap");
  const [browseRoot, setBrowseRoot] = useState<string | null>(null);
  const [drilldownExtension, setDrilldownExtension] = useState<string | null>(null);

  const defaultScanLocation = useSettingsStore(
    (store) => store.defaultScanLocation,
  );

  const handleScanFolder = async () => {
    const folder = await selectFolder(defaultScanLocation);
    if (folder) {
      await startScan(folder);
    }
  };

  const pickBrowseRoot = async () => {
    const folder = await selectFolder(defaultScanLocation);
    if (folder) {
      setBrowseRoot(folder);
    }
  };

  if (!isDesktopRuntime()) {
    return (
      <>
        <PageHeader
          title="Storage"
          description="Drives, interactive treemap and scan analysis."
        />
        <EmptyState
          icon={HardDrive}
          title="Desktop application required"
          description="Drive information and scanning are available when StorageView runs as a desktop application."
        />
      </>
    );
  }

  const treemapRoot = browseRoot ?? result?.rootPath ?? null;
  const palette = chartPalette(activeTheme.tokens);

  return (
    <>
      <PageHeader
        title="Storage"
        description="Drives, interactive treemap and scan analysis."
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
        <Card className="mb-4 border-danger/40 p-4">
          <p className="text-[13px] font-medium text-foreground">
            Unable to read drive information
          </p>
          <p className="mt-1 text-xs text-muted">{error}</p>
        </Card>
      ) : null}
      {disks && disks.length > 0 ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Card key={index} className="h-40 animate-pulse p-4" />
          ))}
        </div>
      ) : null}
      <Tabs
        tabs={tabs}
        active={activeTab}
        onChange={setActiveTab}
        label="Storage views"
      />
      {activeTab === "treemap" ? (
        treemapRoot ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {(disks ?? []).map((disk) => (
                <Button
                  key={disk.mountPoint}
                  variant={treemapRoot.startsWith(disk.mountPoint) ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setBrowseRoot(disk.mountPoint)}
                >
                  {disk.mountPoint}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => void pickBrowseRoot()}>
                Choose folder…
              </Button>
            </div>
            <TreemapExplorer root={treemapRoot} />
          </div>
        ) : (
          <div className="space-y-4">
            <EmptyState
              icon={Grid2x2}
              title="Choose a location to explore"
              description="Pick a drive or folder to browse its contents as an interactive treemap."
            />
            <div className="flex flex-wrap justify-center gap-2">
              {(disks ?? []).map((disk) => (
                <Button
                  key={disk.mountPoint}
                  variant="secondary"
                  size="sm"
                  onClick={() => setBrowseRoot(disk.mountPoint)}
                >
                  {disk.mountPoint}
                </Button>
              ))}
              <Button size="sm" onClick={() => void pickBrowseRoot()}>
                Choose folder…
              </Button>
            </div>
          </div>
        )
      ) : null}
      {activeTab !== "treemap" && activeTab !== "insights" && !result ? (
        <EmptyState
          icon={BarChart3}
          title="No scan results yet"
          description="Scan a drive or folder to see largest files, folders, file types and duplicates."
        />
      ) : null}
      {result && activeTab === "files" ? (
        <LargestFilesTable files={result.largestFiles} />
      ) : null}
      {result && activeTab === "folders" ? (
        <LargestFoldersTable folders={result.largestDirectories} />
      ) : null}
      {result && activeTab === "types" ? (
        drilldownExtension !== null ? (
          <ExtensionDrilldown
            rootPath={result.rootPath}
            extension={drilldownExtension}
            onBack={() => setDrilldownExtension(null)}
          />
        ) : (
          <FileTypesTable
            fileTypes={result.fileTypes}
            totalBytes={result.totalBytes}
            onDrilldown={setDrilldownExtension}
          />
        )
      ) : null}
      {result && activeTab === "duplicates" ? (
        <DuplicatesPanel rootPath={result.rootPath} />
      ) : null}
      {activeTab === "insights" ? (
        result ? (
          <div className="grid gap-3 xl:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted">
                File type distribution
              </h2>
              <FileTypesDonut
                fileTypes={result.fileTypes}
                totalBytes={result.totalBytes}
                palette={palette}
              />
            </Card>
            <Card>
              <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted">
                File age by size
              </h2>
              <AgeBarChart ageDistribution={result.ageDistribution} palette={palette} />
            </Card>
            <Card>
              <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted">
                Largest files
              </h2>
              <SizeBarChart
                data={result.largestFiles.slice(0, TOP_ITEMS).map((file) => ({
                  name: shortName(file.name),
                  value: file.sizeBytes,
                  path: file.path,
                }))}
                palette={palette}
              />
            </Card>
            <Card>
              <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted">
                Largest folders
              </h2>
              <SizeBarChart
                data={result.largestDirectories.slice(0, TOP_ITEMS).map((folder) => ({
                  name: shortName(folder.name),
                  value: folder.sizeBytes,
                  path: folder.path,
                }))}
                palette={palette}
              />
            </Card>
            <Card className="xl:col-span-2">
              <p className="text-xs text-muted">
                {result.rootPath} · {formatBytes(result.totalBytes)} scanned ·{" "}
                {result.totalFiles.toLocaleString()} files
              </p>
            </Card>
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No insights available"
            description="Scan a drive or folder to see charts for file types, sizes and age."
          />
        )
      ) : null}
    </>
  );
}
