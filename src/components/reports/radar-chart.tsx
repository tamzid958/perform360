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
  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-[14px] text-gray-400 uppercase tracking-wider">
        No data available
      </div>
    );
  }

  const maxScale = categories[0]?.maxScore ?? 5;

  const data = categories.map((c) => ({
    category: c.category,
    score: c.score,
    fullMark: maxScale,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#DDDDDD" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fontSize: 12, fill: "#888888" }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, maxScale]}
          tick={{ fontSize: 11, fill: "#888888" }}
          tickCount={maxScale + 1}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#111111"
          fill="#111111"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
