"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { TemplateQuestion } from "@/types/evaluation";

interface QuestionRendererProps {
  question: TemplateQuestion;
  questionNumber: number;
  answer: string | number | boolean | undefined;
  onAnswer: (value: string | number | boolean) => void;
  /** Show error ring + message when true */
  hasError?: boolean;
  /** Show placeholder text when question text is empty (preview mode) */
  showPlaceholder?: boolean;
  /** Word limit for text questions (default: 1000) */
  wordLimit?: number;
  /** Whether to show word count on text questions (default: true in form, false in preview) */
  showWordCount?: boolean;
  /** Indent class for input area — defaults to "pl-0 sm:pl-10" */
  indentClass?: string;
}

function RatingScale({
  question: q,
  answer,
  onAnswer,
  indentClass,
}: {
  question: TemplateQuestion;
  answer: number | undefined;
  onAnswer: (value: number) => void;
  indentClass: string;
}) {
  const [hoveredVal, setHoveredVal] = useState<number | null>(null);

  const scaleMin = q.scaleMin || 1;
  const scaleMax = q.scaleMax || 5;
  const values = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => i + scaleMin);
  const firstLabel = q.scaleLabels?.[0];
  const lastLabel = q.scaleLabels?.[q.scaleLabels.length - 1];
  const activeTooltip = hoveredVal !== null ? q.scaleLabels?.[hoveredVal - scaleMin] : null;

  return (
    <div className={indentClass}>
      <div className="relative flex items-center justify-between">
        {/* Track line */}
        <div className="absolute inset-x-4 sm:inset-x-5 top-1/2 -translate-y-1/2 h-[3px] bg-gray-100" />
        {answer !== undefined && (
          <div
            className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-[3px] bg-gray-300"
            style={{ width: `calc(${((answer - scaleMin) / (scaleMax - scaleMin)) * 100}% * (1 - 40px / 100%) )` }}
          />
        )}
        {/* Scale points */}
        {values.map((val) => {
          const isSelected = answer === val;
          const isFilled = answer !== undefined && val <= answer;
          return (
            <button
              key={val}
              onClick={() => onAnswer(val)}
              onMouseEnter={() => setHoveredVal(val)}
              onMouseLeave={() => setHoveredVal(null)}
              className={`
                relative z-10 flex items-center justify-center
                ${isSelected
                  ? "w-10 h-10 sm:w-11 sm:h-11 bg-gray-900 text-white ring-4 ring-gray-900/10 scale-110"
                  : isFilled
                    ? "w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 text-gray-900 border-2 border-gray-300 hover:bg-gray-200"
                    : "w-8 h-8 sm:w-9 sm:h-9 bg-white text-gray-500 border-2 border-gray-200 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50"
                }
              `}
            >
              <span className={`font-semibold ${isSelected ? "text-[15px]" : "text-[13px]"}`}>{val}</span>
            </button>
          );
        })}
      </div>
      {/* Label row */}
      <div className="relative h-5 mt-2">
        {(firstLabel || lastLabel) && (
          <div className="flex justify-between px-1">
            <span className="text-[12px] font-medium text-gray-400">{firstLabel}</span>
            <span className="text-[12px] font-medium text-gray-400">{lastLabel}</span>
          </div>
        )}
        {activeTooltip && (
          <span
            className="absolute top-0 -translate-x-1/2 px-2 py-0.5 bg-gray-800 text-white text-[11px] font-medium whitespace-nowrap z-10"
            style={{ left: `${((hoveredVal! - scaleMin) / Math.max(scaleMax - scaleMin, 1)) * 100}%` }}
          >
            {activeTooltip}
          </span>
        )}
      </div>
    </div>
  );
}

export function QuestionRenderer({
  question: q,
  questionNumber,
  answer,
  onAnswer,
  hasError = false,
  showPlaceholder = false,
  wordLimit = 1000,
  showWordCount = true,
  indentClass = "pl-0 sm:pl-10",
}: QuestionRendererProps) {
  const isAnswered = answer !== undefined;

  const wrapperClass = hasError
    ? "relative border border-gray-900 p-4 -m-4"
    : "relative";

  return (
    <div className={wrapperClass}>
      {/* Question Number & Label */}
      <div className="flex items-start gap-2 sm:gap-3 mb-4">
        <span
          className={`
            w-7 h-7 flex items-center justify-center text-[12px] font-semibold flex-shrink-0 mt-0.5
            ${isAnswered
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-400"
            }
          `}
        >
          {isAnswered ? <Check size={13} strokeWidth={2.5} /> : questionNumber}
        </span>
        <label className="text-body-emphasis text-gray-800 leading-snug">
          {showPlaceholder && !q.text ? (
            <span className="text-gray-300 italic">Question text...</span>
          ) : (
            q.text
          )}
          {q.required && <span className="text-gray-900 ml-1">*</span>}
        </label>
      </div>

      {/* Rating Scale */}
      {q.type === "rating_scale" && (
        <RatingScale
          question={q}
          answer={answer as number | undefined}
          onAnswer={onAnswer}
          indentClass={indentClass}
        />
      )}

      {/* Text Input */}
      {q.type === "text" && (() => {
        const text = (answer as string) || "";
        const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
        const isOverLimit = wordCount > wordLimit;

        return (
          <div className={indentClass}>
            <textarea
              value={text}
              onChange={(e) => {
                const value = e.target.value;
                if (showWordCount) {
                  const count = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
                  if (count <= wordLimit) onAnswer(value);
                } else {
                  onAnswer(value);
                }
              }}
              placeholder="Share your thoughts..."
              rows={4}
              className={`w-full px-4 py-3 border bg-white text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:outline-2 focus:outline-accent focus:outline-offset-2 resize-none ${
                isOverLimit ? "border-gray-900" : "border-gray-900"
              }`}
            />
            {showWordCount && (
              <div className="flex justify-end mt-1.5">
                <span className={`text-[12px] tabular-nums ${isOverLimit ? "text-gray-900 font-medium" : wordCount >= wordLimit * 0.9 ? "text-gray-900" : "text-gray-400"}`}>
                  {wordCount}/{wordLimit} words
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Multiple Choice */}
      {q.type === "multiple_choice" && q.options && (
        <div className={`${indentClass} space-y-2`}>
          {q.options.map((option, optIdx) => {
            const selected = answer === option;
            const letter = String.fromCharCode(65 + optIdx);
            return (
              <button
                key={option}
                onClick={() => onAnswer(option)}
                className={`
                  w-full flex items-center gap-3 text-left px-4 py-3 text-[14px] border
                  ${selected
                    ? "border-gray-900 bg-white ring-2 ring-gray-900/10"
                    : "border-gray-200 bg-white hover:border-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                <span
                  className={`
                    w-7 h-7 flex items-center justify-center text-[12px] font-semibold flex-shrink-0
                    ${selected
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-400"
                    }
                  `}
                >
                  {selected ? <Check size={13} strokeWidth={2.5} /> : letter}
                </span>
                <span className={`font-medium ${selected ? "text-gray-900" : "text-gray-700"}`}>{option}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Inline Validation Error */}
      {hasError && (
        <p className={`${indentClass} mt-2 text-[13px] text-gray-900 font-medium`}>This question is required</p>
      )}
    </div>
  );
}
