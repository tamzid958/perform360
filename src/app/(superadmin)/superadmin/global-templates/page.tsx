"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, Globe, MoreHorizontal, Loader2, Trash2, Pencil, BarChart3 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface Section {
  title: string;
  description?: string;
  questions: { text: string; type: string; required: boolean }[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  sections: Section[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function countQuestions(sections: Section[]): number {
  return sections.reduce((acc, s) => acc + (s.questions?.length ?? 0), 0);
}

export default function GlobalTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      const res = await fetch(`/api/admin/templates?${params}`);
      const json = await res.json();
      if (json.success) {
        setTemplates(json.data);
        setPagination(json.pagination);
      }
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const description = form.get("description") as string;

    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          sections: [
            {
              title: "General",
              questions: [
                { text: "Overall performance rating", type: "rating_scale", required: true },
              ],
            },
          ],
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setCreateError(json.error ?? "Failed to create template");
        return;
      }
      setShowCreateDialog(false);
      setPage(1);
      fetchTemplates();
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this global template? This cannot be undone.")) return;

    const res = await fetch(`/api/admin/templates/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) {
      alert(json.error ?? "Failed to delete template");
      return;
    }
    fetchTemplates();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-title text-gray-900">Global Templates</h1>
          <p className="text-body text-gray-500 mt-1">
            Templates available to all tenant companies
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus size={16} strokeWidth={2} className="mr-1.5" />
          New Global Template
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="w-11 h-11 rounded-xl mb-3" />
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-3 mt-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Globe size={32} strokeWidth={1.5} className="text-gray-300 mx-auto mb-3" />
            <p className="text-[15px] text-gray-500">No global templates yet</p>
            <p className="text-[13px] text-gray-400 mt-1">
              Create one to make it available to all companies
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => {
              const sections = Array.isArray(template.sections)
                ? (template.sections as Section[])
                : [];
              return (
                <Card
                  key={template.id}
                  className="group relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Link href={`/superadmin/global-templates/${template.id}`} className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                      <Globe
                        size={20}
                        strokeWidth={1.5}
                        className="text-brand-500"
                      />
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
                          <MoreHorizontal
                            size={16}
                            strokeWidth={1.5}
                            className="text-gray-400"
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/superadmin/global-templates/${template.id}`}>
                            <BarChart3 size={14} strokeWidth={1.5} className="mr-2" />
                            View Analytics
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil size={14} strokeWidth={1.5} className="mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 size={14} strokeWidth={1.5} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Link href={`/superadmin/global-templates/${template.id}`} className="block">
                    <CardTitle className="hover:text-brand-500 transition-colors">{template.name}</CardTitle>
                  </Link>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                  <div className="flex items-center gap-3 mt-4 text-[12px] text-gray-400">
                    <span>{sections.length} sections</span>
                    <span>&middot;</span>
                    <span>{countQuestions(sections)} questions</span>
                    <span>&middot;</span>
                    <span>Created {formatDate(template.createdAt)}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-[13px] text-gray-500">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Global Template</DialogTitle>
            <DialogDescription>
              Create a template available to all companies. You can customize sections and questions after creation.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4 mt-4" onSubmit={handleCreate}>
            <Input
              id="template-name"
              name="name"
              label="Template Name"
              placeholder="Standard 360° Review"
              required
            />
            <Input
              id="template-description"
              name="description"
              label="Description"
              placeholder="Brief description of this template"
            />
            {createError && (
              <p className="text-[13px] text-red-600">{createError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 size={16} className="mr-1.5 animate-spin" />}
                Create Template
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
