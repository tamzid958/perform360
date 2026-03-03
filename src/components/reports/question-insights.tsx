"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionRow } from "@/components/reports/question-row";
import { deriveQuestionHighlights } from "@/lib/report-insights";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { QuestionDetail } from "@/types/report";

interface QuestionInsightsProps {
  questions: QuestionDetail[];
}

const VARIANCE_THRESHOLD = 0.8;
const SHOW_ALL_THRESHOLD = 8;

export function QuestionInsights({ questions }: QuestionInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { strengths, growthAreas, splitOpinions, allSorted } = useMemo(
    () => deriveQuestionHighlights(questions),
    [questions]
  );

  if (allSorted.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Question Insights</CardTitle>
        </CardHeader>
        <p className="text-center py-8 text-callout text-gray-400">
          No scored questions available.
        </p>
      </Card>
    );
  }

  const showToggle = allSorted.length > SHOW_ALL_THRESHOLD;
  const showHighlights = showToggle && !isExpanded;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Question Insights</CardTitle>
      </CardHeader>

      {showHighlights ? (
        <>
          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="mb-4">
              <SectionHeader color="#34c759" label="Strengths" />
              {strengths.map((q) => (
                <QuestionRow key={q.questionId} question={q} />
              ))}
            </div>
          )}

          {/* Growth Areas */}
          {growthAreas.length > 0 && (
            <div className="mb-4">
              <SectionHeader color="#ff9f0a" label="Growth Areas" />
              {growthAreas.map((q) => (
                <QuestionRow key={q.questionId} question={q} />
              ))}
            </div>
          )}

          {/* Split Opinions */}
          {splitOpinions.length > 0 && (
            <div className="mb-4">
              <SectionHeader color="#0071e3" label="Split Opinions" />
              {splitOpinions.map((q) => (
                <QuestionRow
                  key={q.questionId}
                  question={q}
                  showVarianceBadge
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* All questions sorted by score */
        <div>
          {allSorted.map((q) => (
            <QuestionRow
              key={q.questionId}
              question={q}
              showVarianceBadge={q.variance > VARIANCE_THRESHOLD}
            />
          ))}
        </div>
      )}

      {/* Toggle */}
      {showToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors mt-4 mx-auto"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={14} strokeWidth={1.5} />
              Show highlights only
            </>
          ) : (
            <>
              <ChevronDown size={14} strokeWidth={1.5} />
              Show all {allSorted.length} questions
            </>
          )}
        </button>
      )}
    </Card>
  );
}

function SectionHeader({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <h4 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </h4>
    </div>
  );
}
