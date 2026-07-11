import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { DuplicatesPanel } from "@/features/explorer/DuplicatesPanel";
import { ExtensionDrilldown } from "@/features/explorer/ExtensionDrilldown";
import { FileTypesTable } from "@/features/explorer/FileTypesTable";
import { LargestFilesTable } from "@/features/explorer/LargestFilesTable";
import { LargestFoldersTable } from "@/features/explorer/LargestFoldersTable";
import { useScanStore } from "@/features/storage/scanStore";
import { cn } from "@/lib/utils/cn";
import { formatBytes } from "@/lib/format/bytes";

type ExplorerTab = "files" | "folders" | "types" | "duplicates";

const tabs: { id: ExplorerTab; label: string }[] = [
  { id: "files", label: "Largest Files" },
  { id: "folders", label: "Largest Folders" },
  { id: "types", label: "File Types" },
  { id: "duplicates", label: "Duplicates" },
];

export function ExplorerPage() {
  const result = useScanStore((store) => store.result);
  const [activeTab, setActiveTab] = useState<ExplorerTab>("files");
  const [drilldownExtension, setDrilldownExtension] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!result) {
    return (
      <>
        <PageHeader
          title="Storage Explorer"
          description="Discover which files, folders and file types consume the most storage."
        />
        <EmptyState
          icon={FolderSearch}
          title="No scan results to explore"
          description="Scan a drive or folder to see the largest files, largest folders and the file type distribution."
        />
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => navigate("/storage")}>
            Go to Storage
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Storage Explorer"
        description={`${result.rootPath} · ${result.totalFiles.toLocaleString()} files · ${formatBytes(result.totalBytes)}`}
      />
      <div
        role="tablist"
        aria-label="Explorer views"
        className="mb-6 flex gap-1 rounded-lg border border-border bg-surface p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200",
              activeTab === tab.id
                ? "bg-card text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "files" ? <LargestFilesTable files={result.largestFiles} /> : null}
      {activeTab === "folders" ? (
        <LargestFoldersTable folders={result.largestDirectories} />
      ) : null}
      {activeTab === "types" ? (
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
      {activeTab === "duplicates" ? (
        <DuplicatesPanel rootPath={result.rootPath} />
      ) : null}
    </>
  );
}
