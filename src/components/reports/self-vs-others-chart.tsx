"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Eye, EyeOff } from "lucide-react";
import type { SelfVsOthersItem } from "@/types/report";

interface SelfVsOthersChartProps {
  data: SelfVsOthersItem[];
}

const INSIGHT_CONFIG = {
  blind_spot: {
    label: "Blind Spot",
    description: "You rate yourself higher than others rate you",
    color: "#E63946",
    icon: EyeOff,
  },
  hidden_strength: {
    label: "Hidden Strength",
    description: "Others rate you higher than you rate yourself",
    color: "#111111",
    icon: Eye,
  },
} as const;

export function SelfVsOthersChart({ data }: SelfVsOthersChartProps) {
  const hasAnyData = data.some((d) => d.selfScore !== null || d.othersScore !== null);
  if (!hasAnyData) return null;

  const hasSelf = data.some((d) => d.selfScore !== null);
  if (!hasSelf) return null;

  const chartData = data.map((d) => ({
    category: d.category.length > 20 ? d.category.slice(0, 18) + "…" : d.category,
    fullCategory: d.category,
    Self: d.selfScore,
    Others: d.othersScore,
    gap: d.gap,
    insight: d.insight,
  }));

  const blindSpots = data.filter((d) => d.insight === "blind_spot");
  const hiddenStrengths = data.filter((d) => d.insight === "hidden_strength");

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="uppercase tracking-wider">Self-Awareness Analysis</CardTitle>
      </CardHeader>

      {/* Chart */}
      <div className="px-1">
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 52 + 40)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
            barGap={2}
            barSize={14}
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
              dataKey="category"
              tick={{ fontSize: 12, fill: "#888888" }}
              axisLine={false}
              tickLine={false}
              width={140}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 0,
                border: "1px solid #DDDDDD",
                fontSize: 13,
              }}
              formatter={(value) => [
                typeof value === "number" ? value.toFixed(2) : "N/A",
                "Score",
              ]}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.category === label);
                return item?.fullCategory ?? label;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <ReferenceLine x={0} stroke="#DDDDDD" />
            <Bar dataKey="Self" fill="#888888" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Others" fill="#111111" radius={[0, 0, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Summary */}
      {(blindSpots.length > 0 || hiddenStrengths.length > 0) && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {blindSpots.length > 0 && (
              <InsightGroup type="blind_spot" items={blindSpots} />
            )}
            {hiddenStrengths.length > 0 && (
              <InsightGroup type="hidden_strength" items={hiddenStrengths} />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function InsightGroup({
  type,
  items,
}: {
  type: "blind_spot" | "hidden_strength";
  items: SelfVsOthersItem[];
}) {
  const config = INSIGHT_CONFIG[type];
  const Icon = config.icon;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 flex items-center justify-center"
          style={{ backgroundColor: `${config.color}12`, color: config.color }}
        >
          <Icon size={14} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-gray-900 uppercase tracking-wider">
            {config.label}{items.length > 1 ? "s" : ""}
          </p>
          <p className="text-[11px] text-gray-400 leading-tight">{config.description}</p>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.category}
            className="flex items-center justify-between text-[13px] py-1.5 px-3 bg-gray-50"
          >
            <span className="text-gray-600 truncate mr-3">{item.category}</span>
            <span className="font-semibold tabular-nums shrink-0" style={{ color: config.color }}>
              {item.gap !== null ? (item.gap > 0 ? "+" : "") + item.gap.toFixed(1) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
