"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const TEAM_COLORS = [
  "#0071e3",
  "#34c759",
  "#af52de",
  "#f5a623",
  "#5ac8fa",
  "#ff6482",
  "#30b0c7",
  "#ff9f0a",
];

interface TeamPerformanceOverlayChartProps {
  data: Record<string, string | number | null>[];
  teams: { teamId: string; teamName: string }[];
}

export function TeamPerformanceOverlayChart({
  data,
  teams,
}: TeamPerformanceOverlayChartProps) {
  if (data.length === 0 || teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-[340px] text-[14px] text-gray-400">
        No team data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
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
          formatter={(value) => [Number(value)?.toFixed(2) ?? "–", "Avg Score"]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        {teams.map((team, i) => (
          <Line
            key={team.teamId}
            type="monotone"
            dataKey={team.teamName}
            stroke={TEAM_COLORS[i % TEAM_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
            activeDot={{ r: 5, fill: TEAM_COLORS[i % TEAM_COLORS.length], stroke: "#fff", strokeWidth: 2 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
