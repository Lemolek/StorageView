import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBytes } from "@/lib/format/bytes";
import type { ChartPalette } from "./palette";

export interface SizeDatum {
  name: string;
  value: number;
  path?: string;
}

interface SizeBarChartProps {
  data: SizeDatum[];
  palette: ChartPalette;
  height?: number;
}

export function SizeBarChart({ data, palette, height = 300 }: SizeBarChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid
            horizontal={false}
            stroke={palette.grid}
            strokeWidth={1}
          />
          <XAxis
            type="number"
            tickFormatter={(value: number) => formatBytes(value, 0)}
            tick={{ fill: palette.axisText, fontSize: 11 }}
            axisLine={{ stroke: palette.grid }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fill: palette.axisText, fontSize: 11 }}
            axisLine={{ stroke: palette.grid }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: palette.grid, fillOpacity: 0.35 }}
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
          <Bar dataKey="value" barSize={14} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((datum) => (
              <Cell key={datum.name} fill={palette.bar} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
