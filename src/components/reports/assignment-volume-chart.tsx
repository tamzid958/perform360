"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface AssignmentVolumeDataPoint {
  cycleName: string;
  completed: number;
  remaining: number;
  isDraft: boolean;
}

interface AssignmentVolumeChartProps {
  data: AssignmentVolumeDataPoint[];
}

export function AssignmentVolumeChart({ data }: AssignmentVolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-[14px] text-gray-400 uppercase tracking-wider">
        No assignment data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#DDDDDD"
          vertical={false}
        />
        <XAxis
          dataKey="cycleName"
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
            value ?? 0,
            name === "completed" ? "Completed" : "Remaining",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="rect"
          iconSize={10}
          formatter={(value) => (value === "completed" ? "Completed" : "Remaining")}
        />
        <Bar dataKey="completed" stackId="a" radius={[0, 0, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill="#111111"
              fillOpacity={entry.isDraft ? 0.3 : 1}
            />
          ))}
        </Bar>
        <Bar dataKey="remaining" stackId="a" radius={[0, 0, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill="#DDDDDD"
              fillOpacity={entry.isDraft ? 0.3 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
