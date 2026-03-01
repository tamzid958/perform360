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
  CheckCircle2,
  UserPlus,
  FolderPlus,
  PlayCircle,
  Send,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Plus,
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

interface ActivityItem {
  id: string;
  type: "submission" | "cycle_status" | "team_created" | "user_invited" | "cycle_created";
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

const ACTIVITY_ICONS: Record<ActivityItem["type"], typeof CheckCircle2> = {
  submission: CheckCircle2,
  cycle_status: RefreshCcw,
  cycle_created: PlayCircle,
  team_created: FolderPlus,
  user_invited: UserPlus,
};

const ACTIVITY_COLORS: Record<ActivityItem["type"], string> = {
  submission: "text-green-500 bg-green-50",
  cycle_status: "text-blue-500 bg-blue-50",
  cycle_created: "text-indigo-500 bg-indigo-50",
  team_created: "text-purple-500 bg-purple-50",
  user_invited: "text-amber-500 bg-amber-50",
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof RefreshCcw;
  loading: boolean;
  accent: string;
}) {
  return (
    <Card padding="md" className="group hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : (
            <p className="text-[28px] font-bold text-gray-900 tracking-tight">{value}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${accent} transition-transform duration-300 group-hover:scale-105`}>
          <Icon size={20} strokeWidth={1.5} />
        </div>
      </div>
    </Card>
  );
}

function ActivityItemRow({ item }: { item: ActivityItem }) {
  const Icon = ACTIVITY_ICONS[item.type];
  const colorClass = ACTIVITY_COLORS[item.type];

  return (
    <div className="flex items-start gap-3 py-3 group">
      <div className={`p-1.5 rounded-lg ${colorClass} shrink-0 mt-0.5`}>
        <Icon size={14} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-gray-900 truncate">
          {item.title}
        </p>
        <p className="text-[12px] text-gray-500 truncate">{item.description}</p>
      </div>
      <span className="text-[11px] text-gray-400 shrink-0 pt-0.5">
        {formatRelativeTime(item.timestamp)}
      </span>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function CycleSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-36" />
      </CardHeader>
      <div className="space-y-4">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allCycles, setAllCycles] = useState<Cycle[]>([]);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setActivityLoading(true);
    setError(null);
    try {
      const [statsRes, cyclesRes, activityRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/cycles?status=ACTIVE"),
        fetch("/api/dashboard/activity"),
      ]);

      const statsJson = await statsRes.json();
      const cyclesJson = await cyclesRes.json();
      const activityJson = await activityRes.json();

      if (!statsJson.success) throw new Error(statsJson.error || "Failed to load stats");
      if (!cyclesJson.success) throw new Error(cyclesJson.error || "Failed to load cycles");

      setStats(statsJson.data);
      setAllCycles(cyclesJson.data as Cycle[]);
      setCycleIndex(0);

      if (activityJson.success) {
        setActivities(activityJson.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
      setActivityLoading(false);
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
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="p-3 rounded-full bg-red-50">
              <AlertCircle size={24} strokeWidth={1.5} className="text-red-400" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-gray-900">Something went wrong</p>
              <p className="text-[13px] text-gray-500 mt-1">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchData}>
              Try again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const activeCycle = allCycles.length > 0 ? allCycles[cycleIndex] : null;

  const daysLeft = activeCycle
    ? Math.max(0, Math.ceil((new Date(activeCycle.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  const completedCount = activeCycle
    ? activeCycle._count.assignments - (stats?.pendingReviews ?? 0)
    : 0;

  const statItems = [
    {
      label: "Active Cycles",
      value: stats?.activeCycles ?? 0,
      icon: RefreshCcw,
      accent: "bg-blue-50 text-blue-500",
    },
    {
      label: "Total Teams",
      value: stats?.totalTeams ?? 0,
      icon: Users,
      accent: "bg-purple-50 text-purple-500",
    },
    {
      label: "Pending Reviews",
      value: stats?.pendingReviews ?? 0,
      icon: ClipboardCheck,
      accent: "bg-amber-50 text-amber-500",
    },
    {
      label: "Completion",
      value: `${stats?.completionRate ?? 0}%`,
      icon: TrendingUp,
      accent: "bg-green-50 text-green-500",
    },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your organization's evaluation activity">
        <Link href="/cycles/new">
          <Button size="sm">
            <Plus size={16} strokeWidth={2} className="mr-1.5" />
            New Cycle
          </Button>
        </Link>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statItems.map((stat) => (
          <StatCard key={stat.label} {...stat} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Active Cycle — 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <CycleSkeleton />
          ) : activeCycle ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{activeCycle.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar size={13} strokeWidth={1.5} className="text-gray-400" />
                      Ends{" "}
                      {new Date(activeCycle.endDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {daysLeft <= 7 && daysLeft > 0 && (
                      <Badge variant="warning">{daysLeft}d left</Badge>
                    )}
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
              </CardHeader>

              <div className="space-y-5">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[13px] mb-2.5">
                    <span className="text-gray-500 font-medium">Overall Progress</span>
                    <span className="font-semibold text-gray-700">
                      {stats?.completionRate ?? 0}%
                    </span>
                  </div>
                  <Progress value={stats?.completionRate ?? 0} />
                </div>

                {/* Breakdown mini cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-gray-50/80 border border-gray-100/50">
                    <p className="text-[20px] sm:text-[24px] font-bold text-gray-900 tracking-tight">
                      {activeCycle._count.assignments}
                    </p>
                    <p className="text-[11px] sm:text-[12px] font-medium text-gray-500 mt-0.5">Total</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-green-50/60 border border-green-100/50">
                    <p className="text-[20px] sm:text-[24px] font-bold text-green-700 tracking-tight">
                      {completedCount}
                    </p>
                    <p className="text-[11px] sm:text-[12px] font-medium text-green-600 mt-0.5">Completed</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-amber-50/60 border border-amber-100/50">
                    <p className="text-[20px] sm:text-[24px] font-bold text-amber-700 tracking-tight">
                      {stats?.pendingReviews ?? 0}
                    </p>
                    <p className="text-[11px] sm:text-[12px] font-medium text-amber-600 mt-0.5">Pending</p>
                  </div>
                </div>

                {/* Actions row + cycle navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-1">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/cycles/${activeCycle.id}`}
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-500 hover:text-brand-600 transition-colors"
                    >
                      View cycle details <ChevronRight size={14} strokeWidth={2} />
                    </Link>
                    <span className="text-gray-200">|</span>
                    <Link
                      href="/cycles"
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      All cycles <ArrowRight size={13} strokeWidth={2} />
                    </Link>
                  </div>

                  {allCycles.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-400 mr-1">
                        {cycleIndex + 1}/{allCycles.length}
                      </span>
                      <button
                        onClick={() => setCycleIndex((i) => Math.max(0, i - 1))}
                        disabled={cycleIndex === 0}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <ChevronLeft size={16} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => setCycleIndex((i) => Math.min(allCycles.length - 1, i + 1))}
                        disabled={cycleIndex === allCycles.length - 1}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <ChevronRight size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="p-4 rounded-2xl bg-gray-50">
                  <Clock size={28} strokeWidth={1.5} className="text-gray-300" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-gray-700">
                    No active evaluation cycles
                  </p>
                  <p className="text-[13px] text-gray-400 mt-1">
                    Create a cycle to start collecting feedback
                  </p>
                </div>
                <Link href="/cycles/new">
                  <Button size="sm">
                    <Plus size={16} strokeWidth={2} className="mr-1.5" />
                    Create Cycle
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/teams/new" className="group">
              <Card padding="sm" className="flex items-center gap-3 hover:shadow-md transition-all duration-200">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-500">
                  <Users size={16} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900">New Team</p>
                  <p className="text-[11px] text-gray-400">Add a team</p>
                </div>
                <ChevronRight
                  size={14}
                  strokeWidth={1.5}
                  className="text-gray-300 group-hover:text-gray-500 transition-colors"
                />
              </Card>
            </Link>
            <Link href="/templates/new" className="group">
              <Card padding="sm" className="flex items-center gap-3 hover:shadow-md transition-all duration-200">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                  <ClipboardCheck size={16} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900">New Template</p>
                  <p className="text-[11px] text-gray-400">Build a form</p>
                </div>
                <ChevronRight
                  size={14}
                  strokeWidth={1.5}
                  className="text-gray-300 group-hover:text-gray-500 transition-colors"
                />
              </Card>
            </Link>
            <Link href="/people" className="group">
              <Card padding="sm" className="flex items-center gap-3 hover:shadow-md transition-all duration-200">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-500">
                  <Send size={16} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900">Invite People</p>
                  <p className="text-[11px] text-gray-400">Manage users</p>
                </div>
                <ChevronRight
                  size={14}
                  strokeWidth={1.5}
                  className="text-gray-300 group-hover:text-gray-500 transition-colors"
                />
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Activity — compact, scrollable */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            {activities.length > 0 && (
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                Live
              </span>
            )}
          </CardHeader>

          {activityLoading ? (
            <ActivitySkeleton />
          ) : activities.length > 0 ? (
            <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50 -mr-2 pr-2">
              {activities.map((item) => (
                <ActivityItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="p-3 rounded-full bg-gray-50">
                <Clock size={20} strokeWidth={1.5} className="text-gray-300" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-500">No activity yet</p>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Activity will appear as your team starts using the platform
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
