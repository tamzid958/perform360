"use client";

import { InlineDistribution } from "@/components/reports/inline-distribution";
import { Badge } from "@/components/ui/badge";
import type { QuestionDetail } from "@/types/report";

interface QuestionRowProps {
  question: QuestionDetail;
  maxScore?: number;
  showVarianceBadge?: boolean;
}

function scoreColor(score: number): { bar: string; text: string } {
  if (score >= 4) return { bar: "#34c759", text: "#248a3d" };
  if (score >= 3) return { bar: "#ff9f0a", text: "#c27800" };
  return { bar: "#ff3b30", text: "#d70015" };
}

export function QuestionRow({
  question,
  maxScore = 5,
  showVarianceBadge = false,
}: QuestionRowProps) {
  const score = question.averageScore;
  if (score === null) return null;

  const pct = (score / maxScore) * 100;
  const { bar: barColor, text: textColor } = scoreColor(score);
  const hasDistribution = Object.keys(question.distribution).length > 0;

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      {/* Question text + score */}
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 min-w-0 text-[13px] text-gray-700 leading-snug line-clamp-2">
          {question.questionText}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {showVarianceBadge && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 hidden sm:inline-flex">
              Mixed
            </Badge>
          )}
          <span className="text-[14px] font-semibold tabular-nums" style={{ color: textColor }}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Score bar + meta row */}
      <div className="flex items-center gap-3 mt-1.5">
        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
        {hasDistribution && (
          <InlineDistribution
            distribution={question.distribution}
            className="w-[40px] shrink-0"
          />
        )}
        <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
          {question.responseCount} resp.
        </span>
      </div>
    </div>
  );
}
