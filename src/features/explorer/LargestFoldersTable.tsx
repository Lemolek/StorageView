import { useMemo, useState } from "react";
import { FolderSearch } from "lucide-react";
import { CopyPathButton } from "@/components/ui/CopyPathButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { SortableTh } from "@/components/ui/SortableTh";
import { Table, TableContainer, Td, Th } from "@/components/ui/Table";
import { AddToQueueButton } from "@/features/cleanup/AddToQueueButton";
import { useScanStore } from "@/features/storage/scanStore";
import { useSortable } from "@/hooks/useSortable";
import { formatBytes } from "@/lib/format/bytes";
import type { SortAccessor } from "@/lib/tables/sort";
import type { DirectoryEntry } from "@/types/scan";
import { RevealButton } from "./RevealButton";

type FolderSortKey = "name" | "size" | "files";

const accessors: Record<FolderSortKey, SortAccessor<DirectoryEntry>> = {
  name: (folder) => folder.name,
  size: (folder) => folder.sizeBytes,
  files: (folder) => folder.fileCount,
};

export function LargestFoldersTable({ folders }: { folders: DirectoryEntry[] }) {
  const [search, setSearch] = useState("");
  const startScan = useScanStore((store) => store.startScan);
  const scanning = useScanStore((store) => store.status === "scanning");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return folders;
    }
    return folders.filter(
      (folder) =>
        folder.name.toLowerCase().includes(query) ||
        folder.path.toLowerCase().includes(query),
    );
  }, [folders, search]);

  const { sorted, sortKey, direction, toggle } = useSortable(
    filtered,
    accessors,
    "size",
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or path…"
          className="w-72"
        />
        <p className="ml-auto text-xs text-muted">
          {sorted.length.toLocaleString()} of {folders.length.toLocaleString()}{" "}
          folders
        </p>
      </div>
      <TableContainer>
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
                label="Size"
                active={sortKey === "size"}
                direction={direction}
                onToggle={() => toggle("size")}
                align="right"
              />
              <SortableTh
                label="Files"
                active={sortKey === "files"}
                direction={direction}
                onToggle={() => toggle("files")}
                align="right"
              />
              <Th>Path</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((folder) => (
              <tr key={folder.path} className="transition-colors hover:bg-surface/60">
                <Td className="max-w-56 truncate font-medium" title={folder.name}>
                  {folder.name}
                </Td>
                <Td className="whitespace-nowrap text-right tabular-nums">
                  {formatBytes(folder.sizeBytes)}
                </Td>
                <Td className="whitespace-nowrap text-right tabular-nums text-muted">
                  {folder.fileCount.toLocaleString()}
                </Td>
                <Td className="max-w-80 truncate text-muted" title={folder.path}>
                  {folder.path}
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      disabled={scanning}
                      onClick={() => void startScan(folder.path)}
                      title="Scan this folder"
                      aria-label="Scan this folder"
                      className="rounded-md p-1.5 text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                      <FolderSearch className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <RevealButton path={folder.path} title="Open folder" />
                    <CopyPathButton path={folder.path} />
                    <AddToQueueButton
                      entry={{
                        path: folder.path,
                        name: folder.name,
                        kind: "folder",
                        sizeBytes: folder.sizeBytes,
                      }}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {sorted.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">
            No folders match the current filters.
          </p>
        ) : null}
      </TableContainer>
    </div>
  );
}
