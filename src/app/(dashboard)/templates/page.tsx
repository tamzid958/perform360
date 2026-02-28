"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FileText,
  Globe,
  Building2,
  AlertCircle,
  Inbox,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PaginationMeta } from "@/types/pagination";

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

const SCOPE_MAP: Record<string, string | undefined> = {
  all: undefined,
  global: "global",
  company: "company",
};

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
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const { addToast } = useToast();
  const router = useRouter();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const scope = SCOPE_MAP[activeTab];
      if (scope) params.set("scope", scope);
      const res = await fetch(`/api/templates?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load templates");
      setTemplates(json.data);
      setPagination(json.pagination);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load templates";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, page, activeTab, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchTemplates, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchTemplates, searchQuery]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleDelete = async (template: Template) => {
    if (template.isGlobal) {
      addToast("Global templates cannot be deleted here", "error");
      return;
    }
    try {
      const res = await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete template");
      addToast(`"${template.name}" deleted`, "success");
      setPage(1);
      fetchTemplates();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete template", "error");
    }
  };

  if (error && templates.length === 0) {
    return (
      <div>
        <PageHeader title="Templates" description="Manage evaluation form templates">
          <Link href="/templates/new">
            <Button><Plus size={16} strokeWidth={2} className="mr-1.5" />New Template</Button>
          </Link>
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

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
          </TabsList>
          <div className="relative max-w-xs">
            <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-white border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <TemplateCardSkeleton key={i} />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox size={32} strokeWidth={1.5} className="text-gray-300" />
          <p className="text-[14px] text-gray-500">
            {searchQuery || activeTab !== "all"
              ? "No templates found"
              : "No templates yet"}
          </p>
          {!searchQuery && activeTab === "all" && (
            <Link href="/templates/new">
              <Button variant="secondary" size="sm">Create Template</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => {
              const sections = Array.isArray(template.sections) ? template.sections : [];
              const questionCount = sections.reduce(
                (acc: number, s: TemplateSection) => acc + (Array.isArray(s.questions) ? s.questions.length : 0),
                0
              );
              return (
                <Card key={template.id} className="hover:shadow-md transition-all duration-200 group h-full flex flex-col">
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal size={16} strokeWidth={1.5} className="text-gray-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/templates/${template.id}`)}>
                            <Eye size={14} strokeWidth={1.5} className="mr-2" />
                            View
                          </DropdownMenuItem>
                          {!template.isGlobal && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(template)}
                              >
                                <Trash2 size={14} strokeWidth={1.5} className="mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <Link href={`/templates/${template.id}`} className="flex-1 flex flex-col">
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.description ?? "No description"}</CardDescription>
                    <div className="flex items-center gap-3 mt-auto pt-4 text-[12px] text-gray-400">
                      <span>{sections.length} sections</span>
                      <span>&middot;</span>
                      <span>{questionCount} questions</span>
                    </div>
                  </Link>
                </Card>
              );
            })}
          </div>
          {pagination && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              showing={templates.length}
              noun="templates"
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
