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
  if (score >= 4.0) return "#111111";
  if (score >= 3.0) return "#888888";
  return "#E63946";
}

export function TeamScoreChart({ teams }: TeamScoreChartProps) {
  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-[120px] text-[14px] text-gray-400 uppercase tracking-wider">
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
            stroke="#DDDDDD"
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 5]}
            tick={{ fontSize: 12, fill: "#888888" }}
            axisLine={false}
            tickLine={false}
            tickCount={6}
          />
          <YAxis
            type="category"
            dataKey="teamName"
            tick={{ fontSize: 13, fill: "#888888" }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 0,
              border: "1px solid #DDDDDD",
              fontSize: 13,
            }}
            formatter={(value) => [Number(value).toFixed(2), "Avg Score"]}
          />
          <Bar dataKey="avgScore" radius={[0, 0, 0, 0]}>
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
          stroke="#DDDDDD"
          horizontal={false}
        />
        <XAxis
          type="number"
          domain={[0, 5]}
          tick={{ fontSize: 12, fill: "#888888" }}
          axisLine={false}
          tickLine={false}
          tickCount={6}
        />
        <YAxis
          type="category"
          dataKey="teamName"
          tick={{ fontSize: 13, fill: "#888888" }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 0,
            border: "1px solid #DDDDDD",
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
        <Bar dataKey="rawAvgScore" fill="#DDDDDD" radius={[0, 0, 0, 0]} />
        <Bar dataKey="avgScore" radius={[0, 0, 0, 0]}>
          {sorted.map((entry) => (
            <Cell key={entry.teamName} fill={getScoreColor(entry.avgScore)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
