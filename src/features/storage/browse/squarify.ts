export interface TreemapItem {
  key: string;
  value: number;
}

export interface TreemapRect {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScaledItem {
  key: string;
  area: number;
}

function rowSum(row: readonly ScaledItem[]): number {
  return row.reduce((sum, item) => sum + item.area, 0);
}

function worstAspect(row: readonly ScaledItem[], side: number): number {
  if (row.length === 0 || side <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  const sum = rowSum(row);
  if (sum <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  let worst = 0;
  for (const item of row) {
    const ratio = Math.max(
      (side * side * item.area) / (sum * sum),
      (sum * sum) / (side * side * item.area),
    );
    worst = Math.max(worst, ratio);
  }
  return worst;
}

export function squarify(
  items: readonly TreemapItem[],
  width: number,
  height: number,
): TreemapRect[] {
  const positive = items.filter((item) => item.value > 0);
  if (positive.length === 0 || width <= 0 || height <= 0) {
    return [];
  }
  const total = positive.reduce((sum, item) => sum + item.value, 0);
  const scale = (width * height) / total;
  const remaining: ScaledItem[] = positive
    .map((item) => ({ key: item.key, area: item.value * scale }))
    .sort((a, b) => b.area - a.area);

  const rects: TreemapRect[] = [];
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;
  let row: ScaledItem[] = [];

  const layoutRow = () => {
    const sum = rowSum(row);
    if (sum <= 0 || row.length === 0) {
      row = [];
      return;
    }
    if (w >= h) {
      const rowWidth = sum / h;
      let offset = y;
      for (const item of row) {
        const itemHeight = item.area / rowWidth;
        rects.push({ key: item.key, x, y: offset, width: rowWidth, height: itemHeight });
        offset += itemHeight;
      }
      x += rowWidth;
      w -= rowWidth;
    } else {
      const rowHeight = sum / w;
      let offset = x;
      for (const item of row) {
        const itemWidth = item.area / rowHeight;
        rects.push({ key: item.key, x: offset, y, width: itemWidth, height: rowHeight });
        offset += itemWidth;
      }
      y += rowHeight;
      h -= rowHeight;
    }
    row = [];
  };

  for (const item of remaining) {
    const side = Math.min(w, h);
    if (
      row.length === 0 ||
      worstAspect([...row, item], side) <= worstAspect(row, side)
    ) {
      row.push(item);
    } else {
      layoutRow();
      row.push(item);
    }
  }
  layoutRow();
  return rects;
}
