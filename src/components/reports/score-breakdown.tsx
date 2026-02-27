"use client";

import { Progress } from "@/components/ui/progress";
import type { CategoryScore } from "@/types/report";

interface ScoreBreakdownProps {
  categories: CategoryScore[];
}

export function ScoreBreakdown({ categories }: ScoreBreakdownProps) {
  if (categories.length === 0) {
    return (
      <p className="text-callout text-gray-400 py-4 text-center">
        No scored questions in this template.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.category}>
          <div className="flex justify-between text-[14px] mb-1.5">
            <span className="text-gray-700">{cat.category}</span>
            <span className="font-medium text-gray-900">
              {cat.score.toFixed(1)}
            </span>
          </div>
          <Progress value={(cat.score / cat.maxScore) * 100} />
        </div>
      ))}
    </div>
  );
}
