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
} from "recharts";

interface RelationshipScoreChartProps {
  manager: number | null;
  peer: number | null;
  directReport: number | null;
  self: number | null;
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  Manager: "#0071e3",
  Peer: "#5ac8fa",
  "Direct Report": "#af52de",
  Self: "#86868b",
};

export function RelationshipScoreChart({
  manager,
  peer,
  directReport,
  self,
}: RelationshipScoreChartProps) {
  const data = [
    { name: "Manager", score: manager },
    { name: "Peer", score: peer },
    { name: "Direct Report", score: directReport },
    { name: "Self", score: self },
  ].filter((d): d is { name: string; score: number } => d.score !== null && d.score > 0);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={40} margin={{ bottom: 4 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--gray-200)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "var(--gray-600)" }}
          axisLine={{ stroke: "var(--gray-200)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 5]}
          tick={{ fontSize: 12, fill: "var(--gray-400)" }}
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
          formatter={(value) => [Number(value).toFixed(2), "Avg Score"]}
        />
        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={RELATIONSHIP_COLORS[entry.name] ?? "#0071e3"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
