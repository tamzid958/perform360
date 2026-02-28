"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
import { Users, Plus, ChevronRight, AlertCircle, Inbox } from "lucide-react";
import Link from "next/link";

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
  const { addToast } = useToast();

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teams");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load teams");
      setTeams(json.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load teams";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <TeamCardSkeleton key={i} />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox size={32} strokeWidth={1.5} className="text-gray-300" />
          <p className="text-[14px] text-gray-500">No teams yet</p>
          <Link href="/teams/new">
            <Button variant="secondary" size="sm">Create Team</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const managerCount = team.members.filter((m) => m.role === "MANAGER").length;
            const reportCount = team.members.filter((m) => m.role === "DIRECT_REPORT").length;
            return (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-brand-50">
                        <Users size={20} strokeWidth={1.5} className="text-brand-500" />
                      </div>
                      <ChevronRight size={16} strokeWidth={1.5} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>{team.description ?? "No description"}</CardDescription>
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <Badge variant="default">{team._count.members} members</Badge>
                    <Badge variant="info">{managerCount} managers</Badge>
                    <Badge variant="outline">{reportCount} reports</Badge>
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
