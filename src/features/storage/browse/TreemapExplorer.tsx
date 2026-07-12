import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  CircleAlert,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CopyPathButton } from "@/components/ui/CopyPathButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AddToQueueButton } from "@/features/cleanup/AddToQueueButton";
import { RevealButton } from "@/features/explorer/RevealButton";
import { browseDirectory } from "@/lib/api/browse";
import { formatBytes } from "@/lib/format/bytes";
import { formatDateTime } from "@/lib/format/datetime";
import { formatPercent } from "@/lib/format/percent";
import { cn } from "@/lib/utils/cn";
import type { BrowseEntry, BrowseListing } from "@/types/browse";
import { squarify } from "./squarify";

const MAX_TILES = 60;

function errorMessage(cause: unknown): string {
  if (cause && typeof cause === "object" && "message" in cause) {
    return String((cause as { message: unknown }).message);
  }
  return String(cause);
}

function breadcrumbSegments(path: string): { label: string; path: string }[] {
  const normalized = path.replace(/\//g, "\\");
  const parts = normalized.split("\\").filter((part) => part.length > 0);
  const segments: { label: string; path: string }[] = [];
  let current = "";
  for (const part of parts) {
    current = current ? `${current}\\${part}` : `${part}\\`;
    segments.push({ label: part, path: current.endsWith("\\") ? current : current });
  }
  return segments;
}

function tileFill(entry: BrowseEntry, index: number, palette: string[]): string {
  if (entry.kind === "folder") {
    const hex = palette[index % palette.length] ?? "var(--primary)";
    const strength = Math.max(20, 56 - index * 2);
    return `color-mix(in srgb, ${hex} ${strength}%, var(--card))`;
  }
  return "color-mix(in srgb, var(--muted) 14%, var(--card))";
}

export function TreemapExplorer({ root }: { root: string }) {
  const { activeTheme } = useTheme();
  const treemapPalette = activeTheme.tokens.treemapPalette;
  const [listing, setListing] = useState<BrowseListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<BrowseEntry | null>(null);
  const [backStack, setBackStack] = useState<string[]>([]);
  const [forwardStack, setForwardStack] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 448 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) {
        setSize({ width: rect.width, height: rect.height });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const load = useCallback(async (path: string, refresh = false) => {
    setLoading(true);
    setError(null);
    setSelectedFile(null);
    try {
      const result = await browseDirectory(path, refresh);
      setListing(result);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setBackStack([]);
    setForwardStack([]);
    void load(root);
  }, [root, load]);

  const navigate = (path: string) => {
    if (listing) {
      setBackStack((stack) => [...stack, listing.path]);
      setForwardStack([]);
    }
    void load(path);
  };

  const goBack = () => {
    const previous = backStack[backStack.length - 1];
    if (previous === undefined || !listing) {
      return;
    }
    setBackStack((stack) => stack.slice(0, -1));
    setForwardStack((stack) => [...stack, listing.path]);
    void load(previous);
  };

  const goForward = () => {
    const next = forwardStack[forwardStack.length - 1];
    if (next === undefined || !listing) {
      return;
    }
    setForwardStack((stack) => stack.slice(0, -1));
    setBackStack((stack) => [...stack, listing.path]);
    void load(next);
  };

  const visibleEntries = useMemo(
    () => (listing?.entries ?? []).slice(0, MAX_TILES),
    [listing],
  );

  const rects = useMemo(() => {
    const layout = squarify(
      visibleEntries.map((entry) => ({ key: entry.path, value: entry.sizeBytes })),
      size.width,
      size.height,
    );
    const byKey = new Map(layout.map((rect) => [rect.key, rect]));
    return visibleEntries
      .map((entry, index) => ({ entry, index, rect: byKey.get(entry.path) }))
      .filter(
        (tile): tile is { entry: BrowseEntry; index: number; rect: NonNullable<typeof tile.rect> } =>
          tile.rect !== undefined,
      );
  }, [visibleEntries, size]);

  const segments = listing ? breadcrumbSegments(listing.path) : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={backStack.length === 0 || loading}
          onClick={goBack}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={forwardStack.length === 0 || loading}
          onClick={goForward}
        >
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!listing?.parentPath || loading}
          onClick={() => listing?.parentPath && navigate(listing.parentPath)}
        >
          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <nav aria-label="Path" className="flex min-w-0 flex-1 items-center gap-1 text-xs">
          {segments.map((segment, index) => (
            <span key={segment.path} className="flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight
                  className="h-3 w-3 shrink-0 text-muted/50"
                  aria-hidden="true"
                />
              ) : null}
              <button
                type="button"
                onClick={() => navigate(segment.path)}
                className={cn(
                  "truncate rounded-[5px] px-1 py-0.5 transition-colors duration-(--motion-ms) hover:text-foreground",
                  index === segments.length - 1
                    ? "font-medium text-foreground"
                    : "text-muted",
                )}
              >
                {segment.label}
              </button>
            </span>
          ))}
        </nav>
        <Button
          variant="secondary"
          size="sm"
          disabled={!listing || loading}
          onClick={() => listing && void load(listing.path, true)}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Rescan
        </Button>
      </div>
      {error ? (
        <Card className="flex items-start gap-3 border-danger/40 p-4">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="text-[13px] font-medium text-foreground">
              Unable to read this location
            </p>
            <p className="mt-1 text-xs text-muted">{error}</p>
          </div>
        </Card>
      ) : null}
      <div
        ref={containerRef}
        className="relative h-[28rem] overflow-hidden rounded-panel border border-border bg-card"
      >
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/70">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : null}
        <div key={listing?.path ?? root} className="dialog-in absolute inset-0">
          {rects.map(({ entry, index, rect }) => {
            const showText = rect.width > 64 && rect.height > 30;
            const label =
              entry.kind === "folder"
                ? `Folder ${entry.name}, ${formatBytes(entry.sizeBytes)}, ${formatPercent(entry.percentOfParent / 100)} of parent`
                : `File ${entry.name}, ${formatBytes(entry.sizeBytes)}`;
            return (
              <button
                key={entry.path}
                type="button"
                aria-label={label}
                title={`${entry.path}\n${entry.sizeBytes.toLocaleString()} bytes · ${formatBytes(entry.sizeBytes)} · ${entry.percentOfParent.toFixed(1)}%`}
                onClick={() =>
                  entry.kind === "folder" ? navigate(entry.path) : setSelectedFile(entry)
                }
                style={{
                  left: rect.x,
                  top: rect.y,
                  width: Math.max(rect.width - 2, 0),
                  height: Math.max(rect.height - 2, 0),
                  backgroundColor: tileFill(entry, index, treemapPalette),
                }}
                className={cn(
                  "absolute overflow-hidden rounded-[3px] border border-[rgba(255,255,255,0.08)] text-left align-top outline-none transition-all duration-(--motion-ms) hover:border-[rgba(255,255,255,0.22)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-primary",
                  selectedFile?.path === entry.path &&
                    "shadow-[0_0_0_1px_rgba(255,255,255,0.85),0_0_14px_rgba(255,255,255,0.25)]",
                )}
              >
                {showText ? (
                  <span className="block truncate px-1.5 pt-1 text-xs font-medium text-foreground">
                    {entry.name}
                  </span>
                ) : null}
                {showText ? (
                  <span className="block truncate px-1.5 text-[10px] text-muted">
                    {formatBytes(entry.sizeBytes)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {!loading && listing && rects.length === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            This location is empty.
          </p>
        ) : null}
      </div>
      {selectedFile ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-foreground">
              {selectedFile.name}
            </p>
            <p className="truncate text-[11px] text-muted">
              {formatBytes(selectedFile.sizeBytes)} ·{" "}
              {formatDateTime(selectedFile.modifiedMs)} · {selectedFile.path}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <RevealButton path={selectedFile.path} title="Open file location" />
            <CopyPathButton path={selectedFile.path} />
            <AddToQueueButton
              entry={{
                path: selectedFile.path,
                name: selectedFile.name,
                kind: "file",
                sizeBytes: selectedFile.sizeBytes,
              }}
            />
          </div>
        </Card>
      ) : null}
      {listing && listing.entries.length > 0 ? (
        <div className="card-edge overflow-hidden rounded-panel border border-border bg-card">
          <ul>
            {listing.entries.map((entry) => (
              <li
                key={entry.path}
                className="flex items-center gap-3 border-b border-border/50 px-3 py-1.5 text-[13px] transition-colors duration-(--motion-ms) last:border-b-0 hover:bg-card-hover"
              >
                <button
                  type="button"
                  onClick={() =>
                    entry.kind === "folder"
                      ? navigate(entry.path)
                      : setSelectedFile(entry)
                  }
                  className="min-w-0 flex-1 truncate text-left font-medium text-foreground transition-colors duration-(--motion-ms) hover:text-primary"
                  title={entry.path}
                >
                  {entry.name}
                  {entry.kind === "folder" ? "\\" : ""}
                </button>
                <span className="w-32 shrink-0">
                  <ProgressBar value={entry.percentOfParent} />
                </span>
                <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-muted">
                  {entry.percentOfParent.toFixed(1)}%
                </span>
                <span className="w-24 shrink-0 text-right text-xs tabular-nums text-foreground">
                  {formatBytes(entry.sizeBytes)}
                </span>
                <span className="w-36 shrink-0 text-right text-[11px] text-muted">
                  {formatDateTime(entry.modifiedMs)}
                </span>
                <span className="flex shrink-0 gap-1">
                  <RevealButton
                    path={entry.path}
                    title={entry.kind === "folder" ? "Open folder" : "Open file location"}
                  />
                  <CopyPathButton path={entry.path} />
                  <AddToQueueButton
                    entry={{
                      path: entry.path,
                      name: entry.name,
                      kind: entry.kind,
                      sizeBytes: entry.sizeBytes,
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
