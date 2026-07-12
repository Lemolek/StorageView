import { useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { suggestCleanup } from "@/lib/api/cleanup";
import { formatBytes } from "@/lib/format/bytes";
import type { CleanupSuggestion } from "@/types/cleanup";
import { useCleanupStore } from "./cleanupStore";

export function RecommendationsCard() {
  const [suggestions, setSuggestions] = useState<CleanupSuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const addEntries = useCleanupStore((store) => store.addEntries);
  const queueItems = useCleanupStore((store) => store.items);
  const queuedPaths = useMemo(
    () => new Set(queueItems.map((item) => item.path)),
    [queueItems],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSuggestions(await suggestCleanup());
      setSelected(new Set());
    } catch (cause) {
      setError(
        cause && typeof cause === "object" && "message" in cause
          ? String((cause as { message: unknown }).message)
          : String(cause),
      );
    } finally {
      setLoading(false);
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
    if (!suggestions) {
      return;
    }
    const entries = suggestions
      .filter((suggestion) => selected.has(suggestion.path))
      .map((suggestion) => ({
        path: suggestion.path,
        name: suggestion.label,
        kind: "folder" as const,
        sizeBytes: suggestion.sizeBytes,
      }));
    if (entries.length > 0) {
      void addEntries(entries).catch(() => undefined);
      setSelected(new Set());
    }
  };

  const totalBytes =
    suggestions?.reduce((sum, suggestion) => sum + suggestion.sizeBytes, 0) ?? 0;

  return (
    <Card className="mb-6 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">
              Recommended cleanup
            </h2>
            <p className="mt-1 text-[11px] text-muted">
              {suggestions
                ? `${suggestions.length} low-risk locations · ${formatBytes(totalBytes)} recoverable`
                : "Scans known temporary, browser and package manager cache locations."}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => void load()}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : null}
          {suggestions ? "Refresh" : "Find recommendations"}
        </Button>
      </div>
      {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}
      {suggestions && suggestions.length === 0 ? (
        <p className="mt-3 text-xs text-muted">
          No recoverable space was found in known cleanup locations.
        </p>
      ) : null}
      {suggestions && suggestions.length > 0 ? (
        <>
          <ul className="mt-3 space-y-1">
            {suggestions.map((suggestion) => {
              const queued = queuedPaths.has(suggestion.path);
              return (
                <li
                  key={suggestion.path}
                  className="flex items-center gap-3 rounded-btn px-2 py-1.5 text-[13px] transition-colors duration-(--motion-ms) hover:bg-surface/60"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-primary"
                    checked={selected.has(suggestion.path)}
                    disabled={queued}
                    onChange={() => toggle(suggestion.path)}
                    aria-label={`Select ${suggestion.label}`}
                  />
                  <span
                    className="min-w-0 truncate font-medium text-foreground"
                    title={suggestion.path}
                  >
                    {suggestion.label}
                  </span>
                  <span className="inline-flex shrink-0 rounded-[4px] border border-border px-1.5 text-[10px] font-medium uppercase tracking-wider text-muted">
                    {suggestion.category}
                  </span>
                  <RiskBadge level={suggestion.riskLevel} reason={suggestion.reason} />
                  <span className="ml-auto shrink-0 tabular-nums text-foreground">
                    {formatBytes(suggestion.sizeBytes)}
                  </span>
                  {queued ? (
                    <span className="shrink-0 text-xs text-success">Queued</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex justify-end">
            <Button size="sm" disabled={selected.size === 0} onClick={addSelected}>
              Add selected to queue ({selected.size})
            </Button>
          </div>
        </>
      ) : null}
    </Card>
  );
}
