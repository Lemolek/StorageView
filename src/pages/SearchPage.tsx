import { useEffect, useRef, useState } from "react";
import { CircleAlert, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { SearchResultsTable } from "@/features/search/SearchResultsTable";
import { useDisks } from "@/hooks/useDisks";
import { isDesktopRuntime } from "@/lib/api/app";
import { selectFolder } from "@/lib/api/dialog";
import { cancelScan } from "@/lib/api/scanning";
import { onSearchHits, startSearch } from "@/lib/api/search";
import { formatDuration } from "@/lib/format/datetime";
import { cn } from "@/lib/utils/cn";
import type { SearchHit, SearchScope, SearchSummary } from "@/types/search";

const RESULT_LIMIT = 1000;

const scopeOptions: { value: SearchScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "files", label: "Files" },
  { value: "folders", label: "Folders" },
];

const sizeOptions = [
  { label: "Any", value: 0 },
  { label: "1 MB", value: 1024 * 1024 },
  { label: "10 MB", value: 10 * 1024 * 1024 },
  { label: "100 MB", value: 100 * 1024 * 1024 },
  { label: "1 GB", value: 1024 * 1024 * 1024 },
];

function dateToMs(value: string, endOfDay: boolean): number | null {
  if (!value) {
    return null;
  }
  const ms = new Date(`${value}T00:00:00`).getTime();
  if (!Number.isFinite(ms)) {
    return null;
  }
  return endOfDay ? ms + 86_399_999 : ms;
}

function errorMessage(cause: unknown): string {
  if (cause && typeof cause === "object" && "message" in cause) {
    return String((cause as { message: unknown }).message);
  }
  return String(cause);
}

function isCancellation(cause: unknown): boolean {
  return (
    !!cause &&
    typeof cause === "object" &&
    "code" in cause &&
    (cause as { code: unknown }).code === "cancelled"
  );
}

export function SearchPage() {
  const { disks } = useDisks();
  const [root, setRoot] = useState("");
  const [text, setText] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [extensions, setExtensions] = useState("");
  const [minSize, setMinSize] = useState(0);
  const [maxSize, setMaxSize] = useState(0);
  const [modifiedAfter, setModifiedAfter] = useState("");
  const [modifiedBefore, setModifiedBefore] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [includeHidden, setIncludeHidden] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<SearchSummary | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!isDesktopRuntime()) {
      return;
    }
    const subscription = onSearchHits((batch) => {
      if (runningRef.current) {
        setHits((current) => [...current, ...batch]);
      }
    });
    return () => {
      void subscription.then((unlisten) => unlisten());
    };
  }, []);

  const run = async () => {
    if (!root || running) {
      return;
    }
    runningRef.current = true;
    setRunning(true);
    setSearched(true);
    setHits([]);
    setSummary(null);
    setCancelled(false);
    setError(null);
    try {
      const result = await startSearch({
        root,
        scope,
        text,
        useRegex,
        extensions: extensions
          .split(",")
          .map((extension) => extension.trim())
          .filter((extension) => extension.length > 0),
        minSizeBytes: minSize > 0 ? minSize : null,
        maxSizeBytes: maxSize > 0 ? maxSize : null,
        modifiedAfterMs: dateToMs(modifiedAfter, false),
        modifiedBeforeMs: dateToMs(modifiedBefore, true),
        createdAfterMs: null,
        createdBeforeMs: null,
        includeHidden,
        limit: RESULT_LIMIT,
      });
      setSummary(result);
    } catch (cause) {
      if (isCancellation(cause)) {
        setCancelled(true);
      } else {
        setError(errorMessage(cause));
      }
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  };

  const pickRoot = async () => {
    const folder = await selectFolder(root || null);
    if (folder) {
      setRoot(folder);
    }
  };

  if (!isDesktopRuntime()) {
    return (
      <>
        <PageHeader
          title="Search"
          description="Find files and folders by name, size, type and dates."
        />
        <EmptyState
          icon={Search}
          title="Desktop application required"
          description="Filesystem search is available when StorageView runs as a desktop application."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Search"
        description="Find files and folders by name, size, type and dates."
      />
      <Card className="mb-6 space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className="flex h-8 min-w-0 flex-1 items-center truncate rounded-input border border-border bg-surface px-2.5 text-sm text-muted"
            title={root || undefined}
          >
            {root || "Choose a location to search"}
          </p>
          <Button variant="secondary" size="sm" onClick={() => void pickRoot()}>
            Browse…
          </Button>
          {(disks ?? []).map((disk) => (
            <Button
              key={disk.mountPoint}
              variant="ghost"
              size="sm"
              onClick={() => setRoot(disk.mountPoint)}
            >
              {disk.mountPoint}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void run();
              }
            }}
            placeholder={useRegex ? "Regular expression…" : "Name, *.log, report?.txt…"}
            className="w-72"
          />
          <div
            role="radiogroup"
            aria-label="Search scope"
            className="inline-flex gap-0.5 rounded-btn border border-border bg-surface p-0.5"
          >
            {scopeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={scope === option.value}
                onClick={() => setScope(option.value)}
                className={cn(
                  "rounded-[5px] px-3 py-1.5 text-xs font-medium transition-all duration-(--motion-ms)",
                  scope === option.value
                    ? "bg-card text-foreground shadow-[inset_0_-1px_0_var(--primary)]"
                    : "text-muted hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Input
            value={extensions}
            onChange={(event) => setExtensions(event.target.value)}
            placeholder="Extensions: mp4, iso"
            className="w-44"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
            Min
            <Select
              value={minSize}
              onChange={(event) => setMinSize(Number(event.target.value))}
            >
              {sizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
            Max
            <Select
              value={maxSize}
              onChange={(event) => setMaxSize(Number(event.target.value))}
            >
              {sizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
            Modified after
            <Input
              type="date"
              value={modifiedAfter}
              onChange={(event) => setModifiedAfter(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
            before
            <Input
              type="date"
              value={modifiedBefore}
              onChange={(event) => setModifiedBefore(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
            <input
              type="checkbox"
              checked={useRegex}
              onChange={(event) => setUseRegex(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Regex
          </label>
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
            <input
              type="checkbox"
              checked={includeHidden}
              onChange={(event) => setIncludeHidden(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Include hidden
          </label>
          <div className="ml-auto">
            {running ? (
              <Button variant="secondary" size="sm" onClick={() => void cancelScan()}>
                Cancel
              </Button>
            ) : (
              <Button size="sm" disabled={!root} onClick={() => void run()}>
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                Search
              </Button>
            )}
          </div>
        </div>
      </Card>
      {error ? (
        <Card className="mb-6 flex items-start gap-3 border-danger/50 p-4">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">Search failed</p>
            <p className="mt-1 text-xs text-muted">{error}</p>
          </div>
        </Card>
      ) : null}
      {running ? (
        <p className="mb-4 flex items-center gap-2 text-xs text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
          Searching… {hits.length.toLocaleString()} results so far
        </p>
      ) : null}
      {summary ? (
        <p className="mb-4 text-xs text-muted">
          {summary.totalHits.toLocaleString()} results in{" "}
          {formatDuration(summary.elapsedMs)}
          {summary.truncated
            ? ` · showing the first ${RESULT_LIMIT.toLocaleString()} matches`
            : ""}
        </p>
      ) : null}
      {cancelled ? (
        <p className="mb-4 text-xs text-muted">
          Search cancelled — showing partial results.
        </p>
      ) : null}
      {hits.length > 0 ? (
        <SearchResultsTable hits={hits} />
      ) : searched && !running && !error ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="No files or folders matched the current filters."
        />
      ) : null}
    </>
  );
}
