"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
}

function gaugeColor(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.8) return "#34c759";
  if (pct >= 0.6) return "#0071e3";
  if (pct >= 0.4) return "#ff9f0a";
  return "#ff3b30";
}

export function ScoreGauge({ score, maxScore = 5 }: ScoreGaugeProps) {
  const filled = score;
  const remaining = maxScore - score;
  const color = gaugeColor(score, maxScore);

  const data = [
    { name: "Score", value: filled },
    { name: "Remaining", value: remaining },
  ];

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={75}
            startAngle={220}
            endAngle={-40}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="var(--gray-200)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[32px] font-bold text-gray-900 leading-none">
          {score.toFixed(1)}
        </span>
        <span className="text-[12px] text-gray-400 mt-0.5">
          out of {maxScore}.0
        </span>
      </div>
    </div>
  );
}
