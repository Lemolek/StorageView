import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, CircleAlert, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Table, TableContainer, Td, Th } from "@/components/ui/Table";
import { RecommendationsCard } from "@/features/cleanup/RecommendationsCard";
import { RecycleBinCard } from "@/features/cleanup/RecycleBinCard";
import { queueTotals, useCleanupStore } from "@/features/cleanup/cleanupStore";
import { useSettingsStore } from "@/features/settings/settingsStore";
import { formatBytes } from "@/lib/format/bytes";

const PERMANENT_CONFIRM_PHRASE = "DELETE";

type PendingAction = "trash" | "delete" | null;

export function CleanupPage() {
  const {
    items,
    executing,
    lastReport,
    lastError,
    remove,
    clear,
    execute,
    dismissReport,
  } = useCleanupStore();
  const advancedUnlocked = useSettingsStore(
    (store) => store.advancedCleanupUnlocked,
  );
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const navigate = useNavigate();
  const totals = queueTotals(items);

  const closeDialog = () => {
    setPendingAction(null);
    setConfirmPhrase("");
  };

  const confirmAction = () => {
    const permanent = pendingAction === "delete";
    closeDialog();
    void execute(permanent);
  };

  return (
    <>
      <PageHeader
        title="Cleanup"
        description="Review the cleanup queue and run Safe Cleanup or Advanced Cleanup."
        actions={
          items.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={clear} disabled={executing}>
              Clear queue
            </Button>
          ) : undefined
        }
      />
      <RecommendationsCard />
      <RecycleBinCard />
      {lastError ? (
        <Card className="mb-6 flex items-start justify-between gap-4 border-danger/50 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <CircleAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-danger"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Cleanup failed</p>
              <p className="mt-1 text-xs text-muted">{lastError}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={dismissReport}>
            Dismiss
          </Button>
        </Card>
      ) : null}
      {lastReport ? (
        <Card className="mb-6 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-success"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Cleanup complete — {lastReport.succeeded} of{" "}
                  {lastReport.requested} items{" "}
                  {lastReport.permanent ? "permanently deleted" : "moved to trash"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatBytes(lastReport.bytesRecovered)} recovered
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={dismissReport}>
              Dismiss
            </Button>
          </div>
          {lastReport.failed > 0 ? (
            <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
              {lastReport.outcomes
                .filter((outcome) => !outcome.success)
                .map((outcome) => (
                  <li key={outcome.path} className="flex gap-2 text-muted">
                    <CircleAlert
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 break-all">
                      {outcome.path} — {outcome.error ?? "Unknown error"}
                    </span>
                  </li>
                ))}
            </ul>
          ) : null}
        </Card>
      ) : null}
      {items.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Cleanup queue is empty"
          description="Add files and folders from the Storage Explorer or duplicate analysis. Nothing is removed without your explicit confirmation."
        />
      ) : (
        <>
          <TableContainer className="mb-6">
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th className="text-right">Size</Th>
                  <Th>Risk</Th>
                  <Th>Path</Th>
                  <Th className="text-right">Remove</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.path}
                    className="transition-colors duration-(--motion-ms) hover:bg-surface/60"
                  >
                    <Td
                      className="max-w-56 truncate text-[13px] font-medium text-foreground"
                      title={item.name}
                    >
                      {item.name}
                    </Td>
                    <Td className="text-[13px] capitalize text-muted">{item.kind}</Td>
                    <Td className="whitespace-nowrap text-right text-[13px] tabular-nums text-foreground">
                      {formatBytes(item.sizeBytes)}
                    </Td>
                    <Td>
                      <RiskBadge level={item.riskLevel} reason={item.reason} />
                    </Td>
                    <Td className="max-w-80 truncate text-xs text-muted" title={item.path}>
                      {item.path}
                    </Td>
                    <Td>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => remove(item.path)}
                          title="Remove from queue"
                          aria-label="Remove from queue"
                          className="rounded-btn p-1.5 text-muted transition-colors duration-(--motion-ms) hover:bg-card-hover hover:text-foreground"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
          <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">
                Estimated recoverable
              </p>
              <p className="text-lg font-semibold text-foreground">
                {totals.count.toLocaleString()} items ·{" "}
                <span className="tabular-nums text-accent-secondary">
                  {formatBytes(totals.bytes)}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPendingAction("trash")}
                disabled={executing}
              >
                Move to trash
              </Button>
              <Button
                variant="danger"
                onClick={() => setPendingAction("delete")}
                disabled={executing || !advancedUnlocked}
              >
                Permanently delete
              </Button>
            </div>
            {!advancedUnlocked ? (
              <p className="w-full text-[11px] text-muted">
                Permanent deletion requires Advanced Cleanup.{" "}
                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="text-primary hover:underline"
                >
                  Enable it in Settings
                </button>
                .
              </p>
            ) : null}
          </Card>
        </>
      )}
      <Dialog
        open={pendingAction === "trash"}
        title="Move items to trash"
        onClose={closeDialog}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeDialog}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmAction}>
              Move to trash
            </Button>
          </>
        }
      >
        You are about to move {totals.count.toLocaleString()} items (
        {formatBytes(totals.bytes)}) to the system trash. Items can be restored
        from the trash afterwards.
      </Dialog>
      <Dialog
        open={pendingAction === "delete"}
        title="Permanently delete items"
        onClose={closeDialog}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={confirmPhrase !== PERMANENT_CONFIRM_PHRASE}
              onClick={confirmAction}
            >
              Permanently delete
            </Button>
          </>
        }
      >
        <p>
          You are about to permanently delete {totals.count.toLocaleString()} items
          ({formatBytes(totals.bytes)}). This action cannot be undone and the items
          will not be recoverable from the trash.
        </p>
        <label
          className="mt-4 block text-[11px] uppercase tracking-wider text-muted"
          htmlFor="confirm-delete"
        >
          Type {PERMANENT_CONFIRM_PHRASE} to confirm
        </label>
        <Input
          id="confirm-delete"
          value={confirmPhrase}
          onChange={(event) => setConfirmPhrase(event.target.value)}
          className="mt-1.5 w-full"
          autoComplete="off"
        />
      </Dialog>
    </>
  );
}
