import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { listExtensionFiles } from "@/lib/api/scanning";
import type { FileEntry } from "@/types/scan";
import { LargestFilesTable } from "./LargestFilesTable";

const DRILLDOWN_LIMIT = 500;

interface ExtensionDrilldownProps {
  rootPath: string;
  extension: string;
  onBack: () => void;
}

export function ExtensionDrilldown({
  rootPath,
  extension,
  onBack,
}: ExtensionDrilldownProps) {
  const [files, setFiles] = useState<FileEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setFiles(null);
    setError(null);
    listExtensionFiles(rootPath, extension, DRILLDOWN_LIMIT)
      .then((result) => {
        if (active) {
          setFiles(result);
        }
      })
      .catch((cause) => {
        if (active) {
          setError(
            cause && typeof cause === "object" && "message" in cause
              ? String((cause as { message: unknown }).message)
              : String(cause),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [rootPath, extension]);

  const label = extension ? `.${extension}` : "No extension";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          All types
        </Button>
        <p className="text-[13px] text-muted">
          Files with type <span className="font-medium text-foreground">{label}</span>
          {files ? ` · ${files.length.toLocaleString()} largest` : ""}
        </p>
      </div>
      {error ? (
        <Card className="border-danger/40 p-4">
          <p className="text-[13px] font-medium text-foreground">Unable to list files</p>
          <p className="mt-1 text-xs text-muted">{error}</p>
        </Card>
      ) : files ? (
        <LargestFilesTable files={files} />
      ) : (
        <Card className="flex items-center gap-3 p-4 text-[13px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          Collecting {label} files…
        </Card>
      )}
    </div>
  );
}
