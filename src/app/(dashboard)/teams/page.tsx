"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, AlertCircle, Inbox, Search, MoreHorizontal, Eye, Trash2, ArrowDown, ArrowUp, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PaginationMeta } from "@/types/pagination";

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  user: { id: string; name: string; email: string; avatar: string | null; role: string };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  members: TeamMember[];
  _count: { members: number };
}

function TeamCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </CardHeader>
      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-4 w-48 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </Card>
  );
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const { addToast } = useToast();
  const router = useRouter();

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const res = await fetch(`/api/teams?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load teams");
      setTeams(json.data);
      setPagination(json.pagination);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load teams";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, page, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchTeams, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchTeams, searchQuery]);

  const handleDelete = async (team: Team) => {
    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete team");
      addToast(`"${team.name}" deleted`, "success");
      setPage(1);
      fetchTeams();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete team", "error");
    }
  };

  if (error && teams.length === 0) {
    return (
      <div>
        <PageHeader title="Teams" description="Manage your organization's team structure">
          <Link href="/teams/new"><Button><Plus size={16} strokeWidth={2} className="mr-1.5" />New Team</Button></Link>
        </PageHeader>
        <Card className="max-w-lg mx-auto mt-12 text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle size={32} strokeWidth={1.5} className="text-red-400" />
            <p className="text-[14px] text-gray-600">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchTeams}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Teams" description="Manage your organization's team structure">
        <Link href="/teams/new">
          <Button><Plus size={16} strokeWidth={2} className="mr-1.5" />New Team</Button>
        </Link>
      </PageHeader>

      <div className="flex items-center justify-between gap-4 mb-4">
        <div />
        <div className="relative max-w-xs">
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-white border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <TeamCardSkeleton key={i} />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox size={32} strokeWidth={1.5} className="text-gray-300" />
          <p className="text-[14px] text-gray-500">
            {searchQuery ? "No teams match your search" : "No teams yet"}
          </p>
          {!searchQuery && (
            <Link href="/teams/new">
              <Button variant="secondary" size="sm">Create Team</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => {
              const managerCount = team.members.filter((m) => m.role === "MANAGER").length;
              const memberCount = team.members.filter((m) => m.role === "MEMBER").length;
              const hasDownward = managerCount > 0 && memberCount > 0;
              const hasUpward = managerCount > 0 && memberCount > 0;
              const hasLateral = memberCount >= 2;
              return (
                <Card key={team.id} className="h-full flex flex-col hover:shadow-md transition-all duration-200 group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-brand-50">
                        <Users size={20} strokeWidth={1.5} className="text-brand-500" />
                      </div>
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
                          <DropdownMenuItem onClick={() => router.push(`/teams/${team.id}`)}>
                            <Eye size={14} strokeWidth={1.5} className="mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(team)}
                          >
                            <Trash2 size={14} strokeWidth={1.5} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <Link href={`/teams/${team.id}`} className="flex-1 flex flex-col">
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{team.description ?? "No description"}</CardDescription>
                    <div className="flex items-center gap-1.5 mt-auto pt-4 flex-wrap">
                      <Badge variant="default">{team._count.members} members</Badge>
                      {hasDownward && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                          <ArrowDown size={11} strokeWidth={2} />
                          {managerCount * memberCount}
                        </span>
                      )}
                      {hasUpward && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-600 bg-violet-50 rounded-full px-2 py-0.5">
                          <ArrowUp size={11} strokeWidth={2} />
                          {memberCount * managerCount}
                        </span>
                      )}
                      {hasLateral && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                          <ArrowLeftRight size={11} strokeWidth={2} />
                          {memberCount * (memberCount - 1)}
                        </span>
                      )}
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
              showing={teams.length}
              noun="teams"
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
