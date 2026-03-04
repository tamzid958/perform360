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

const RELATIONSHIP_CONFIG = [
  { key: "manager", label: "Manager", color: "#0071e3" },
  { key: "peer", label: "Peer", color: "#5ac8fa" },
  { key: "directReport", label: "Direct Report", color: "#af52de" },
  { key: "self", label: "Self", color: "#86868b" },
  { key: "external", label: "External", color: "#f5a623" },
] as const;

interface RelationshipTrendDataPoint {
  cycleName: string;
  manager: number | null;
  peer: number | null;
  directReport: number | null;
  self: number | null;
  external: number | null;
}

interface RelationshipTrendChartProps {
  data: RelationshipTrendDataPoint[];
}

export function RelationshipTrendChart({ data }: RelationshipTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[340px] text-[14px] text-gray-400">
        No relationship data available
      </div>
    );
  }

  // Only show lines for relationship types that have data in at least one cycle
  const activeRelationships = RELATIONSHIP_CONFIG.filter((rel) =>
    data.some((d) => d[rel.key] !== null)
  );

  if (activeRelationships.length === 0) {
    return (
      <div className="flex items-center justify-center h-[340px] text-[14px] text-gray-400">
        No relationship data available
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
          formatter={(value, name) => [
            Number(value)?.toFixed(2) ?? "–",
            String(name),
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        {activeRelationships.map((rel) => (
          <Line
            key={rel.key}
            type="monotone"
            dataKey={rel.key}
            name={rel.label}
            stroke={rel.color}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
            activeDot={{ r: 5, fill: rel.color, stroke: "#fff", strokeWidth: 2 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
