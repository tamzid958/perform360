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
  external: number | null;
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  Manager: "#111111",
  Peer: "#888888",
  "Direct Report": "#DDDDDD",
  Self: "#888888",
  External: "#111111",
};

export function RelationshipScoreChart({
  manager,
  peer,
  directReport,
  self,
  external,
}: RelationshipScoreChartProps) {
  const data = [
    { name: "Manager", score: manager },
    { name: "Peer", score: peer },
    { name: "Direct Report", score: directReport },
    { name: "Self", score: self },
    { name: "External", score: external },
  ].filter((d): d is { name: string; score: number } => d.score !== null && d.score > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px] text-[14px] text-gray-400 uppercase tracking-wider">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={40} margin={{ bottom: 4 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#DDDDDD"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "#888888" }}
          axisLine={{ stroke: "#DDDDDD" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 5]}
          tick={{ fontSize: 12, fill: "#888888" }}
          axisLine={false}
          tickLine={false}
          tickCount={6}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 0,
            border: "1px solid #DDDDDD",
            fontSize: 13,
          }}
          formatter={(value) => [Number(value).toFixed(2), "Avg Score"]}
        />
        <Bar dataKey="score" radius={[0, 0, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={RELATIONSHIP_COLORS[entry.name] ?? "#111111"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
