"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SCORE_COLORS = ["#E63946", "#92400E", "#92400E", "#1E40AF", "#2D6A4F"];

interface ScoreDistributionChartProps {
  distribution: number[];
}

export function ScoreDistributionChart({ distribution }: ScoreDistributionChartProps) {
  const data = distribution.map((count, i) => ({
    label: `${i + 1}`,
    count,
    fill: SCORE_COLORS[i],
  }));

  if (!distribution.some((n) => n > 0)) {
    return (
      <div className="flex items-center justify-center h-[240px] text-[14px] text-gray-400 uppercase tracking-wider">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="#DDDDDD" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#888888" }}
          axisLine={{ stroke: "#DDDDDD" }}
          tickLine={false}
          label={{ value: "Score", position: "insideBottom", offset: -4, fontSize: 12, fill: "#888888" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#888888" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 0,
            border: "1px solid #DDDDDD",
            fontSize: 13,
          }}
          formatter={(value) => [String(value), "Responses"]}
        />
        <Bar dataKey="count" radius={[0, 0, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
