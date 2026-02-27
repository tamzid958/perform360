import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Edit, Copy, Globe, Building2 } from "lucide-react";

const template = {
  id: "1",
  name: "Standard 360° Review",
  description: "Comprehensive evaluation covering leadership, communication, and technical skills",
  isGlobal: true,
  createdAt: "2025-12-15",
  sections: [
    {
      title: "Communication Skills",
      questions: [
        { text: "How effectively does this person communicate with team members?", type: "rating_scale", required: true },
        { text: "Does this person actively listen to feedback?", type: "rating_scale", required: true },
        { text: "Please provide examples of effective communication you've observed.", type: "text", required: false },
      ],
    },
    {
      title: "Leadership & Initiative",
      questions: [
        { text: "How well does this person take initiative on projects?", type: "rating_scale", required: true },
        { text: "Does this person mentor or support team members?", type: "yes_no", required: true },
        { text: "Rate this person's decision-making ability.", type: "rating_scale", required: true },
        { text: "What leadership qualities stand out?", type: "text", required: false },
      ],
    },
    {
      title: "Technical Skills",
      questions: [
        { text: "How would you rate this person's technical expertise?", type: "rating_scale", required: true },
        { text: "Does this person stay current with industry trends?", type: "rating_scale", required: true },
        { text: "Select the areas where this person excels.", type: "multiple_choice", required: true },
      ],
    },
    {
      title: "Overall Assessment",
      questions: [
        { text: "Overall performance rating", type: "rating_scale", required: true },
        { text: "What are this person's greatest strengths?", type: "text", required: true },
        { text: "What areas could this person improve in?", type: "text", required: true },
        { text: "Any additional comments?", type: "text", required: false },
      ],
    },
  ],
};

const typeLabels: Record<string, string> = {
  rating_scale: "Rating Scale",
  text: "Text Response",
  multiple_choice: "Multiple Choice",
  yes_no: "Yes / No",
};

export default function TemplateDetailPage() {
  return (
    <div>
      <PageHeader title={template.name} description={template.description}>
        <Button variant="ghost" size="sm">
          <Copy size={16} strokeWidth={1.5} className="mr-1.5" />
          Duplicate
        </Button>
        <Button variant="secondary">
          <Edit size={16} strokeWidth={1.5} className="mr-1.5" />
          Edit
        </Button>
      </PageHeader>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-8">
        {template.isGlobal ? (
          <Badge variant="info">
            <Globe size={10} strokeWidth={2} className="mr-1" />
            Global Template
          </Badge>
        ) : (
          <Badge variant="outline">
            <Building2 size={10} strokeWidth={2} className="mr-1" />
            Company Template
          </Badge>
        )}
        <span className="text-[12px] text-gray-400">
          Created {new Date(template.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <span className="text-[12px] text-gray-400">
          · {template.sections.length} sections · {template.sections.reduce((acc, s) => acc + s.questions.length, 0)} questions
        </span>
      </div>

      {/* Sections */}
      <div className="space-y-4 max-w-4xl">
        {template.sections.map((section, sIndex) => (
          <Card key={sIndex}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-500 text-[13px] font-semibold">{sIndex + 1}</span>
                <CardTitle>{section.title}</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-2">
              {section.questions.map((q, qIndex) => (
                <div key={qIndex} className="flex items-start justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex gap-3">
                    <span className="text-[12px] text-gray-400 mt-0.5">{qIndex + 1}.</span>
                    <div>
                      <p className="text-[14px] text-gray-700">{q.text}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline">{typeLabels[q.type]}</Badge>
                        {q.required && <Badge variant="default">Required</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
