import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatBytes } from "@/lib/format/bytes";
import { formatPercent } from "@/lib/format/percent";
import type { FileTypeStat } from "@/types/scan";
import type { ChartPalette } from "./palette";

const VISIBLE_TYPES = 7;

interface FileTypesDonutProps {
  fileTypes: FileTypeStat[];
  totalBytes: number;
  palette: ChartPalette;
}

interface Slice {
  name: string;
  value: number;
  color: string;
}

function buildSlices(
  fileTypes: FileTypeStat[],
  palette: ChartPalette,
): Slice[] {
  const top = fileTypes.slice(0, VISIBLE_TYPES).map((stat, index) => ({
    name: stat.extension ? `.${stat.extension}` : "No extension",
    value: stat.totalBytes,
    color: palette.categorical[index % palette.categorical.length] ?? palette.bar,
  }));
  const restBytes = fileTypes
    .slice(VISIBLE_TYPES)
    .reduce((sum, stat) => sum + stat.totalBytes, 0);
  if (restBytes > 0) {
    top.push({ name: "Other", value: restBytes, color: palette.other });
  }
  return top;
}

export function FileTypesDonut({
  fileTypes,
  totalBytes,
  palette,
}: FileTypesDonutProps) {
  const slices = buildSlices(fileTypes, palette);
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke={palette.markStroke}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatBytes(Number(value ?? 0))}
              contentStyle={{
                backgroundColor: palette.tooltipBackground,
                border: `1px solid ${palette.tooltipBorder}`,
                borderRadius: 8,
                color: palette.tooltipText,
              }}
              itemStyle={{ color: palette.tooltipText }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
              aria-hidden="true"
            />
            <span className="truncate">{slice.name}</span>
            <span className="ml-auto shrink-0 text-muted">
              {formatBytes(slice.value)} ·{" "}
              {formatPercent(totalBytes > 0 ? slice.value / totalBytes : 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
