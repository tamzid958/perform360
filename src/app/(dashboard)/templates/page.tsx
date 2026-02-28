"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
import { Plus, FileText, Globe, Building2, ChevronRight, AlertCircle, Inbox } from "lucide-react";
import Link from "next/link";

interface TemplateSection {
  title: string;
  questions: { text: string; type: string; required: boolean }[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  isGlobal: boolean;
  sections: TemplateSection[];
  createdAt: string;
}

function TemplateCardSkeleton() {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-44 mb-2" />
      <Skeleton className="h-4 w-64 mb-4" />
      <Skeleton className="h-3 w-48" />
    </Card>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/templates");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load templates");
      setTemplates(json.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load templates";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  if (error && templates.length === 0) {
    return (
      <div>
        <PageHeader title="Templates" description="Manage evaluation form templates">
          <Link href="/templates/new"><Button><Plus size={16} strokeWidth={2} className="mr-1.5" />New Template</Button></Link>
        </PageHeader>
        <Card className="max-w-lg mx-auto mt-12 text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle size={32} strokeWidth={1.5} className="text-red-400" />
            <p className="text-[14px] text-gray-600">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchTemplates}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Templates" description="Manage evaluation form templates">
        <Link href="/templates/new">
          <Button><Plus size={16} strokeWidth={2} className="mr-1.5" />New Template</Button>
        </Link>
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <TemplateCardSkeleton key={i} />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox size={32} strokeWidth={1.5} className="text-gray-300" />
          <p className="text-[14px] text-gray-500">No templates yet</p>
          <Link href="/templates/new">
            <Button variant="secondary" size="sm">Create Template</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const sections = Array.isArray(template.sections) ? template.sections : [];
            const questionCount = sections.reduce(
              (acc: number, s: TemplateSection) => acc + (Array.isArray(s.questions) ? s.questions.length : 0),
              0
            );
            return (
              <Link key={template.id} href={`/templates/${template.id}`}>
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-gray-50">
                      <FileText size={20} strokeWidth={1.5} className="text-gray-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      {template.isGlobal ? (
                        <Badge variant="info">
                          <Globe size={10} strokeWidth={2} className="mr-1" />
                          Global
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Building2 size={10} strokeWidth={2} className="mr-1" />
                          Company
                        </Badge>
                      )}
                      <ChevronRight size={16} strokeWidth={1.5} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </div>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description ?? "No description"}</CardDescription>
                  <div className="flex items-center gap-3 mt-4 text-[12px] text-gray-400">
                    <span>{sections.length} sections</span>
                    <span>&middot;</span>
                    <span>{questionCount} questions</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
