"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import {
  RefreshCcw,
  Users,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  activeCycles: number;
  totalTeams: number;
  pendingReviews: number;
  completionRate: number;
}

interface Cycle {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  templateId: string;
  _count: { assignments: number };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, cyclesRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/cycles?status=ACTIVE"),
      ]);

      const statsJson = await statsRes.json();
      const cyclesJson = await cyclesRes.json();

      if (!statsJson.success) throw new Error(statsJson.error || "Failed to load stats");
      if (!cyclesJson.success) throw new Error(cyclesJson.error || "Failed to load cycles");

      setStats(statsJson.data);
      const activeCycles = cyclesJson.data as Cycle[];
      setActiveCycle(activeCycles.length > 0 ? activeCycles[0] : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Overview of your organization's evaluation activity" />
        <Card className="max-w-lg mx-auto mt-12 text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle size={32} strokeWidth={1.5} className="text-red-400" />
            <p className="text-[14px] text-gray-600">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchData}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  const statItems = [
    { label: "Active Cycles", value: stats?.activeCycles ?? 0, icon: RefreshCcw },
    { label: "Total Teams", value: stats?.totalTeams ?? 0, icon: Users },
    { label: "Pending Reviews", value: stats?.pendingReviews ?? 0, icon: ClipboardCheck },
    { label: "Completion Rate", value: `${stats?.completionRate ?? 0}%`, icon: TrendingUp },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your organization's evaluation activity"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statItems.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-callout text-gray-500">{stat.label}</p>
                  {loading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-title-small text-gray-900 mt-1">{stat.value}</p>
                  )}
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50">
                  <Icon size={20} strokeWidth={1.5} className="text-gray-400" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Cycle */}
        <div className="lg:col-span-2">
          {loading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <div className="space-y-4">
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="grid grid-cols-3 gap-4 pt-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              </div>
            </Card>
          ) : activeCycle ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{activeCycle.name}</CardTitle>
                    <CardDescription>
                      Active cycle ending{" "}
                      {new Date(activeCycle.endDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardHeader>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[13px] mb-2">
                    <span className="text-gray-500">Overall Progress</span>
                    <span className="font-medium text-gray-700">{stats?.completionRate ?? 0}%</span>
                  </div>
                  <Progress value={stats?.completionRate ?? 0} />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center p-3 rounded-xl bg-gray-50">
                    <p className="text-title-small text-gray-900">
                      {activeCycle._count.assignments}
                    </p>
                    <p className="text-[12px] text-gray-500">Total</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-green-50">
                    <p className="text-title-small text-green-700">
                      {(activeCycle._count.assignments) - (stats?.pendingReviews ?? 0)}
                    </p>
                    <p className="text-[12px] text-green-600">Completed</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-amber-50">
                    <p className="text-title-small text-amber-700">{stats?.pendingReviews ?? 0}</p>
                    <p className="text-[12px] text-amber-600">Pending</p>
                  </div>
                </div>
                <Link
                  href="/cycles"
                  className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-500 hover:text-brand-600 transition-colors mt-2"
                >
                  View all cycles <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Clock size={32} strokeWidth={1.5} className="text-gray-300" />
                <p className="text-[14px] text-gray-500">No active evaluation cycles</p>
                <Link href="/cycles/new">
                  <Button variant="secondary" size="sm">Create Cycle</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Clock size={24} strokeWidth={1.5} className="text-gray-300" />
            <p className="text-[13px] text-gray-400">Activity feed coming soon</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
