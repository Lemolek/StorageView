export type SortDirection = "asc" | "desc";

export type SortAccessor<T> = (item: T) => string | number | null;

export function sortByAccessor<T>(
  items: readonly T[],
  accessor: SortAccessor<T>,
  direction: SortDirection,
): T[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const left = accessor(a);
    const right = accessor(b);
    if (left == null && right == null) {
      return 0;
    }
    if (left == null) {
      return 1;
    }
    if (right == null) {
      return -1;
    }
    if (typeof left === "string" || typeof right === "string") {
      return (
        factor *
        String(left).localeCompare(String(right), undefined, {
          sensitivity: "base",
          numeric: true,
        })
      );
    }
    return factor * (left - right);
  });
}
