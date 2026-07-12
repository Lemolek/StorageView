import { useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { SortableTh } from "@/components/ui/SortableTh";
import { Table, TableContainer, Td, Th } from "@/components/ui/Table";
import { LeftoversPanel } from "@/features/apps/LeftoversPanel";
import { RevealButton } from "@/features/explorer/RevealButton";
import { useSortable } from "@/hooks/useSortable";
import { isDesktopRuntime } from "@/lib/api/app";
import { launchUninstall, listInstalledApps } from "@/lib/api/apps";
import { formatBytes } from "@/lib/format/bytes";
import { formatDateTime } from "@/lib/format/datetime";
import type { SortAccessor } from "@/lib/tables/sort";
import type { InstalledApp } from "@/types/apps";

type AppSortKey = "name" | "publisher" | "size" | "installed";

const accessors: Record<AppSortKey, SortAccessor<InstalledApp>> = {
  name: (app) => app.name,
  publisher: (app) => app.publisher,
  size: (app) => app.estimatedSizeBytes,
  installed: (app) => app.installDateMs,
};

export function ApplicationsPage() {
  const [apps, setApps] = useState<InstalledApp[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const [uninstallError, setUninstallError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDesktopRuntime()) {
      return;
    }
    let active = true;
    listInstalledApps()
      .then((result) => {
        if (active) {
          setApps(result);
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
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = apps ?? [];
    if (!query) {
      return list;
    }
    return list.filter(
      (app) =>
        app.name.toLowerCase().includes(query) ||
        (app.publisher ?? "").toLowerCase().includes(query),
    );
  }, [apps, search]);

  const { sorted, sortKey, direction, toggle } = useSortable(
    filtered,
    accessors,
    "name",
    "asc",
  );

  const selected = useMemo(
    () => (apps ?? []).find((app) => app.id === selectedId) ?? null,
    [apps, selectedId],
  );

  const uninstall = async () => {
    if (!selected) {
      return;
    }
    setConfirmUninstall(false);
    setUninstallError(null);
    try {
      await launchUninstall(selected.id);
    } catch (cause) {
      setUninstallError(
        cause && typeof cause === "object" && "message" in cause
          ? String((cause as { message: unknown }).message)
          : String(cause),
      );
    }
  };

  if (!isDesktopRuntime()) {
    return (
      <>
        <PageHeader
          title="Applications"
          description="Installed applications with size, uninstall and leftover analysis."
        />
        <EmptyState
          icon={Package}
          title="Desktop application required"
          description="Application discovery is available when StorageView runs as a desktop application."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Applications"
        description="Installed applications with size, uninstall and leftover analysis."
      />
      {error ? (
        <Card className="mb-6 border-danger/40 p-5">
          <p className="text-sm font-medium">Unable to read installed applications</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
        </Card>
      ) : null}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or publisher…"
          className="w-72"
        />
        <p className="ml-auto text-xs text-muted">
          {sorted.length.toLocaleString()} of {(apps ?? []).length.toLocaleString()}{" "}
          applications
        </p>
      </div>
      {apps === null && !error ? (
        <Card className="h-40 animate-pulse p-5" />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No applications found"
          description="No installed applications match the current filter."
        />
      ) : (
        <TableContainer className="mb-6">
          <Table>
            <thead>
              <tr>
                <SortableTh
                  label="Name"
                  active={sortKey === "name"}
                  direction={direction}
                  onToggle={() => toggle("name")}
                />
                <SortableTh
                  label="Publisher"
                  active={sortKey === "publisher"}
                  direction={direction}
                  onToggle={() => toggle("publisher")}
                />
                <Th>Version</Th>
                <SortableTh
                  label="Size"
                  active={sortKey === "size"}
                  direction={direction}
                  onToggle={() => toggle("size")}
                  align="right"
                />
                <SortableTh
                  label="Installed"
                  active={sortKey === "installed"}
                  direction={direction}
                  onToggle={() => toggle("installed")}
                />
              </tr>
            </thead>
            <tbody>
              {sorted.map((app) => (
                <tr
                  key={app.id}
                  onClick={() =>
                    setSelectedId((current) => (current === app.id ? null : app.id))
                  }
                  className={
                    app.id === selectedId
                      ? "cursor-pointer bg-surface/80"
                      : "cursor-pointer transition-colors hover:bg-surface/60"
                  }
                >
                  <Td className="max-w-64 truncate font-medium" title={app.name}>
                    {app.name}
                  </Td>
                  <Td className="max-w-48 truncate text-muted" title={app.publisher ?? undefined}>
                    {app.publisher ?? "—"}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{app.version ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-right tabular-nums">
                    {app.estimatedSizeBytes != null
                      ? formatBytes(app.estimatedSizeBytes)
                      : "—"}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDateTime(app.installDateMs)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      )}
      {selected ? (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium">{selected.name}</h3>
              <p className="mt-1 truncate text-xs text-muted">
                {selected.installLocation ?? "Install location unknown"}
              </p>
              {uninstallError ? (
                <p className="mt-1 text-xs text-danger">{uninstallError}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {selected.installLocation ? (
                <RevealButton path={selected.installLocation} title="Open install location" />
              ) : null}
              <Button
                variant="danger"
                size="sm"
                disabled={!selected.uninstallCommand && !selected.quietUninstallCommand}
                onClick={() => setConfirmUninstall(true)}
              >
                Uninstall
              </Button>
            </div>
          </Card>
          <LeftoversPanel key={selected.id} app={selected} />
        </div>
      ) : null}
      <Dialog
        open={confirmUninstall}
        title="Uninstall application"
        onClose={() => setConfirmUninstall(false)}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmUninstall(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={() => void uninstall()}>
              Open uninstaller
            </Button>
          </>
        }
      >
        The native uninstaller for {selected?.name} will open. Complete the removal
        there, then use leftover analysis to review remaining files.
      </Dialog>
    </>
  );
}
