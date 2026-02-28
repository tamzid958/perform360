"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Building2,
  Users,
  ExternalLink,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
  encryptionConfigured: boolean;
  keyVersion: number;
  userCount: number;
  teamCount: number;
  cycleCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/companies?${params}`);
      const json = await res.json();
      if (json.success) {
        setCompanies(json.data);
        setPagination(json.pagination);
      }
    } catch {
      // Network error — leave existing data
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchCompanies, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchCompanies, searchQuery]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const slug = form.get("slug") as string;

    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined }),
      });
      const json = await res.json();
      if (!json.success) {
        setCreateError(json.error ?? "Failed to create company");
        return;
      }
      setShowCreateDialog(false);
      setPage(1);
      fetchCompanies();
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this company? This cannot be undone.")) return;

    const res = await fetch(`/api/admin/companies/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) {
      alert(json.error ?? "Failed to delete company");
      return;
    }
    fetchCompanies();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-title text-gray-900">Companies</h1>
          <p className="text-body text-gray-500 mt-1">
            Manage tenant organizations
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus size={16} strokeWidth={2} className="mr-1.5" />
          Add Company
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search
          size={16}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all"
        />
      </div>

      {/* Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Company
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Users
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Teams
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Cycles
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Encryption
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Created
                </th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-xl" />
                        <div>
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20 mt-1" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-6" /></td>
                  </tr>
                ))
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[14px] text-gray-400">
                    {searchQuery ? "No companies match your search" : "No companies registered yet"}
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/superadmin/companies/${company.id}`} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Building2
                            size={16}
                            strokeWidth={1.5}
                            className="text-gray-400"
                          />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-gray-900 group-hover:text-[#0071e3] transition-colors">
                            {company.name}
                          </p>
                          <p className="text-[12px] text-gray-500">
                            {company.slug}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[14px] text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users
                          size={14}
                          strokeWidth={1.5}
                          className="text-gray-400"
                        />
                        {company.userCount}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[14px] text-gray-600">
                      {company.teamCount}
                    </td>
                    <td className="px-4 py-3 text-[14px] text-gray-600">
                      {company.cycleCount}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={company.encryptionConfigured ? "success" : "warning"}>
                        {company.encryptionConfigured ? "Configured" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500">
                      {formatDate(company.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <MoreHorizontal
                              size={16}
                              strokeWidth={1.5}
                              className="text-gray-400"
                            />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/superadmin/companies/${company.id}`}>
                              <BarChart3
                                size={14}
                                strokeWidth={1.5}
                                className="mr-2"
                              />
                              View Analytics
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              const res = await fetch(`/api/admin/impersonate/${company.id}`, {
                                method: "POST",
                              });
                              const json = await res.json();
                              if (json.success) {
                                window.location.href = "/";
                              } else {
                                alert(json.error ?? "Failed to impersonate");
                              }
                            }}
                          >
                            <ExternalLink
                              size={14}
                              strokeWidth={1.5}
                              className="mr-2"
                            />
                            Impersonate Admin
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(company.id)}
                          >
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-[13px] text-gray-400">
              Showing {companies.length} of {pagination.total} companies
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Company</DialogTitle>
            <DialogDescription>
              Manually onboard a new tenant organization
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4 mt-4" onSubmit={handleCreate}>
            <Input
              id="company-name"
              name="name"
              label="Company Name"
              placeholder="Acme Corp"
              required
            />
            <Input
              id="company-slug"
              name="slug"
              label="URL Slug"
              placeholder="acme-corp (auto-generated if empty)"
            />
            {createError && (
              <p className="text-[13px] text-red-600">{createError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 size={16} className="mr-1.5 animate-spin" />}
                Create Company
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
