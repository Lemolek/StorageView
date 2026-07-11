import { useState } from "react";
import { FileDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TableContainer, Td, Th } from "@/components/ui/Table";
import { useHistoryStore } from "@/features/reports/historyStore";
import { useScanStore } from "@/features/storage/scanStore";
import { saveReportAs } from "@/lib/api/reports";
import { formatBytes } from "@/lib/format/bytes";
import { formatDateTime, formatDuration } from "@/lib/format/datetime";
import { buildScanReportCsv } from "@/lib/reports/csv";

export function ReportsPage() {
  const entries = useHistoryStore((store) => store.entries);
  const clearHistory = useHistoryStore((store) => store.clear);
  const result = useScanStore((store) => store.result);
  const [message, setMessage] = useState<string | null>(null);

  const exportAs = async (format: "json" | "csv") => {
    if (!result) {
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    const contents =
      format === "json"
        ? JSON.stringify(result, null, 2)
        : buildScanReportCsv(result);
    try {
      const saved = await saveReportAs(
        `storageview-report-${date}.${format}`,
        contents,
        format,
      );
      setMessage(saved ? "Report saved." : null);
    } catch (error) {
      setMessage(
        error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : String(error),
      );
    }
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Scan history and exportable reports."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={!result}
              onClick={() => void exportAs("csv")}
            >
              <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
              Export CSV
            </Button>
            <Button size="sm" disabled={!result} onClick={() => void exportAs("json")}>
              <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
              Export JSON
            </Button>
          </>
        }
      />
      {message ? <p className="mb-4 text-sm text-muted">{message}</p> : null}
      {!result ? (
        <p className="mb-6 text-sm text-muted">
          Exports include the latest scan result. Run a scan to enable them.
        </p>
      ) : null}
      {entries.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No scan history yet"
          description="Completed scans are recorded here with their summaries."
        />
      ) : (
        <>
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Scanned path</Th>
                  <Th className="text-right">Size</Th>
                  <Th className="text-right">Files</Th>
                  <Th className="text-right">Duration</Th>
                  <Th>Largest folder</Th>
                  <Th>Top type</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-surface/60">
                    <Td className="whitespace-nowrap text-muted">
                      {formatDateTime(entry.dateMs)}
                    </Td>
                    <Td className="max-w-72 truncate" title={entry.rootPath}>
                      {entry.rootPath}
                    </Td>
                    <Td className="whitespace-nowrap text-right tabular-nums">
                      {formatBytes(entry.totalBytes)}
                    </Td>
                    <Td className="whitespace-nowrap text-right tabular-nums text-muted">
                      {entry.totalFiles.toLocaleString()}
                    </Td>
                    <Td className="whitespace-nowrap text-right text-muted">
                      {formatDuration(entry.elapsedMs)}
                    </Td>
                    <Td
                      className="max-w-64 truncate text-muted"
                      title={entry.largestFolderPath ?? undefined}
                    >
                      {entry.largestFolderPath ?? "—"}
                    </Td>
                    <Td className="text-muted">
                      {entry.topExtension ? `.${entry.topExtension}` : "—"}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" size="sm" onClick={clearHistory}>
              Clear history
            </Button>
          </div>
        </>
      )}
    </>
  );
}
