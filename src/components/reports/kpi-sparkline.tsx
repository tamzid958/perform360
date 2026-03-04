"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface KpiSparklineProps {
  data: (number | null)[];
  color?: string;
}

export function KpiSparkline({ data, color = "#0071e3" }: KpiSparklineProps) {
  const chartData = data
    .map((value, i) => ({ i, value }))
    .filter((d): d is { i: number; value: number } => d.value !== null);

  if (chartData.length < 2) return null;

  return (
    <ResponsiveContainer width={80} height={32}>
      <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace("#", "")})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
