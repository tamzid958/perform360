"use client";

import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DistributionMiniChartProps {
  distribution: Record<string, number>;
}

export function DistributionMiniChart({
  distribution,
}: DistributionMiniChartProps) {
  const entries = Object.entries(distribution)
    .map(([key, count]) => ({
      label: key,
      count,
    }))
    .sort((a, b) => Number(a.label) - Number(b.label));

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60px] text-[12px] text-gray-400">
        No data available
      </div>
    );
  }

  const maxCount = Math.max(...entries.map((e) => e.count));

  return (
    <ResponsiveContainer width="100%" height={60}>
      <BarChart data={entries} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barSize={14}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--gray-400)" }}
          axisLine={false}
          tickLine={false}
        />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {entries.map((entry, idx) => (
            <Cell
              key={idx}
              fill={entry.count === maxCount ? "#0071e3" : "var(--gray-200)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
