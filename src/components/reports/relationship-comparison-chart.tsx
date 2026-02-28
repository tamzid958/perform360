"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CategoryScore, RelationshipScores } from "@/types/report";

interface CategoryRelationshipData {
  category: string;
  scores: RelationshipScores;
}

interface RelationshipComparisonChartProps {
  categories: CategoryScore[];
  /** Per-category relationship breakdown. If not provided, falls back to a single-bar view. */
  categoryRelationshipScores?: CategoryRelationshipData[];
  overallRelationship: RelationshipScores;
}

const BAR_COLORS: Record<string, string> = {
  Manager: "#0071e3",
  Peer: "#5ac8fa",
  "Direct Report": "#af52de",
  Self: "#86868b",
};

export function RelationshipComparisonChart({
  categories,
  categoryRelationshipScores,
  overallRelationship,
}: RelationshipComparisonChartProps) {
  const data = categoryRelationshipScores
    ? categoryRelationshipScores.map((c) => ({
        category: c.category,
        Manager: c.scores.manager,
        Peer: c.scores.peer,
        "Direct Report": c.scores.directReport,
        Self: c.scores.self,
      }))
    : categories.map((c) => ({
        category: c.category,
        Manager: overallRelationship.manager,
        Peer: overallRelationship.peer,
        "Direct Report": overallRelationship.directReport,
        Self: overallRelationship.self,
      }));

  if (data.length === 0) return null;

  const activeKeys = (
    ["Manager", "Peer", "Direct Report", "Self"] as const
  ).filter((k) => {
    const relKey = k === "Direct Report" ? "directReport" : k.toLowerCase();
    return overallRelationship[relKey as keyof RelationshipScores] !== null;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
        barGap={2}
        barSize={16}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--gray-200)"
          vertical={false}
        />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: "var(--gray-500)" }}
          axisLine={{ stroke: "var(--gray-200)" }}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
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
          formatter={(value) => [
            value !== null ? Number(value).toFixed(2) : "—",
            undefined,
          ]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        {activeKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            fill={BAR_COLORS[key]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
