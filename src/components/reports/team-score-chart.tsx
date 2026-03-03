"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

interface TeamScore {
  teamName: string;
  avgScore: number;
  rawAvgScore?: number;
  hasCalibration?: boolean;
}

interface TeamScoreChartProps {
  teams: TeamScore[];
}

function getScoreColor(score: number): string {
  if (score >= 4.0) return "#34c759";
  if (score >= 3.0) return "#ff9f0a";
  return "#ff3b30";
}

export function TeamScoreChart({ teams }: TeamScoreChartProps) {
  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-[120px] text-[14px] text-gray-400">
        No data available
      </div>
    );
  }

  const sorted = [...teams].sort((a, b) => b.avgScore - a.avgScore);
  const hasAnyCalibration = sorted.some((t) => t.hasCalibration);

  if (!hasAnyCalibration) {
    return (
      <ResponsiveContainer width="100%" height={Math.max(sorted.length * 48, 120)}>
        <BarChart data={sorted} layout="vertical" barSize={20} margin={{ left: 8, right: 16 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--gray-200)"
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 5]}
            tick={{ fontSize: 12, fill: "var(--gray-400)" }}
            axisLine={false}
            tickLine={false}
            tickCount={6}
          />
          <YAxis
            type="category"
            dataKey="teamName"
            tick={{ fontSize: 13, fill: "var(--gray-600)" }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--gray-200)",
              boxShadow: "var(--shadow-md)",
              fontSize: 13,
            }}
            formatter={(value) => [Number(value).toFixed(2), "Avg Score"]}
          />
          <Bar dataKey="avgScore" radius={[0, 6, 6, 0]}>
            {sorted.map((entry) => (
              <Cell key={entry.teamName} fill={getScoreColor(entry.avgScore)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Dual-bar mode: show raw + calibrated
  return (
    <ResponsiveContainer width="100%" height={Math.max(sorted.length * 56, 120)}>
      <BarChart data={sorted} layout="vertical" barSize={12} margin={{ left: 8, right: 16 }} barGap={2}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--gray-200)"
          horizontal={false}
        />
        <XAxis
          type="number"
          domain={[0, 5]}
          tick={{ fontSize: 12, fill: "var(--gray-400)" }}
          axisLine={false}
          tickLine={false}
          tickCount={6}
        />
        <YAxis
          type="category"
          dataKey="teamName"
          tick={{ fontSize: 13, fill: "var(--gray-600)" }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--gray-200)",
            boxShadow: "var(--shadow-md)",
            fontSize: 13,
          }}
          formatter={(value, name) => [
            Number(value).toFixed(2),
            name === "rawAvgScore" ? "Raw" : "Calibrated",
          ]}
        />
        <Legend
          formatter={(value: string) => (value === "rawAvgScore" ? "Raw" : "Calibrated")}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="rawAvgScore" fill="#d1d5db" radius={[0, 6, 6, 0]} />
        <Bar dataKey="avgScore" radius={[0, 6, 6, 0]}>
          {sorted.map((entry) => (
            <Cell key={entry.teamName} fill={getScoreColor(entry.avgScore)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
