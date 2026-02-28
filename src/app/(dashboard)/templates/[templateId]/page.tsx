"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Edit, Copy, Globe, Building2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Question {
  id?: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface Section {
  title: string;
  description?: string;
  questions: Question[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  isGlobal: boolean;
  sections: Section[];
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  rating_scale: "Rating Scale",
  text: "Text Response",
  multiple_choice: "Multiple Choice",
  yes_no: "Yes / No",
  competency_matrix: "Competency Matrix",
};

export default function TemplateDetailPage() {
  const params = useParams<{ templateId: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/templates/${params.templateId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load template");
      setTemplate(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load template");
    } finally {
      setLoading(false);
    }
  }, [params.templateId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  if (error) {
    return (
      <div>
        <PageHeader title="Template" description="" />
        <Card className="max-w-lg mx-auto mt-12 text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle size={32} strokeWidth={1.5} className="text-red-400" />
            <p className="text-[14px] text-gray-600">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchTemplate}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading || !template) {
    return (
      <div>
        <PageHeader title="" description="">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </PageHeader>
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-4 max-w-4xl">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => <Skeleton key={j} className="h-14 rounded-xl" />)}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const sections: Section[] = Array.isArray(template.sections) ? template.sections : [];
  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);

  return (
    <div>
      <PageHeader title={template.name} description={template.description ?? ""}>
        <Button variant="ghost" size="sm">
          <Copy size={16} strokeWidth={1.5} className="mr-1.5" />
          Duplicate
        </Button>
        {!template.isGlobal && (
          <Link href={`/templates/${template.id}/edit`}>
            <Button variant="secondary">
              <Edit size={16} strokeWidth={1.5} className="mr-1.5" />
              Edit
            </Button>
          </Link>
        )}
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
          &middot; {sections.length} sections &middot; {totalQuestions} questions
        </span>
      </div>

      {/* Sections */}
      <div className="space-y-4 max-w-4xl">
        {sections.map((section, sIndex) => (
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
                        <Badge variant="outline">{typeLabels[q.type] ?? q.type}</Badge>
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
