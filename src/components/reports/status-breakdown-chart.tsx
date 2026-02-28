"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface StatusBreakdownChartProps {
  submitted: number;
  inProgress: number;
  pending: number;
}

const STATUS_COLORS = [
  { key: "Submitted", color: "#34c759" },
  { key: "In Progress", color: "#ff9f0a" },
  { key: "Pending", color: "#d2d2d7" },
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

  if (data.length === 0) return null;

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
              return <Cell key={entry.name} fill={c?.color ?? "#d2d2d7"} />;
            })}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--gray-200)",
              boxShadow: "var(--shadow-md)",
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
                className="w-2 h-2 rounded-full"
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
