"use client";

import { Star, ToggleLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QuestionData {
  id: string;
  text: string;
  type: "rating_scale" | "text" | "multiple_choice" | "yes_no" | "competency_matrix";
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
}

interface SectionData {
  id: string;
  title: string;
  description?: string;
  questions: QuestionData[];
}

interface TemplatePreviewProps {
  name: string;
  description: string;
  sections: SectionData[];
}

export function TemplatePreview({ name, description, sections }: TemplatePreviewProps) {
  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Star size={24} strokeWidth={1.5} className="text-gray-300" />
        </div>
        <p className="text-[14px] text-gray-400 mb-1">No sections yet</p>
        <p className="text-[12px] text-gray-300">Add sections and questions to see a preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-[17px] font-semibold text-gray-900">
          {name || "Untitled Template"}
        </h3>
        {description && (
          <p className="text-[13px] text-gray-500 mt-1">{description}</p>
        )}
        <p className="text-[12px] text-gray-400 mt-2">
          {sections.length} {sections.length === 1 ? "section" : "sections"} &middot; {totalQuestions} {totalQuestions === 1 ? "question" : "questions"}
        </p>
      </div>

      {/* Sections */}
      {sections.map((section, sIndex) => (
        <div key={section.id}>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#0071e3]/10 text-[#0071e3] text-[11px] font-semibold">
              {sIndex + 1}
            </span>
            <h4 className="text-[15px] font-semibold text-gray-800">{section.title || "Untitled Section"}</h4>
          </div>
          {section.description && (
            <p className="text-[12px] text-gray-400 mb-3 ml-8">{section.description}</p>
          )}

          <div className="space-y-3 ml-8">
            {section.questions.map((q, qIndex) => (
              <PreviewQuestion key={q.id} question={q} index={qIndex} />
            ))}
            {section.questions.length === 0 && (
              <p className="text-[12px] text-gray-300 italic">No questions in this section</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewQuestion({ question, index }: { question: QuestionData; index: number }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-[11px] text-gray-400 mt-0.5">{index + 1}.</span>
        <div className="flex-1">
          <p className="text-[13px] text-gray-700 leading-relaxed">
            {question.text || <span className="text-gray-300 italic">Question text...</span>}
            {question.required && <span className="text-red-400 ml-0.5">*</span>}
          </p>
        </div>
      </div>

      {/* Type-specific preview */}
      <div className="ml-5">
        {question.type === "rating_scale" && (
          <PreviewRatingScale
            min={question.scaleMin ?? 1}
            max={question.scaleMax ?? 5}
            labels={question.scaleLabels}
          />
        )}
        {question.type === "text" && (
          <div className="h-16 rounded-lg border border-gray-200 bg-white flex items-start p-2">
            <span className="text-[11px] text-gray-300">Type your response...</span>
          </div>
        )}
        {question.type === "multiple_choice" && (
          <PreviewMultipleChoice options={question.options ?? []} />
        )}
        {question.type === "yes_no" && (
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">
              <ToggleLeft size={14} strokeWidth={1.5} className="text-gray-400" />
              <span className="text-[12px] text-gray-500">Yes</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">
              <ToggleLeft size={14} strokeWidth={1.5} className="text-gray-400" />
              <span className="text-[12px] text-gray-500">No</span>
            </div>
          </div>
        )}
        {question.type === "competency_matrix" && (
          <Badge variant="outline" className="text-[11px]">Competency Matrix</Badge>
        )}
      </div>
    </div>
  );
}

function PreviewRatingScale({
  min,
  max,
  labels,
}: {
  min: number;
  max: number;
  labels?: string[];
}) {
  const count = max - min + 1;
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: count }, (_, i) => {
        const value = min + i;
        const label = labels?.[i];
        return (
          <div
            key={value}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-[12px] text-gray-500 font-medium">
              {value}
            </div>
            {label && (
              <span className="text-[9px] text-gray-400 max-w-[3.5rem] text-center leading-tight truncate">
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PreviewMultipleChoice({ options }: { options: string[] }) {
  return (
    <div className="space-y-1.5">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
          <span className="text-[12px] text-gray-500">{opt}</span>
        </div>
      ))}
    </div>
  );
}
