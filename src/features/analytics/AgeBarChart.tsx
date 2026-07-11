import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBytes } from "@/lib/format/bytes";
import type { AgeBucket } from "@/types/scan";
import type { ChartPalette } from "./palette";

interface AgeBarChartProps {
  ageDistribution: AgeBucket[];
  palette: ChartPalette;
}

export function AgeBarChart({ ageDistribution, palette }: AgeBarChartProps) {
  const data = ageDistribution.filter(
    (bucket) => bucket.label !== "Unknown" || bucket.fileCount > 0,
  );
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ right: 8 }}>
          <CartesianGrid vertical={false} stroke={palette.grid} strokeWidth={1} />
          <XAxis
            dataKey="label"
            tick={{ fill: palette.axisText, fontSize: 10 }}
            axisLine={{ stroke: palette.grid }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tickFormatter={(value: number) => formatBytes(value, 0)}
            tick={{ fill: palette.axisText, fontSize: 11 }}
            axisLine={{ stroke: palette.grid }}
            tickLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ fill: palette.grid, fillOpacity: 0.35 }}
            formatter={(value, _name, item) => {
              const fileCount = Number(
                (item?.payload as { fileCount?: number } | undefined)?.fileCount ??
                  0,
              );
              return [
                `${formatBytes(Number(value ?? 0))} · ${fileCount.toLocaleString()} files`,
                "Size",
              ];
            }}
            contentStyle={{
              backgroundColor: palette.tooltipBackground,
              border: `1px solid ${palette.tooltipBorder}`,
              borderRadius: 8,
              color: palette.tooltipText,
            }}
            itemStyle={{ color: palette.tooltipText }}
            labelStyle={{ color: palette.tooltipText }}
          />
          <Bar
            dataKey="totalBytes"
            fill={palette.bar}
            barSize={28}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
