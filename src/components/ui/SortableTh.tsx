import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SortDirection } from "@/lib/tables/sort";
import { Th } from "./Table";

interface SortableThProps {
  label: string;
  active: boolean;
  direction: SortDirection;
  onToggle: () => void;
  align?: "left" | "right";
}

export function SortableTh({
  label,
  active,
  direction,
  onToggle,
  align = "left",
}: SortableThProps) {
  return (
    <Th
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      className={align === "right" ? "text-right" : undefined}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "inline-flex items-center gap-1 uppercase tracking-wide transition-colors duration-200 hover:text-foreground",
          active && "text-foreground",
        )}
      >
        {label}
        {active ? (
          direction === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
        )}
      </button>
    </Th>
  );
}
