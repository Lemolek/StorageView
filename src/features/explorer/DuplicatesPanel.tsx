import { useEffect, useState } from "react";
import { CopyCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCleanupStore } from "@/features/cleanup/cleanupStore";
import { cancelScan } from "@/lib/api/scanning";
import { onDuplicateProgress, scanDuplicates } from "@/lib/api/duplicates";
import { formatBytes } from "@/lib/format/bytes";
import { formatDateTime } from "@/lib/format/datetime";
import type { DuplicateGroup, DuplicateProgress } from "@/types/cleanup";

const MIN_DUPLICATE_SIZE_BYTES = 1024 * 1024;
const VISIBLE_GROUPS = 50;

function isCancellation(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: unknown }).code === "cancelled"
  );
}

export function DuplicatesPanel({ rootPath }: { rootPath: string }) {
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState<DuplicateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const addEntries = useCleanupStore((store) => store.addEntries);

  useEffect(() => {
    const subscription = onDuplicateProgress(setProgress);
    return () => {
      void subscription.then((unlisten) => unlisten());
    };
  }, []);

  const run = async () => {
    setSearching(true);
    setGroups(null);
    setSelected(new Set());
    setProgress(null);
    setError(null);
    try {
      setGroups(await scanDuplicates(rootPath, MIN_DUPLICATE_SIZE_BYTES));
    } catch (cause) {
      if (!isCancellation(cause)) {
        setError(
          cause && typeof cause === "object" && "message" in cause
            ? String((cause as { message: unknown }).message)
            : String(cause),
        );
      }
    } finally {
      setSearching(false);
      setProgress(null);
    }
  };

  const toggle = (path: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const addSelected = () => {
    if (!groups) {
      return;
    }
    const entries = groups.flatMap((group) =>
      group.files
        .filter((file) => selected.has(file.path))
        .map((file) => ({
          path: file.path,
          name: file.name,
          kind: "file" as const,
          sizeBytes: group.sizeBytes,
        })),
    );
    if (entries.length > 0) {
      void addEntries(entries).catch(() => undefined);
      setSelected(new Set());
    }
  };

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0 text-sm text-muted">
          {searching && progress ? (
            <span className="flex items-center gap-2">
              <Loader2
                className="h-4 w-4 shrink-0 animate-spin text-primary"
                aria-hidden="true"
              />
              {progress.phase === "collecting"
                ? `Collecting files… ${progress.filesSeen.toLocaleString()} seen`
                : `Hashing candidates… ${progress.hashed.toLocaleString()} / ${progress.totalCandidates.toLocaleString()}`}
            </span>
          ) : (
            <>
              Compares files of at least 1 MB by size, then verifies matches with a
              content hash.
            </>
          )}
        </div>
        {searching ? (
          <Button variant="secondary" size="sm" onClick={() => void cancelScan()}>
            Cancel
          </Button>
        ) : (
          <Button size="sm" onClick={() => void run()}>
            Find duplicates
          </Button>
        )}
      </Card>
      {error ? (
        <Card className="border-danger/40 p-5">
          <p className="text-sm font-medium">Duplicate analysis failed</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
        </Card>
      ) : null}
      {groups && groups.length === 0 ? (
        <EmptyState
          icon={CopyCheck}
          title="No duplicates found"
          description="No files of 1 MB or larger with identical content were found in the scanned location."
        />
      ) : null}
      {groups && groups.length > 0 ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {groups.length.toLocaleString()} duplicate groups ·{" "}
              {formatBytes(
                groups.reduce((sum, group) => sum + group.wastedBytes, 0),
              )}{" "}
              recoverable
              {groups.length > VISIBLE_GROUPS
                ? ` · showing top ${VISIBLE_GROUPS}`
                : ""}
            </p>
            <Button size="sm" disabled={selected.size === 0} onClick={addSelected}>
              Add selected to cleanup queue ({selected.size})
            </Button>
          </div>
          {groups.slice(0, VISIBLE_GROUPS).map((group) => (
            <Card key={group.files[0]?.path ?? group.sizeBytes} className="p-5">
              <p className="text-sm font-medium">
                {group.fileCount.toLocaleString()} copies ·{" "}
                {formatBytes(group.sizeBytes)} each ·{" "}
                {formatBytes(group.wastedBytes)} recoverable
              </p>
              <ul className="mt-3 space-y-1.5">
                {group.files.map((file) => (
                  <li key={file.path} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-primary"
                      checked={selected.has(file.path)}
                      onChange={() => toggle(file.path)}
                      aria-label={`Select ${file.path}`}
                    />
                    <span className="truncate text-muted" title={file.path}>
                      {file.path}
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-muted">
                      {formatDateTime(file.modifiedMs)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </>
      ) : null}
    </div>
  );
}
