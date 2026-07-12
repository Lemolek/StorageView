import { File, Folder } from "lucide-react";
import { CopyPathButton } from "@/components/ui/CopyPathButton";
import { SortableTh } from "@/components/ui/SortableTh";
import { Table, TableContainer, Td, Th } from "@/components/ui/Table";
import { AddToQueueButton } from "@/features/cleanup/AddToQueueButton";
import { RevealButton } from "@/features/explorer/RevealButton";
import { useSortable } from "@/hooks/useSortable";
import { formatBytes } from "@/lib/format/bytes";
import { formatDateTime } from "@/lib/format/datetime";
import type { SortAccessor } from "@/lib/tables/sort";
import type { SearchHit } from "@/types/search";

type HitSortKey = "name" | "size" | "modified";

const accessors: Record<HitSortKey, SortAccessor<SearchHit>> = {
  name: (hit) => hit.name,
  size: (hit) => hit.sizeBytes,
  modified: (hit) => hit.modifiedMs,
};

export function SearchResultsTable({ hits }: { hits: SearchHit[] }) {
  const { sorted, sortKey, direction, toggle } = useSortable(
    hits,
    accessors,
    "size",
  );

  return (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <Th>Type</Th>
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
          {sorted.map((hit) => (
            <tr
              key={hit.path}
              className="transition-colors duration-(--motion-ms) hover:bg-surface/60"
            >
              <Td className="text-muted">
                {hit.kind === "folder" ? (
                  <Folder className="h-4 w-4" aria-label="Folder" />
                ) : (
                  <File className="h-4 w-4" aria-label="File" />
                )}
              </Td>
              <Td
                className="max-w-56 truncate text-[13px] font-medium text-foreground"
                title={hit.name}
              >
                {hit.name}
              </Td>
              <Td className="whitespace-nowrap text-right text-[13px] tabular-nums text-foreground">
                {hit.kind === "folder" ? "—" : formatBytes(hit.sizeBytes)}
              </Td>
              <Td className="whitespace-nowrap text-xs text-muted">
                {formatDateTime(hit.modifiedMs)}
              </Td>
              <Td className="max-w-80 truncate text-xs text-muted" title={hit.path}>
                {hit.path}
              </Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <RevealButton
                    path={hit.path}
                    title={hit.kind === "folder" ? "Open folder" : "Open file location"}
                  />
                  <CopyPathButton path={hit.path} />
                  <AddToQueueButton
                    entry={{
                      path: hit.path,
                      name: hit.name,
                      kind: hit.kind,
                      sizeBytes: hit.sizeBytes,
                    }}
                  />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
}
