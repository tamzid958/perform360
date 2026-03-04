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

interface ScoreTrendDataPoint {
  cycleName: string;
  avgScore: number | null;
  isDraft: boolean;
}

interface ScoreTrendChartProps {
  data: ScoreTrendDataPoint[];
}

function DraftDot(props: Record<string, unknown>) {
  const { cx, cy, payload } = props as { cx: number; cy: number; payload: ScoreTrendDataPoint };
  if (!payload?.isDraft || !cx || !cy) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="none"
      stroke="var(--gray-400)"
      strokeWidth={1.5}
      strokeDasharray="3 2"
    />
  );
}

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-[14px] text-gray-400">
        No cycle data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="scoreTrendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0071e3" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#0071e3" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--gray-200)"
          vertical={false}
        />
        <XAxis
          dataKey="cycleName"
          tick={{ fontSize: 11, fill: "var(--gray-400)" }}
          axisLine={{ stroke: "var(--gray-200)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 5]}
          tick={{ fontSize: 11, fill: "var(--gray-400)" }}
          axisLine={false}
          tickLine={false}
          tickCount={6}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--gray-200)",
            boxShadow: "var(--shadow-md)",
            fontSize: 13,
          }}
          formatter={(value, _name, entry) =>
            (entry as { payload: ScoreTrendDataPoint })?.payload?.isDraft
              ? ["Upcoming", "Draft"]
              : [Number(value)?.toFixed(2) ?? "–", "Avg Score"]
          }
        />
        <Area
          type="monotone"
          dataKey="avgScore"
          stroke="#0071e3"
          strokeWidth={2}
          fill="url(#scoreTrendGradient)"
          dot={<DraftDot />}
          activeDot={{ r: 4, fill: "#0071e3", stroke: "#fff", strokeWidth: 2 }}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
