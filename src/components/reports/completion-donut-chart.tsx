"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface CompletionDonutChartProps {
  completed: number;
  total: number;
  size?: number;
}

const COLORS = {
  completed: "#34c759",
  remaining: "#e8e8ed",
};

export function CompletionDonutChart({
  completed,
  total,
  size = 180,
}: CompletionDonutChartProps) {
  const remaining = Math.max(total - completed, 0);
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const data = [
    { name: "Completed", value: completed },
    { name: "Remaining", value: remaining || (total === 0 ? 1 : 0) },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.34}
              outerRadius={size * 0.44}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              <Cell fill={COLORS.completed} />
              <Cell fill={COLORS.remaining} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-bold text-gray-900 leading-none">
            {rate}%
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5">complete</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#34c759]" />
          <span className="text-[12px] text-gray-500">
            {completed} done
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-200" />
          <span className="text-[12px] text-gray-500">
            {remaining} left
          </span>
        </div>
      </div>
    </div>
  );
}
