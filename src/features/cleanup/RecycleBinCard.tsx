import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { isDesktopRuntime } from "@/lib/api/app";
import { emptyRecycleBin, recycleBinSummary } from "@/lib/api/apps";
import { formatBytes } from "@/lib/format/bytes";
import type { RecycleBinSummary } from "@/types/apps";

export function RecycleBinCard() {
  const [summary, setSummary] = useState<RecycleBinSummary | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSummary(await recycleBinSummary());
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    }
  }, []);

  useEffect(() => {
    if (isDesktopRuntime()) {
      void refresh();
    }
  }, [refresh]);

  const empty = async () => {
    setConfirming(false);
    setWorking(true);
    setMessage(null);
    try {
      await emptyRecycleBin();
      setMessage("Recycle Bin emptied.");
    } catch (cause) {
      setMessage(
        cause && typeof cause === "object" && "message" in cause
          ? String((cause as { message: unknown }).message)
          : String(cause),
      );
    } finally {
      setWorking(false);
      void refresh();
    }
  };

  if (!isDesktopRuntime()) {
    return null;
  }

  return (
    <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Recycle Bin</h2>
          <p className="mt-1 text-[13px] text-muted">
            {unavailable
              ? "Recycle Bin status unavailable."
              : summary
                ? `${summary.itemCount.toLocaleString()} items · ${formatBytes(summary.totalBytes)}`
                : "Reading Recycle Bin…"}
          </p>
          {message ? <p className="mt-1 text-[11px] text-muted">{message}</p> : null}
        </div>
      </div>
      <Button
        variant="danger"
        size="sm"
        disabled={working || unavailable || !summary || summary.itemCount === 0}
        onClick={() => setConfirming(true)}
      >
        Empty Recycle Bin
      </Button>
      <Dialog
        open={confirming}
        title="Empty Recycle Bin"
        onClose={() => setConfirming(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={() => void empty()}>
              Empty Recycle Bin
            </Button>
          </>
        }
      >
        This permanently removes {summary?.itemCount.toLocaleString() ?? 0} items (
        {formatBytes(summary?.totalBytes ?? 0)}) from the Recycle Bin. They cannot be
        restored afterwards.
      </Dialog>
    </Card>
  );
}
