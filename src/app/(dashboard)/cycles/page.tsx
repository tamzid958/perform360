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
import { Plus, Calendar, AlertCircle, Inbox, Search, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PaginationMeta } from "@/types/pagination";

interface Cycle {
  id: string;
  name: string;
  status: string;
  templateId: string;
  startDate: string;
  endDate: string;
  _count: { assignments: number };
}

const statusBadge: Record<string, { variant: "success" | "warning" | "default" | "info"; label: string }> = {
  DRAFT: { variant: "default", label: "Draft" },
  ACTIVE: { variant: "success", label: "Active" },
  CLOSED: { variant: "warning", label: "Closed" },
  ARCHIVED: { variant: "info", label: "Archived" },
};

const STATUS_MAP: Record<string, string> = {
  active: "ACTIVE",
  draft: "DRAFT",
  closed: "CLOSED,ARCHIVED",
};

function CycleCardSkeleton() {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-48 mb-2" />
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-3 w-40" />
    </Card>
  );
}

export default function CyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const { addToast } = useToast();
  const router = useRouter();

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (activeTab !== "all") {
        params.set("status", STATUS_MAP[activeTab] ?? activeTab.toUpperCase());
      }
      const res = await fetch(`/api/cycles?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load cycles");
      setCycles(json.data);
      setPagination(json.pagination);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load cycles";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, page, activeTab, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchCycles, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchCycles, searchQuery]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleDelete = async (cycle: Cycle) => {
    if (cycle.status !== "DRAFT") {
      addToast("Only draft cycles can be deleted", "error");
      return;
    }
    try {
      const res = await fetch(`/api/cycles/${cycle.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete cycle");
      addToast(`"${cycle.name}" deleted`, "success");
      setPage(1);
      fetchCycles();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete cycle", "error");
    }
  };

  if (error && cycles.length === 0) {
    return (
      <div>
        <PageHeader title="Evaluation Cycles" description="Create and manage 360° evaluation cycles">
          <Link href="/cycles/new">
            <Button><Plus size={16} strokeWidth={2} className="mr-1.5" />New Cycle</Button>
          </Link>
        </PageHeader>
        <Card className="max-w-lg mx-auto mt-12 text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle size={32} strokeWidth={1.5} className="text-red-400" />
            <p className="text-[14px] text-gray-600">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchCycles}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Evaluation Cycles" description="Create and manage 360° evaluation cycles">
        <Link href="/cycles/new">
          <Button><Plus size={16} strokeWidth={2} className="mr-1.5" />New Cycle</Button>
        </Link>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
          <div className="relative max-w-xs">
            <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cycles..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-white border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CycleCardSkeleton key={i} />)}
        </div>
      ) : cycles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox size={32} strokeWidth={1.5} className="text-gray-300" />
          <p className="text-[14px] text-gray-500">
            {searchQuery || activeTab !== "all"
              ? "No cycles found"
              : "No cycles yet"}
          </p>
          {!searchQuery && activeTab === "all" && (
            <Link href="/cycles/new">
              <Button variant="secondary" size="sm">Create Cycle</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cycles.map((cycle) => {
              const badge = statusBadge[cycle.status] ?? { variant: "default" as const, label: cycle.status };
              return (
                <Card key={cycle.id} className="hover:shadow-md transition-all duration-200 group h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
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
                        <DropdownMenuItem onClick={() => router.push(`/cycles/${cycle.id}`)}>
                          <Eye size={14} strokeWidth={1.5} className="mr-2" />
                          View
                        </DropdownMenuItem>
                        {cycle.status === "DRAFT" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(cycle)}
                            >
                              <Trash2 size={14} strokeWidth={1.5} className="mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Link href={`/cycles/${cycle.id}`} className="flex-1 flex flex-col">
                    <CardTitle>{cycle.name}</CardTitle>
                    <CardDescription>{cycle._count.assignments} assignments</CardDescription>
                    <div className="flex items-center gap-2 text-[12px] text-gray-400 mt-auto pt-2">
                      <Calendar size={12} strokeWidth={1.5} />
                      <span>
                        {new Date(cycle.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                        {new Date(cycle.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
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
              showing={cycles.length}
              noun="cycles"
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
