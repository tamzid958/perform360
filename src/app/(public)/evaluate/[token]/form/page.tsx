"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronLeft, ChevronRight, Send, Loader2, AlertCircle } from "lucide-react";

interface TemplateQuestion {
  id: string;
  text: string;
  type: "rating_scale" | "text" | "multiple_choice" | "yes_no" | "competency_matrix";
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

export default function EvaluationFormPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Warn on page leave if answers exist
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (Object.keys(answers).length > 0 && !isSubmitted) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [answers, isSubmitted]);

  // Load form data from API
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
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-brand-500 animate-spin" />
          <p className="text-[14px] text-gray-500">Loading evaluation form...</p>
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
        <div className="w-full max-w-[480px] text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} strokeWidth={1.5} className="text-green-500" />
          </div>
          <div>
            <h1 className="text-title text-gray-900">Thank You!</h1>
            <p className="text-body text-gray-500 mt-2">
              Your evaluation for {subjectName} has been submitted successfully.
            </p>
          </div>
          <Card padding="md">
            <p className="text-callout text-gray-600">
              Your responses have been encrypted and securely stored. Only authorized administrators at your organization can view the results.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-headline text-gray-900">Evaluating: {subjectName}</p>
            <p className="text-[12px] text-gray-500">{cycleName} &middot; {relationship}</p>
          </div>
          <Badge variant="outline">{progressPercent}% complete</Badge>
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-2">
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      </header>

      {/* Form Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Section Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {sections.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrentSection(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                i === currentSection
                  ? "bg-brand-500 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-100"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Current Section */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            {section.description && <CardDescription>{section.description}</CardDescription>}
          </CardHeader>

          <div className="space-y-8">
            {section.questions.map((q) => (
              <div key={q.id} className="space-y-3">
                <label className="block text-[15px] font-medium text-gray-800">
                  {q.text}
                  {q.required && <span className="text-red-400 ml-1">*</span>}
                </label>

                {q.type === "rating_scale" && (
                  <div className="flex gap-2">
                    {Array.from({ length: (q.scaleMax || 5) - (q.scaleMin || 1) + 1 }, (_, i) => i + (q.scaleMin || 1)).map((val) => (
                      <button
                        key={val}
                        onClick={() => setAnswer(q.id, val)}
                        className={`flex-1 py-3 rounded-xl text-[14px] font-medium transition-all ${
                          answers[q.id] === val
                            ? "bg-brand-500 text-white shadow-md"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <div>{val}</div>
                        {q.scaleLabels && (
                          <div className="text-[10px] mt-0.5 opacity-75">{q.scaleLabels[val - (q.scaleMin || 1)]}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "text" && (
                  <textarea
                    value={(answers[q.id] as string) || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Enter your response..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                  />
                )}

                {q.type === "yes_no" && (
                  <div className="flex gap-3">
                    {["Yes", "No"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setAnswer(q.id, option === "Yes")}
                        className={`flex-1 py-3 rounded-xl text-[14px] font-medium transition-all ${
                          answers[q.id] === (option === "Yes")
                            ? "bg-brand-500 text-white shadow-md"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "multiple_choice" && q.options && (
                  <div className="flex flex-col gap-2">
                    {q.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setAnswer(q.id, option)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-[14px] font-medium transition-all ${
                          answers[q.id] === option
                            ? "bg-brand-500 text-white shadow-md"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Submit Error */}
        {submitError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-[13px] text-red-600 text-center">{submitError}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
          >
            <ChevronLeft size={16} strokeWidth={1.5} className="mr-1" />
            Previous
          </Button>

          {currentSection < sections.length - 1 ? (
            <Button onClick={() => setCurrentSection(currentSection + 1)}>
              Next
              <ChevronRight size={16} strokeWidth={1.5} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Send size={16} strokeWidth={1.5} className="mr-1.5" />
              {isSubmitting ? "Submitting..." : "Submit Evaluation"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
