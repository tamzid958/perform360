"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ScoreDistributionChartProps {
  distribution: number[];
}

export function ScoreDistributionChart({ distribution }: ScoreDistributionChartProps) {
  const data = distribution.map((count, i) => ({
    label: `${i + 1}`,
    count,
  }));

  if (!distribution.some((n) => n > 0)) {
    return (
      <div className="flex items-center justify-center h-[240px] text-[14px] text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "var(--gray-600)" }}
          axisLine={{ stroke: "var(--gray-200)" }}
          tickLine={false}
          label={{ value: "Score", position: "insideBottom", offset: -4, fontSize: 12, fill: "var(--gray-400)" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--gray-400)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--gray-200)",
            boxShadow: "var(--shadow-md)",
            fontSize: 13,
          }}
          formatter={(value) => [String(value), "Responses"]}
        />
        <Bar
          dataKey="count"
          fill="#0071e3"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
