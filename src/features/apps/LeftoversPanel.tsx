import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCleanupStore } from "@/features/cleanup/cleanupStore";
import { findAppLeftovers } from "@/lib/api/apps";
import { formatBytes } from "@/lib/format/bytes";
import { cn } from "@/lib/utils/cn";
import type { InstalledApp, LeftoverCandidate, LeftoverConfidence } from "@/types/apps";

const confidenceStyles: Record<LeftoverConfidence, string> = {
  high: "border-danger/50 text-danger",
  medium: "border-warning/50 text-warning",
  low: "border-border text-muted",
};

const confidenceLabels: Record<LeftoverConfidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function LeftoversPanel({ app }: { app: InstalledApp }) {
  const [candidates, setCandidates] = useState<LeftoverCandidate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const addEntries = useCleanupStore((store) => store.addEntries);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCandidates(
        await findAppLeftovers(app.name, app.publisher, app.installLocation),
      );
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
    if (!candidates) {
      return;
    }
    const entries = candidates
      .filter((candidate) => selected.has(candidate.path))
      .map((candidate) => ({
        path: candidate.path,
        name: candidate.path.split("\\").pop() ?? candidate.path,
        kind: candidate.kind,
        sizeBytes: candidate.sizeBytes,
      }));
    if (entries.length > 0) {
      void addEntries(entries).catch(() => undefined);
      setSelected(new Set());
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Leftover analysis</h3>
          <p className="mt-1 text-[11px] text-muted">
            Leftover detection is conservative and may be incomplete. Review every
            item before cleanup.
          </p>
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
          {candidates ? "Refresh" : "Find leftovers"}
        </Button>
      </div>
      {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}
      {candidates && candidates.length === 0 ? (
        <p className="mt-3 text-xs text-muted">
          No leftover candidates were found in known locations.
        </p>
      ) : null}
      {candidates && candidates.length > 0 ? (
        <>
          <ul className="mt-3 space-y-1">
            {candidates.map((candidate) => (
              <li
                key={candidate.path}
                className="flex items-center gap-3 rounded-btn px-2 py-1.5 text-[13px] transition-colors duration-(--motion-ms) hover:bg-surface/60"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-primary"
                  checked={selected.has(candidate.path)}
                  onChange={() => toggle(candidate.path)}
                  aria-label={`Select ${candidate.path}`}
                />
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-[4px] border px-1.5 text-[10px] font-medium uppercase tracking-wider",
                    confidenceStyles[candidate.confidence],
                  )}
                >
                  {confidenceLabels[candidate.confidence]}
                </span>
                <span className="min-w-0 truncate text-muted" title={candidate.path}>
                  {candidate.path}
                </span>
                <span className="shrink-0 text-xs text-muted">{candidate.source}</span>
                <span className="ml-auto shrink-0 tabular-nums text-foreground">
                  {formatBytes(candidate.sizeBytes)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end">
            <Button size="sm" disabled={selected.size === 0} onClick={addSelected}>
              Add selected to cleanup queue ({selected.size})
            </Button>
          </div>
        </>
      ) : null}
    </Card>
  );
}
