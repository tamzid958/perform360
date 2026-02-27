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

interface CompletionTrendDataPoint {
  cycleName: string;
  completionRate: number | null;
  isDraft: boolean;
}

interface CompletionTrendChartProps {
  data: CompletionTrendDataPoint[];
}

function DraftDot(props: Record<string, unknown>) {
  const { cx, cy, payload } = props as { cx: number; cy: number; payload: CompletionTrendDataPoint };
  if (!payload?.isDraft || !cx || !cy) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="none"
      stroke="#888888"
      strokeWidth={1.5}
      strokeDasharray="3 2"
    />
  );
}

export function CompletionTrendChart({ data }: CompletionTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-[14px] text-gray-400 uppercase tracking-wider">
        No cycle data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
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
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#888888" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 0,
            border: "1px solid #DDDDDD",
            fontSize: 13,
          }}
          formatter={(value, _name, entry) =>
            (entry as { payload: CompletionTrendDataPoint })?.payload?.isDraft
              ? ["Upcoming", "Draft"]
              : [`${Number(value)?.toFixed(1) ?? "–"}%`, "Completion"]
          }
        />
        <Area
          type="monotone"
          dataKey="completionRate"
          stroke="#111111"
          strokeWidth={2}
          fill="#DDDDDD"
          fillOpacity={0.3}
          dot={<DraftDot />}
          activeDot={{ r: 4, fill: "#111111", stroke: "#fff", strokeWidth: 2 }}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
