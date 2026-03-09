"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import {
  Plus,
  Sparkles,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Settings,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { BlogSettingsDialog } from "./blog-settings-dialog";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  createdAt: string;
  primaryKeyword: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  const [error, setError] = useState("");
  const [generationPaused, setGenerationPaused] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/blog?${params}`);
      const json = await res.json();
      if (json.success) {
        setPosts(json.data);
        setPagination(json.pagination);
      } else {
        setError(json.error ?? "Failed to load posts");
      }
    } catch {
      setError("Network error — failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    async function fetchPauseState() {
      try {
        const res = await fetch("/api/admin/blog/settings");
        const json = await res.json();
        if (json.success) {
          setGenerationPaused(json.data.generationPaused ?? false);
        }
      } catch {
        // Settings not loaded — default to unpaused
      }
    }
    fetchPauseState();
  }, []);

  async function handleTogglePause() {
    setPauseLoading(true);
    const newValue = !generationPaused;
    try {
      const res = await fetch("/api/admin/blog/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationPaused: newValue }),
      });
      const json = await res.json();
      if (json.success) {
        setGenerationPaused(newValue);
      } else {
        alert(json.error ?? "Failed to update generation status");
      }
    } catch {
      alert("Network error");
    } finally {
      setPauseLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 3 }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`Generation job queued (Job ID: ${json.data.jobId}). ${json.data.count} articles will be generated shortly.`);
      } else {
        alert(json.error ?? "Failed to start generation");
      }
    } catch {
      alert("Network error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchPosts();
      } else {
        alert(json.error ?? "Failed to update status");
      }
    } catch {
      alert("Network error — failed to update status");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchPosts();
      } else {
        alert(json.error ?? "Failed to delete post");
      }
    } catch {
      alert("Network error — failed to delete post");
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-title-small sm:text-title text-gray-900">Blog</h1>
          <p className="text-callout sm:text-body text-gray-500 mt-1">
            Manage AI-generated blog posts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 sm:mr-2 sm:pr-2 sm:border-r border-gray-200">
            <Toggle
              checked={!generationPaused}
              onChange={handleTogglePause}
              disabled={pauseLoading}
            />
            <span className="text-[13px] text-gray-500 whitespace-nowrap">
              {generationPaused ? "Auto-generation paused" : "Auto-generation active"}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
            <Settings size={16} strokeWidth={1.5} className="mr-1.5" />
            Settings
          </Button>
          <Button variant="secondary" size="sm" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 size={16} className="mr-1.5 animate-spin" />
            ) : (
              <Sparkles size={16} strokeWidth={1.5} className="mr-1.5" />
            )}
            <span className="hidden sm:inline">Generate Articles</span>
            <span className="sm:hidden">Generate</span>
          </Button>
          <Button size="sm" asChild>
            <Link href="/superadmin/blog/new">
              <Plus size={16} strokeWidth={2} className="mr-1.5" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {["", "PUBLISHED", "DRAFT"].map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              statusFilter === status
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {status === "" ? "All" : status === "PUBLISHED" ? "Published" : "Drafts"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Title
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="hidden md:table-cell text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Keyword
                </th>
                <th className="hidden sm:table-cell text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Date
                </th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[16rem]" />
                      <Skeleton className="h-3 w-2/3 max-w-[10rem] mt-1" />
                    </td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="hidden md:table-cell px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="hidden sm:table-cell px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-6" /></td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[14px] text-gray-400">
                    No blog posts yet. Click &quot;Generate Articles&quot; to create AI-generated content.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/superadmin/blog/${post.id}`}
                        className="group"
                      >
                        <p className="text-[14px] font-medium text-gray-900 group-hover:text-brand-500 transition-colors line-clamp-1">
                          {post.title}
                        </p>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          /blog/{post.slug}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={post.status === "PUBLISHED" ? "success" : "default"}>
                        {post.status === "PUBLISHED" ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-[13px] text-gray-500">
                      {post.primaryKeyword || "—"}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-[13px] text-gray-500">
                      {formatDate(post.publishedAt ?? post.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <MoreHorizontal size={16} strokeWidth={1.5} className="text-gray-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/superadmin/blog/${post.id}`}>
                              <Pencil size={14} strokeWidth={1.5} className="mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {post.status === "PUBLISHED" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/blog/${post.slug}`} target="_blank">
                                <ExternalLink size={14} strokeWidth={1.5} className="mr-2" />
                                View Live
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(post.id, post.status)}
                          >
                            {post.status === "PUBLISHED" ? (
                              <>
                                <EyeOff size={14} strokeWidth={1.5} className="mr-2" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye size={14} strokeWidth={1.5} className="mr-2" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 size={14} strokeWidth={1.5} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-gray-100">
            <p className="text-[13px] text-gray-400">
              Showing {posts.length} of {pagination.total} posts
            </p>
            <div className="flex items-center gap-2">
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
          </div>
        )}
      </Card>

      <BlogSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
