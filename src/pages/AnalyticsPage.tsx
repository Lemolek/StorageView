import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { AgeBarChart } from "@/features/analytics/AgeBarChart";
import { FileTypesDonut } from "@/features/analytics/FileTypesDonut";
import { FolderTreemap } from "@/features/analytics/FolderTreemap";
import { SizeBarChart } from "@/features/analytics/SizeBarChart";
import { chartPalette } from "@/features/analytics/palette";
import { useScanStore } from "@/features/storage/scanStore";
import { formatBytes } from "@/lib/format/bytes";

const TOP_ITEMS = 10;

function shortName(name: string): string {
  return name.length > 22 ? `${name.slice(0, 21)}…` : name;
}

export function AnalyticsPage() {
  const result = useScanStore((store) => store.result);
  const { theme } = useTheme();
  const navigate = useNavigate();

  if (!result) {
    return (
      <>
        <PageHeader
          title="Analytics"
          description="Visual breakdown of storage by file type, size and age."
        />
        <EmptyState
          icon={BarChart3}
          title="No analytics available"
          description="Scan a drive or folder to see charts for file types, largest items, folder sizes and file age."
        />
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => navigate("/storage")}>
            Go to Storage
          </Button>
        </div>
      </>
    );
  }

  const palette = chartPalette(theme);
  const topFiles = result.largestFiles.slice(0, TOP_ITEMS).map((file) => ({
    name: shortName(file.name),
    value: file.sizeBytes,
    path: file.path,
  }));
  const topFolders = result.largestDirectories
    .slice(0, TOP_ITEMS)
    .map((folder) => ({
      name: shortName(folder.name),
      value: folder.sizeBytes,
      path: folder.path,
    }));

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`${result.rootPath} · ${formatBytes(result.totalBytes)} scanned`}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-medium">File type distribution</h2>
          <FileTypesDonut
            fileTypes={result.fileTypes}
            totalBytes={result.totalBytes}
            palette={palette}
          />
        </Card>
        <Card>
          <h2 className="mb-4 text-base font-medium">File age by size</h2>
          <AgeBarChart ageDistribution={result.ageDistribution} palette={palette} />
        </Card>
        <Card>
          <h2 className="mb-4 text-base font-medium">Largest files</h2>
          <SizeBarChart data={topFiles} palette={palette} />
        </Card>
        <Card>
          <h2 className="mb-4 text-base font-medium">Largest folders</h2>
          <SizeBarChart data={topFolders} palette={palette} />
        </Card>
        <Card className="xl:col-span-2">
          <h2 className="mb-4 text-base font-medium">Folder treemap</h2>
          <FolderTreemap folders={result.largestDirectories} palette={palette} />
        </Card>
      </div>
    </>
  );
}
