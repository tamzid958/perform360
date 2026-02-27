"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface KpiSparklineProps {
  data: (number | null)[];
  color?: string;
}

export function KpiSparkline({ data, color = "#111111" }: KpiSparklineProps) {
  const chartData = data
    .map((value, i) => ({ i, value }))
    .filter((d): d is { i: number; value: number } => d.value !== null);

  if (chartData.length < 2) return null;

  return (
    <ResponsiveContainer width={80} height={32}>
      <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={color}
          fillOpacity={0.1}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
