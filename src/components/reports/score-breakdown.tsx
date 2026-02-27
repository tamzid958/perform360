"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CategoryScore } from "@/types/report";

interface ScoreBreakdownProps {
  categories: CategoryScore[];
  /** How many to show before collapsing (default: 6) */
  initialCount?: number;
}

export function ScoreBreakdown({ categories, initialCount = 6 }: ScoreBreakdownProps) {
  const [expanded, setExpanded] = useState(false);

  if (categories.length === 0) {
    return (
      <p className="text-callout text-gray-400 py-4 text-center">
        No scored questions in this template.
      </p>
    );
  }

  const needsToggle = categories.length > initialCount;
  const visible = needsToggle && !expanded ? categories.slice(0, initialCount) : categories;

  return (
    <div>
      {visible.map((cat) => {
        const isHigh = cat.score >= 4.0;
        return (
          <div
            key={cat.category}
            className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0"
          >
            <span className="text-[12px] text-gray-700 uppercase tracking-caps font-medium truncate mr-3">
              {cat.category}
            </span>
            <span
              className={`text-[14px] font-semibold tabular-nums shrink-0 text-right ${
                isHigh ? "text-accent" : "text-gray-900"
              }`}
            >
              {cat.score.toFixed(1)}
            </span>
          </div>
        );
      })}

      {needsToggle && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-900 mx-auto pt-2 focus:outline-2 focus:outline-accent focus:outline-offset-2"
        >
          {expanded ? (
            <>
              <ChevronUp size={13} strokeWidth={1.5} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={13} strokeWidth={1.5} />
              {categories.length - initialCount} more
            </>
          )}
        </button>
      )}
    </div>
  );
}
