"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SubmissionTrendPoint {
  date: string;
  count: number;
  cumulative: number;
}

interface SubmissionTrendChartProps {
  data: SubmissionTrendPoint[];
}

export function SubmissionTrendChart({ data }: SubmissionTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-[14px] text-gray-400 uppercase tracking-wider">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#DDDDDD"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#888888" }}
          axisLine={{ stroke: "#DDDDDD" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#888888" }}
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
          formatter={(value, name) => [
            String(value),
            String(name) === "cumulative" ? "Total Submissions" : "Daily Submissions",
          ]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="#1E40AF"
          strokeWidth={2}
          fill="#1E40AF"
          fillOpacity={0.1}
          dot={false}
          activeDot={{ r: 4, fill: "#1E40AF", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
