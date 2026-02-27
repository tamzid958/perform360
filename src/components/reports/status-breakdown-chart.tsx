"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface StatusBreakdownChartProps {
  submitted: number;
  inProgress: number;
  pending: number;
}

const STATUS_COLORS = [
  { key: "Submitted", color: "#111111" },
  { key: "In Progress", color: "#888888" },
  { key: "Pending", color: "#DDDDDD" },
];

export function StatusBreakdownChart({
  submitted,
  inProgress,
  pending,
}: StatusBreakdownChartProps) {
  const data = [
    { name: "Submitted", value: submitted },
    { name: "In Progress", value: inProgress },
    { name: "Pending", value: pending },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[14px] text-gray-400 uppercase tracking-wider">
        No data available
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => {
              const c = STATUS_COLORS.find((s) => s.key === entry.name);
              return <Cell key={entry.name} fill={c?.color ?? "#DDDDDD"} />;
            })}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 0,
              border: "1px solid #DDDDDD",
              fontSize: 13,
            }}
            formatter={(value, name) => [String(value), String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-1">
        {STATUS_COLORS.map((s) => {
          const d = data.find((dd) => dd.name === s.key);
          if (!d) return null;
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[12px] text-gray-500">
                {d.value} {s.key}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
