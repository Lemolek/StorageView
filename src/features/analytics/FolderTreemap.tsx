import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { formatBytes } from "@/lib/format/bytes";
import type { DirectoryEntry } from "@/types/scan";
import type { ChartPalette } from "./palette";

const VISIBLE_FOLDERS = 30;

interface FolderTreemapProps {
  folders: DirectoryEntry[];
  palette: ChartPalette;
}

interface TreemapNodeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  palette: ChartPalette;
}

function TreemapNode({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  name,
  palette,
}: TreemapNodeProps) {
  if (width <= 0 || height <= 0) {
    return null;
  }
  const fill =
    palette.sequence[
      Math.min(
        Math.floor((index / VISIBLE_FOLDERS) * palette.sequence.length),
        palette.sequence.length - 1,
      )
    ] ?? palette.bar;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={fill}
        stroke={palette.markStroke}
        strokeWidth={2}
      />
      {width > 72 && height > 26 && name ? (
        <text
          x={x + 8}
          y={y + 18}
          fill="#ffffff"
          fontSize={11}
          style={{ pointerEvents: "none" }}
        >
          {name.length > Math.floor(width / 7)
            ? `${name.slice(0, Math.floor(width / 7))}…`
            : name}
        </text>
      ) : null}
    </g>
  );
}

export function FolderTreemap({ folders, palette }: FolderTreemapProps) {
  const data = folders.slice(0, VISIBLE_FOLDERS).map((folder) => ({
    name: folder.name,
    size: folder.sizeBytes,
    path: folder.path,
  }));
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="size"
          isAnimationActive={false}
          content={<TreemapNode palette={palette} />}
        >
          <Tooltip
            formatter={(value) => formatBytes(Number(value ?? 0))}
            labelFormatter={(label, payload) => {
              const path = (payload?.[0]?.payload as { path?: string } | undefined)
                ?.path;
              return path ?? label;
            }}
            contentStyle={{
              backgroundColor: palette.tooltipBackground,
              border: `1px solid ${palette.tooltipBorder}`,
              borderRadius: 8,
              color: palette.tooltipText,
              maxWidth: 420,
            }}
            itemStyle={{ color: palette.tooltipText }}
            labelStyle={{ color: palette.tooltipText }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
