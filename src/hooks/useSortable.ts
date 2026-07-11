import { useMemo, useState } from "react";
import {
  sortByAccessor,
  type SortAccessor,
  type SortDirection,
} from "@/lib/tables/sort";

export function useSortable<T, K extends string>(
  items: readonly T[],
  accessors: Record<K, SortAccessor<T>>,
  initialKey: NoInfer<K>,
  initialDirection: SortDirection = "desc",
) {
  const [sortKey, setSortKey] = useState<K>(initialKey);
  const [direction, setDirection] = useState<SortDirection>(initialDirection);

  const toggle = (key: K) => {
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  };

  const accessor = accessors[sortKey];
  const sorted = useMemo(
    () => sortByAccessor(items, accessor, direction),
    [items, accessor, direction],
  );

  return { sorted, sortKey, direction, toggle };
}
