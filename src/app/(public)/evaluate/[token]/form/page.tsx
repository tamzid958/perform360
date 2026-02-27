"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronLeft, ChevronRight, Send } from "lucide-react";

// Demo data - in production, fetched from API
const evaluationData = {
  subjectName: "Alex Kim",
  cycleName: "Q1 2026 Performance Review",
  relationship: "Peer",
  template: {
    sections: [
      {
        title: "Communication Skills",
        description: "Evaluate the individual's communication effectiveness",
        questions: [
          { id: "q1", text: "How effectively does this person communicate with team members?", type: "rating_scale" as const, required: true, scaleMin: 1, scaleMax: 5, scaleLabels: ["Poor", "Below Average", "Average", "Good", "Excellent"] },
          { id: "q2", text: "Does this person actively listen to feedback?", type: "rating_scale" as const, required: true, scaleMin: 1, scaleMax: 5, scaleLabels: ["Never", "Rarely", "Sometimes", "Often", "Always"] },
          { id: "q3", text: "Please provide examples of effective communication you've observed.", type: "text" as const, required: false },
        ],
      },
      {
        title: "Leadership & Initiative",
        description: "Assess leadership qualities and initiative-taking",
        questions: [
          { id: "q4", text: "How well does this person take initiative on projects?", type: "rating_scale" as const, required: true, scaleMin: 1, scaleMax: 5, scaleLabels: ["Poor", "Below Average", "Average", "Good", "Excellent"] },
          { id: "q5", text: "Does this person mentor or support team members?", type: "yes_no" as const, required: true },
          { id: "q6", text: "What leadership qualities stand out?", type: "text" as const, required: false },
        ],
      },
      {
        title: "Overall Assessment",
        description: "Provide your overall evaluation",
        questions: [
          { id: "q7", text: "Overall performance rating", type: "rating_scale" as const, required: true, scaleMin: 1, scaleMax: 5, scaleLabels: ["Needs Improvement", "Below Expectations", "Meets Expectations", "Exceeds Expectations", "Exceptional"] },
          { id: "q8", text: "What are this person's greatest strengths?", type: "text" as const, required: true },
          { id: "q9", text: "What areas could this person improve in?", type: "text" as const, required: true },
          { id: "q10", text: "Any additional comments?", type: "text" as const, required: false },
        ],
      },
    ],
  },
};

export default function EvaluationFormPage({ params }: { params: { token: string } }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const sections = evaluationData.template.sections;
  const section = sections[currentSection];
  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const progressPercent = Math.round((answeredQuestions / totalQuestions) * 100);

  function setAnswer(questionId: string, value: string | number | boolean) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/evaluate/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        setIsSubmitted(true);
      }
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
              Your evaluation for {evaluationData.subjectName} has been submitted successfully.
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
            <p className="text-headline text-gray-900">Evaluating: {evaluationData.subjectName}</p>
            <p className="text-[12px] text-gray-500">{evaluationData.cycleName} · {evaluationData.relationship}</p>
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
              </div>
            ))}
          </div>
        </Card>

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
