"use client";

import { InlineDistribution } from "@/components/reports/inline-distribution";
import { Badge } from "@/components/ui/badge";
import type { QuestionDetail } from "@/types/report";

interface QuestionRowProps {
  question: QuestionDetail;
  maxScore?: number;
  showVarianceBadge?: boolean;
}

export function QuestionRow({
  question,
  maxScore = 5,
  showVarianceBadge = false,
}: QuestionRowProps) {
  const score = question.averageScore;
  if (score === null) return null;

  const pct = (score / maxScore) * 100;
  const isHigh = score >= 4.0;
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
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-gray-900 hidden sm:inline-flex">
              Mixed
            </Badge>
          )}
          <span
            className={`text-[14px] font-semibold tabular-nums text-right ${
              isHigh ? "text-accent" : "text-gray-900"
            }`}
          >
            {score.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Score bar + meta row */}
      <div className="flex items-center gap-3 mt-1.5">
        <div className="flex-1 h-[2px] bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-gray-900"
            style={{ width: `${pct}%` }}
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
