"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronLeft, ChevronRight, Star } from "lucide-react";

interface QuestionData {
  id: string;
  text: string;
  type: "rating_scale" | "text" | "multiple_choice";
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
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Star size={24} strokeWidth={1.5} className="text-gray-300" />
        </div>
        <p className="text-[14px] text-gray-400 mb-1">No sections yet</p>
        <p className="text-[12px] text-gray-300">Add sections and questions to see a preview</p>
      </div>
    );
  }

  const section = sections[currentSection];

  function getSectionAnsweredCount(sectionIndex: number) {
    return sections[sectionIndex].questions.filter((q) => answers[q.id] !== undefined).length;
  }

  function isSectionComplete(sectionIndex: number) {
    return sections[sectionIndex].questions.every((q) => answers[q.id] !== undefined);
  }

  function setAnswer(questionId: string, value: string | number) {
    setAnswers((prev) => {
      if (value === "" || value === undefined) {
        const { [questionId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [questionId]: value };
    });
  }

  const currentQuestionOffset = sections
    .slice(0, currentSection)
    .reduce((acc, s) => acc + s.questions.length, 0);

  return (
    <div className="bg-gray-100 rounded-2xl overflow-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <div className="min-w-0">
              <p className="text-headline text-gray-900 truncate">
                {name || "Untitled Template"}
              </p>
              {description && (
                <p className="text-caption-style truncate">{description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <span className="text-caption-style hidden sm:inline">
                {answeredQuestions}/{totalQuestions}
              </span>
              <Badge
                variant={progressPercent === 100 ? "success" : "outline"}
                className="tabular-nums"
              >
                {progressPercent}%
              </Badge>
            </div>
          </div>
          <Progress value={progressPercent} className="h-1" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Section Stepper */}
        <nav className="mb-8">
          <div className="flex items-center justify-center gap-0">
            {sections.map((s, i) => {
              const complete = isSectionComplete(i);
              const active = i === currentSection;
              const answered = getSectionAnsweredCount(i);
              const total = s.questions.length;

              return (
                <div key={s.id} className="flex items-center">
                  {i > 0 && (
                    <div
                      className={`h-[2px] w-6 sm:w-10 transition-colors duration-200 ${
                        isSectionComplete(i - 1) ? "bg-green-400" : "bg-gray-200"
                      }`}
                    />
                  )}
                  <button
                    onClick={() => setCurrentSection(i)}
                    className={`
                      relative flex items-center justify-center rounded-full transition-all duration-200
                      ${active
                        ? "w-9 h-9 bg-brand-500 text-white shadow-md ring-4 ring-brand-500/15"
                        : complete
                          ? "w-7 h-7 bg-green-500 text-white hover:ring-4 hover:ring-green-500/15"
                          : answered > 0
                            ? "w-7 h-7 bg-white text-gray-500 border-2 border-brand-300 hover:border-brand-400"
                            : "w-7 h-7 bg-white text-gray-400 border-2 border-gray-200 hover:border-gray-300"
                      }
                    `}
                    title={`${s.title} (${answered}/${total})`}
                  >
                    {complete ? (
                      <Check size={active ? 15 : 13} strokeWidth={2.5} />
                    ) : (
                      <span className={`font-semibold ${active ? "text-[14px]" : "text-[12px]"}`}>
                        {i + 1}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-3">
            <p className="text-[14px] font-medium text-gray-800">{section.title || "Untitled Section"}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {getSectionAnsweredCount(currentSection)}/{section.questions.length} answered
            </p>
          </div>
        </nav>

        {/* Section Card */}
        <Card padding="lg">
          <CardHeader className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-title-small">{section.title || "Untitled Section"}</CardTitle>
                {section.description && (
                  <CardDescription className="mt-1.5">{section.description}</CardDescription>
                )}
              </div>
              <Badge variant="outline" className="flex-shrink-0 tabular-nums">
                {getSectionAnsweredCount(currentSection)}/{section.questions.length}
              </Badge>
            </div>
          </CardHeader>

          <div className="space-y-10">
            {section.questions.map((q, qIdx) => {
              const questionNumber = currentQuestionOffset + qIdx + 1;
              const isAnswered = answers[q.id] !== undefined;

              return (
                <div key={q.id}>
                  {/* Question Number & Label */}
                  <div className="flex items-start gap-3 mb-4">
                    <span
                      className={`
                        w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-semibold flex-shrink-0 mt-0.5
                        transition-colors duration-200
                        ${isAnswered
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 text-gray-400"
                        }
                      `}
                    >
                      {isAnswered ? <Check size={13} strokeWidth={2.5} /> : questionNumber}
                    </span>
                    <label className="text-body-emphasis text-gray-800 leading-snug">
                      {q.text || <span className="text-gray-300 italic">Question text...</span>}
                      {q.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                  </div>

                  {/* Rating Scale */}
                  {q.type === "rating_scale" && (
                    <div className="pl-10">
                      <div
                        className="grid gap-2"
                        style={{
                          gridTemplateColumns: `repeat(${(q.scaleMax || 5) - (q.scaleMin || 1) + 1}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from(
                          { length: (q.scaleMax || 5) - (q.scaleMin || 1) + 1 },
                          (_, i) => i + (q.scaleMin || 1)
                        ).map((val) => {
                          const selected = answers[q.id] === val;
                          return (
                            <button
                              key={val}
                              onClick={() => setAnswer(q.id, val)}
                              className={`
                                relative py-3.5 rounded-xl text-center transition-all duration-200
                                ${selected
                                  ? "bg-brand-500 text-white shadow-md ring-2 ring-brand-500/20"
                                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60 hover:border-gray-300"
                                }
                              `}
                            >
                              <div className="text-[15px] font-semibold">{val}</div>
                              {q.scaleLabels?.[val - (q.scaleMin || 1)] && (
                                <div
                                  className={`text-[10px] mt-0.5 leading-tight px-1 ${
                                    selected ? "text-white/80" : "text-gray-400"
                                  }`}
                                >
                                  {q.scaleLabels[val - (q.scaleMin || 1)]}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {q.scaleLabels && q.scaleLabels.length >= 2 && (
                        <div className="flex justify-between mt-2 px-1">
                          <span className="text-[11px] text-gray-400">{q.scaleLabels[0]}</span>
                          <span className="text-[11px] text-gray-400">{q.scaleLabels[q.scaleLabels.length - 1]}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text Input */}
                  {q.type === "text" && (
                    <div className="pl-10">
                      <textarea
                        value={(answers[q.id] as string) || ""}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 resize-none"
                      />
                    </div>
                  )}

                  {/* Multiple Choice */}
                  {q.type === "multiple_choice" && q.options && (
                    <div className="pl-10 space-y-2">
                      {q.options.map((option) => {
                        const selected = answers[q.id] === option;
                        return (
                          <button
                            key={option}
                            onClick={() => setAnswer(q.id, option)}
                            className={`
                              w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl text-[14px] transition-all duration-200
                              ${selected
                                ? "bg-brand-500 text-white shadow-md ring-2 ring-brand-500/20"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60 hover:border-gray-300"
                              }
                            `}
                          >
                            <span
                              className={`
                                rounded-full border-2 flex items-center justify-center flex-shrink-0
                                ${selected ? "border-white/40 bg-white/20" : "border-gray-300"}
                              `}
                              style={{ width: 18, height: 18 }}
                            >
                              {selected && (
                                <span className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </span>
                            <span className="font-medium">{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {section.questions.length === 0 && (
              <p className="text-[13px] text-gray-400 italic text-center py-4">
                No questions in this section
              </p>
            )}
          </div>
        </Card>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between mt-6 pb-2">
          <Button
            variant="ghost"
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
          >
            <ChevronLeft size={16} strokeWidth={1.5} className="mr-1" />
            Previous
          </Button>

          <span className="text-caption-style tabular-nums hidden sm:inline">
            Section {currentSection + 1} of {sections.length}
          </span>

          {currentSection < sections.length - 1 ? (
            <Button onClick={() => setCurrentSection(currentSection + 1)}>
              Next
              <ChevronRight size={16} strokeWidth={1.5} className="ml-1" />
            </Button>
          ) : (
            <Button disabled>
              Submit
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
