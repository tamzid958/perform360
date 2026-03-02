"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronLeft, ChevronRight, Send, Loader2, AlertCircle, Check, Shield } from "lucide-react";

interface TemplateQuestion {
  id: string;
  text: string;
  type: "rating_scale" | "text" | "multiple_choice";
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
}

interface TemplateSection {
  title: string;
  description?: string;
  questions: TemplateQuestion[];
}

interface FormData {
  subjectName: string;
  cycleName: string;
  relationship: string;
  sections: TemplateSection[];
}

export default function EvaluationFormPage({ params: paramsPromise }: { params: Promise<{ token: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (Object.keys(answers).length > 0 && !isSubmitted) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [answers, isSubmitted]);

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/evaluate/${params.token}/form`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          if (data.code === "NO_SESSION" || data.code === "SESSION_EXPIRED") {
            router.replace(`/evaluate/${params.token}`);
            return;
          }
          setLoadError(data.error || "Failed to load evaluation form");
          return;
        }
        setFormData(data.data);
      } catch {
        setLoadError("Failed to load evaluation form");
      } finally {
        setIsLoadingForm(false);
      }
    }
    loadForm();
  }, [params.token, router]);

  if (isLoadingForm) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
            <Loader2 size={22} className="text-brand-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-headline text-gray-900">Loading evaluation</p>
            <p className="text-callout text-gray-500 mt-1">Preparing your form...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={28} strokeWidth={1.5} className="text-red-500" />
            </div>
            <h1 className="text-title text-gray-900">Unable to Load Form</h1>
            <p className="text-body text-gray-500 mt-2">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) return null;

  const { sections, subjectName, cycleName, relationship } = formData;
  const section = sections[currentSection];
  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const progressPercent = Math.round((answeredQuestions / totalQuestions) * 100);

  function getSectionAnsweredCount(sectionIndex: number) {
    const s = sections[sectionIndex];
    return s.questions.filter((q) => answers[q.id] !== undefined).length;
  }

  function isSectionComplete(sectionIndex: number) {
    const s = sections[sectionIndex];
    return s.questions.every((q) => answers[q.id] !== undefined);
  }

  function setAnswer(questionId: string, value: string | number | boolean) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/evaluate/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSubmitted(true);
      } else {
        setSubmitError(data.error || "Failed to submit evaluation");
      }
    } catch {
      setSubmitError("Failed to submit evaluation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
        <div className="w-full max-w-[480px] animate-fade-in-up">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} strokeWidth={1.5} className="text-green-500" />
            </div>
            <div>
              <h1 className="text-title text-gray-900">Thank You!</h1>
              <p className="text-body text-gray-500 mt-2">
                Your evaluation for <span className="font-medium text-gray-700">{subjectName}</span> has been submitted successfully.
              </p>
            </div>
          </div>
          <Card padding="md" className="mt-8">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield size={18} strokeWidth={1.5} className="text-brand-500" />
              </div>
              <div>
                <p className="text-callout font-medium text-gray-700">End-to-end encrypted</p>
                <p className="text-caption-style mt-0.5">
                  Your responses are encrypted and securely stored. Only authorized administrators can view the results.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestionOffset = sections
    .slice(0, currentSection)
    .reduce((acc, s) => acc + s.questions.length, 0);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <div className="min-w-0">
              <p className="text-headline text-gray-900 truncate">
                Evaluating {subjectName}
              </p>
              <p className="text-caption-style truncate">
                {cycleName} &middot; {relationship}
              </p>
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
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
            {sections.map((s, i) => {
              const complete = isSectionComplete(i);
              const active = i === currentSection;
              const answered = getSectionAnsweredCount(i);
              const total = s.questions.length;

              return (
                <button
                  key={i}
                  onClick={() => setCurrentSection(i)}
                  className={`
                    flex items-center gap-2 flex-shrink-0 pl-2 pr-3.5 py-2 rounded-full text-[13px] font-medium
                    transition-all duration-200
                    ${active
                      ? "bg-brand-500 text-white shadow-sm"
                      : complete
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200/60"
                    }
                  `}
                >
                  <span
                    className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0
                      ${active
                        ? "bg-white/20 text-white"
                        : complete
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-400"
                      }
                    `}
                  >
                    {complete && !active ? <Check size={11} strokeWidth={2.5} /> : i + 1}
                  </span>
                  <span className="truncate max-w-[120px]">{s.title}</span>
                  {!active && !complete && answered > 0 && (
                    <span className="text-[11px] opacity-60">{answered}/{total}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Section Card */}
        <Card padding="lg" className="animate-fade-in-up">
          <CardHeader className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-title-small">{section.title}</CardTitle>
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
                <div key={q.id} className="relative">
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
                      {q.text}
                      {q.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                  </div>

                  {/* Rating Scale */}
                  {q.type === "rating_scale" && (
                    <div className="pl-10">
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${(q.scaleMax || 5) - (q.scaleMin || 1) + 1}, minmax(0, 1fr))` }}>
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
                                w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                ${selected
                                  ? "border-white/40 bg-white/20"
                                  : "border-gray-300"
                                }
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
          </div>
        </Card>

        {/* Submit Error */}
        {submitError && (
          <div className="mt-4 flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={16} strokeWidth={1.5} className="text-red-500 flex-shrink-0" />
            <p className="text-[13px] text-red-600">{submitError}</p>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="flex items-center justify-between mt-6 pb-8">
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
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 size={16} strokeWidth={1.5} className="mr-1.5 animate-spin" />
              ) : (
                <Send size={16} strokeWidth={1.5} className="mr-1.5" />
              )}
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
