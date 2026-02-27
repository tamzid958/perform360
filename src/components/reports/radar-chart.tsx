"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { CategoryScore } from "@/types/report";

interface CompetencyRadarChartProps {
  categories: CategoryScore[];
}

export function CompetencyRadarChart({ categories }: CompetencyRadarChartProps) {
  if (categories.length === 0) return null;

  const maxScale = categories[0]?.maxScore ?? 5;

  const data = categories.map((c) => ({
    category: c.category,
    score: c.score,
    fullMark: maxScale,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="var(--gray-200)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fontSize: 12, fill: "var(--gray-600)" }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, maxScale]}
          tick={{ fontSize: 11, fill: "var(--gray-400)" }}
          tickCount={maxScale + 1}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#0071e3"
          fill="#0071e3"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
