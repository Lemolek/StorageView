import { useMemo, useState } from "react";
import { ListTree } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { SortableTh } from "@/components/ui/SortableTh";
import { Table, TableContainer, Td, Th } from "@/components/ui/Table";
import { useSortable } from "@/hooks/useSortable";
import { formatBytes } from "@/lib/format/bytes";
import { formatPercent } from "@/lib/format/percent";
import type { SortAccessor } from "@/lib/tables/sort";
import type { FileTypeStat } from "@/types/scan";

type TypeSortKey = "extension" | "total" | "count" | "largest";

const accessors: Record<TypeSortKey, SortAccessor<FileTypeStat>> = {
  extension: (stat) => stat.extension,
  total: (stat) => stat.totalBytes,
  count: (stat) => stat.fileCount,
  largest: (stat) => stat.largestFileBytes,
};

interface FileTypesTableProps {
  fileTypes: FileTypeStat[];
  totalBytes: number;
  onDrilldown: (extension: string) => void;
}

export function FileTypesTable({
  fileTypes,
  totalBytes,
  onDrilldown,
}: FileTypesTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase().replace(/^\./, "");
    if (!query) {
      return fileTypes;
    }
    return fileTypes.filter((stat) => stat.extension.includes(query));
  }, [fileTypes, search]);

  const { sorted, sortKey, direction, toggle } = useSortable(
    filtered,
    accessors,
    "total",
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by extension…"
          className="w-72"
        />
        <p className="ml-auto text-[11px] uppercase tracking-wider text-muted">
          {sorted.length.toLocaleString()} of {fileTypes.length.toLocaleString()}{" "}
          types
        </p>
      </div>
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <SortableTh
                label="Extension"
                active={sortKey === "extension"}
                direction={direction}
                onToggle={() => toggle("extension")}
              />
              <SortableTh
                label="Total size"
                active={sortKey === "total"}
                direction={direction}
                onToggle={() => toggle("total")}
                align="right"
              />
              <SortableTh
                label="Files"
                active={sortKey === "count"}
                direction={direction}
                onToggle={() => toggle("count")}
                align="right"
              />
              <Th className="text-right">Average size</Th>
              <SortableTh
                label="Largest file"
                active={sortKey === "largest"}
                direction={direction}
                onToggle={() => toggle("largest")}
                align="right"
              />
              <Th className="text-right">Share</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((stat) => (
              <tr
                key={stat.extension || "(none)"}
                className="transition-colors duration-(--motion-ms) hover:bg-card-hover"
              >
                <Td className="text-[13px] font-medium text-foreground">
                  {stat.extension ? `.${stat.extension}` : "No extension"}
                </Td>
                <Td className="whitespace-nowrap text-right text-[13px] tabular-nums text-foreground">
                  {formatBytes(stat.totalBytes)}
                </Td>
                <Td className="whitespace-nowrap text-right text-xs tabular-nums text-muted">
                  {stat.fileCount.toLocaleString()}
                </Td>
                <Td className="whitespace-nowrap text-right text-xs tabular-nums text-muted">
                  {formatBytes(stat.fileCount > 0 ? stat.totalBytes / stat.fileCount : 0)}
                </Td>
                <Td className="whitespace-nowrap text-right text-xs tabular-nums text-muted">
                  {formatBytes(stat.largestFileBytes)}
                </Td>
                <Td className="whitespace-nowrap text-right text-xs tabular-nums text-muted">
                  {formatPercent(totalBytes > 0 ? stat.totalBytes / totalBytes : 0)}
                </Td>
                <Td>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onDrilldown(stat.extension)}
                      title="Show files"
                      aria-label="Show files"
                      className="rounded-[5px] p-1 text-muted transition-colors duration-(--motion-ms) hover:bg-card-hover hover:text-foreground"
                    >
                      <ListTree className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {sorted.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">
            No file types match the current filters.
          </p>
        ) : null}
      </TableContainer>
    </div>
  );
}
