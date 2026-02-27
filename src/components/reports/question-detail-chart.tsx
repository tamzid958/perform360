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
import type { QuestionDetail } from "@/types/report";

interface QuestionDetailChartProps {
  questions: QuestionDetail[];
}

function scoreColor(score: number): string {
  if (score >= 4) return "#111111";
  if (score >= 3) return "#888888";
  return "#E63946";
}

export function QuestionDetailChart({ questions }: QuestionDetailChartProps) {
  const scored = questions.filter(
    (q): q is QuestionDetail & { averageScore: number } =>
      q.averageScore !== null && q.averageScore > 0
  );
  if (scored.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[14px] text-gray-400 uppercase tracking-wider">
        No data available
      </div>
    );
  }

  const data = scored.map((q) => ({
    question: q.questionText.length > 40
      ? q.questionText.slice(0, 37) + "…"
      : q.questionText,
    fullQuestion: q.questionText,
    score: Number(q.averageScore.toFixed(2)),
    responses: q.responseCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, scored.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
        barSize={20}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#DDDDDD"
          horizontal={false}
        />
        <XAxis
          type="number"
          domain={[0, 5]}
          tick={{ fontSize: 11, fill: "#888888" }}
          axisLine={false}
          tickLine={false}
          tickCount={6}
        />
        <YAxis
          type="category"
          dataKey="question"
          tick={{ fontSize: 11, fill: "#888888" }}
          axisLine={false}
          tickLine={false}
          width={180}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 0,
            border: "1px solid #DDDDDD",
            fontSize: 13,
          }}
          formatter={(value, _name, props) => [
            `${Number(value).toFixed(2)} / 5.0 (${props.payload.responses} responses)`,
            "Avg Score",
          ]}
          labelFormatter={(_label, payload) =>
            payload?.[0]?.payload?.fullQuestion ?? _label
          }
        />
        <Bar dataKey="score" radius={[0, 0, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={scoreColor(entry.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
