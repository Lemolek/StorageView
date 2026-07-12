import { useMemo, useState } from "react";
import { CopyPathButton } from "@/components/ui/CopyPathButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { SortableTh } from "@/components/ui/SortableTh";
import { Table, TableContainer, Td, Th } from "@/components/ui/Table";
import { AddToQueueButton } from "@/features/cleanup/AddToQueueButton";
import { useSortable } from "@/hooks/useSortable";
import { formatBytes } from "@/lib/format/bytes";
import { formatDateTime } from "@/lib/format/datetime";
import type { SortAccessor } from "@/lib/tables/sort";
import type { FileEntry } from "@/types/scan";
import { RevealButton } from "./RevealButton";

type FileSortKey = "name" | "size" | "extension" | "modified";

const accessors: Record<FileSortKey, SortAccessor<FileEntry>> = {
  name: (file) => file.name,
  size: (file) => file.sizeBytes,
  extension: (file) => file.extension,
  modified: (file) => file.modifiedMs,
};

const minSizeOptions = [
  { label: "Any size", value: 0 },
  { label: "≥ 10 MB", value: 10 * 1024 * 1024 },
  { label: "≥ 100 MB", value: 100 * 1024 * 1024 },
  { label: "≥ 1 GB", value: 1024 * 1024 * 1024 },
];

export function LargestFilesTable({ files }: { files: FileEntry[] }) {
  const [search, setSearch] = useState("");
  const [minSize, setMinSize] = useState(0);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return files.filter((file) => {
      if (file.sizeBytes < minSize) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        file.name.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query)
      );
    });
  }, [files, search, minSize]);

  const { sorted, sortKey, direction, toggle } = useSortable(
    filtered,
    accessors,
    "size",
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or path…"
          className="w-72"
        />
        <Select
          value={minSize}
          onChange={(event) => setMinSize(Number(event.target.value))}
          aria-label="Minimum size"
        >
          {minSizeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <p className="ml-auto text-[11px] uppercase tracking-wider text-muted">
          {sorted.length.toLocaleString()} of {files.length.toLocaleString()} files
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
                label="Type"
                active={sortKey === "extension"}
                direction={direction}
                onToggle={() => toggle("extension")}
              />
              <SortableTh
                label="Modified"
                active={sortKey === "modified"}
                direction={direction}
                onToggle={() => toggle("modified")}
              />
              <Th>Path</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((file) => (
              <tr
                key={file.path}
                className="transition-colors duration-(--motion-ms) hover:bg-card-hover"
              >
                <Td
                  className="max-w-56 truncate text-[13px] font-medium text-foreground"
                  title={file.name}
                >
                  {file.name}
                </Td>
                <Td className="whitespace-nowrap text-right text-[13px] tabular-nums text-foreground">
                  {formatBytes(file.sizeBytes)}
                </Td>
                <Td className="text-xs text-muted">{file.extension || "—"}</Td>
                <Td className="whitespace-nowrap text-xs text-muted">
                  {formatDateTime(file.modifiedMs)}
                </Td>
                <Td className="max-w-80 truncate text-xs text-muted" title={file.path}>
                  {file.path}
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <RevealButton path={file.path} title="Open file location" />
                    <CopyPathButton path={file.path} />
                    <AddToQueueButton
                      entry={{
                        path: file.path,
                        name: file.name,
                        kind: "file",
                        sizeBytes: file.sizeBytes,
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
            No files match the current filters.
          </p>
        ) : null}
      </TableContainer>
    </div>
  );
}
