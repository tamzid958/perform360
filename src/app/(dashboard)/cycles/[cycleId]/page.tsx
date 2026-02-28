"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScoreDistributionChart } from "@/components/reports/score-distribution-chart";
import {
  Play,
  Send,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { CycleReport } from "@/types/report";

// ─── Types ───

interface TeamTemplate {
  teamId: string;
  teamName: string;
  templateId: string;
  templateName: string;
}

interface CycleApiData {
  id: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";
  teamTemplates: TeamTemplate[];
  startDate: string;
  endDate: string;
  assignmentsWithNames: AssignmentWithNames[];
  stats: {
    totalAssignments: number;
    submittedAssignments: number;
    inProgressAssignments: number;
    pendingAssignments: number;
    completionRate: number;
  };
}

interface AssignmentWithNames {
  id: string;
  subjectId: string;
  reviewerId: string;
  subjectName: string;
  reviewerName: string;
  relationship: string;
  status: "SUBMITTED" | "IN_PROGRESS" | "PENDING";
}

// ─── Constants ───

const statusIcon: Record<string, React.ReactNode> = {
  SUBMITTED: (
    <CheckCircle2 size={14} strokeWidth={1.5} className="text-green-500" />
  ),
  IN_PROGRESS: (
    <Clock size={14} strokeWidth={1.5} className="text-amber-500" />
  ),
  PENDING: (
    <AlertCircle size={14} strokeWidth={1.5} className="text-gray-400" />
  ),
};

const statusLabel: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_PROGRESS: "In Progress",
  PENDING: "Pending",
};

const relationshipLabel: Record<string, string> = {
  manager: "Manager",
  direct_report: "Direct Report",
  peer: "Peer",
  self: "Self",
};

const statusBadgeVariant: Record<string, "success" | "warning" | "default" | "outline"> = {
  DRAFT: "outline",
  ACTIVE: "success",
  CLOSED: "warning",
  ARCHIVED: "default",
};

function ScoreBadge({ score }: { score: number }) {
  const variant =
    score >= 4.0 ? "success" : score >= 3.0 ? "warning" : "error";
  return <Badge variant={variant}>{score.toFixed(1)}</Badge>;
}

// ─── Page ───

export default function CycleDetailPage() {
  const { cycleId } = useParams<{ cycleId: string }>();
  const [cycle, setCycle] = useState<CycleApiData | null>(null);
  const [cycleReport, setCycleReport] = useState<CycleReport | null>(null);
  const [activeTab, setActiveTab] = useState<"assignments" | "reports">(
    "assignments"
  );
  const [assignmentFilter, setAssignmentFilter] = useState<
    "all" | "pending" | "completed"
  >("all");
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchCycle = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cycles/${cycleId}`);
      const json = await res.json();
      if (json.success) setCycle(json.data);
    } catch {
      // handled by null state
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  const fetchReport = useCallback(async () => {
    if (cycleReport) return;
    setReportLoading(true);
    try {
      const res = await fetch(`/api/reports/cycle/${cycleId}`);
      const json = await res.json();
      if (json.success) setCycleReport(json.data);
    } catch {
      // handled by null state
    } finally {
      setReportLoading(false);
    }
  }, [cycleId, cycleReport]);

  useEffect(() => {
    fetchCycle();
  }, [fetchCycle]);

  useEffect(() => {
    if (activeTab === "reports") fetchReport();
  }, [activeTab, fetchReport]);

  if (loading) return <CycleSkeleton />;
  if (!cycle) {
    return (
      <Card className="text-center py-12">
        <p className="text-body text-gray-500">Cycle not found</p>
      </Card>
    );
  }

  const assignments = cycle.assignmentsWithNames ?? [];
  const displayed = assignments.filter((a) => {
    if (assignmentFilter === "pending")
      return a.status === "PENDING" || a.status === "IN_PROGRESS";
    if (assignmentFilter === "completed") return a.status === "SUBMITTED";
    return true;
  });

  const avgScore =
    cycleReport?.individualSummaries && cycleReport.individualSummaries.length > 0
      ? cycleReport.individualSummaries.reduce(
          (sum, s) => sum + s.overallScore,
          0
        ) / cycleReport.individualSummaries.length
      : 0;

  function handleExport() {
    window.open(`/api/reports/cycle/${cycleId}/export`, "_blank");
  }

  return (
    <div>
      <PageHeader
        title={cycle.name}
        description={`${cycle.teamTemplates.length} team${cycle.teamTemplates.length !== 1 ? "s" : ""} \u00B7 ${new Date(cycle.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${new Date(cycle.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
      >
        {activeTab === "reports" && (
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} strokeWidth={1.5} className="mr-1.5" />
            Export PDF
          </Button>
        )}
        {cycle.status === "DRAFT" && (
          <Button>
            <Play size={16} strokeWidth={1.5} className="mr-1.5" />
            Activate
          </Button>
        )}
        {cycle.status === "ACTIVE" && (
          <Button variant="secondary">
            <Send size={16} strokeWidth={1.5} className="mr-1.5" />
            Send Reminders
          </Button>
        )}
      </PageHeader>

      {/* Status Badge */}
      <div className="mb-6">
        <Badge variant={statusBadgeVariant[cycle.status]}>
          {cycle.status.charAt(0) + cycle.status.slice(1).toLowerCase()}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card padding="md">
          <p className="text-callout text-gray-500">Total</p>
          <p className="text-title-small text-gray-900 mt-1">
            {cycle.stats.totalAssignments}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-callout text-green-600">Completed</p>
          <p className="text-title-small text-green-700 mt-1">
            {cycle.stats.submittedAssignments}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-callout text-amber-600">In Progress</p>
          <p className="text-title-small text-amber-700 mt-1">
            {cycle.stats.inProgressAssignments}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-callout text-gray-500">Pending</p>
          <p className="text-title-small text-gray-700 mt-1">
            {cycle.stats.pendingAssignments}
          </p>
        </Card>
      </div>

      {/* Progress */}
      <Card className="mb-8">
        <div className="flex justify-between text-[14px] mb-3">
          <span className="text-gray-500">Overall Completion</span>
          <span className="font-semibold text-gray-900">
            {cycle.stats.completionRate}%
          </span>
        </div>
        <Progress value={cycle.stats.completionRate} className="h-3" />
      </Card>

      {/* Team-Template Pairs */}
      {cycle.teamTemplates.length > 0 && (
        <Card padding="sm" className="mb-8">
          <CardHeader>
            <CardTitle>Teams &amp; Templates</CardTitle>
          </CardHeader>
          <div className="divide-y divide-gray-50">
            {cycle.teamTemplates.map((tt) => (
              <div key={tt.teamId} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[14px] font-medium text-gray-900">{tt.teamName}</span>
                <Badge variant="outline">{tt.templateName}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as "assignments" | "reports")
        }
      >
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* ─── Assignments Tab ─── */}
        <TabsContent value="assignments">
          <Tabs
            value={assignmentFilter}
            onValueChange={(v) =>
              setAssignmentFilter(v as "all" | "pending" | "completed")
            }
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <Card padding="sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                          Subject
                        </th>
                        <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                          Reviewer
                        </th>
                        <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                          Relationship
                        </th>
                        <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {displayed.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-8 text-[14px] text-gray-400"
                          >
                            No assignments found
                          </td>
                        </tr>
                      ) : (
                        displayed.map((a) => (
                          <tr
                            key={a.id}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Avatar name={a.subjectName} size="sm" />
                                <span className="text-[14px] font-medium text-gray-900">
                                  {a.subjectName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Avatar name={a.reviewerName} size="sm" />
                                <span className="text-[14px] text-gray-700">
                                  {a.reviewerName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">
                                {relationshipLabel[a.relationship] ??
                                  a.relationship}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {statusIcon[a.status]}
                                <span className="text-[13px] text-gray-600">
                                  {statusLabel[a.status]}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </Tabs>
        </TabsContent>

        {/* ─── Reports Tab ─── */}
        <TabsContent value="reports">
          {reportLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          ) : cycleReport ? (
            <>
              {/* Report Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card padding="md" className="text-center">
                  <p className="text-callout text-gray-500">Completion Rate</p>
                  <p className="text-title-small text-gray-900 mt-1">
                    {cycleReport.completionRate}%
                  </p>
                  <Progress
                    value={cycleReport.completionRate}
                    className="mt-2"
                  />
                </Card>
                <Card padding="md" className="text-center">
                  <p className="text-callout text-gray-500">Avg Score</p>
                  <p className="text-title-small text-gray-900 mt-1">
                    {avgScore.toFixed(2)}
                  </p>
                  <p className="text-[12px] text-gray-400 mt-1">out of 5.0</p>
                </Card>
                <Card padding="md" className="text-center">
                  <p className="text-callout text-gray-500">Participants</p>
                  <p className="text-title-small text-gray-900 mt-1">
                    {cycleReport.individualSummaries.length}
                  </p>
                  <p className="text-[12px] text-gray-400 mt-1">individuals</p>
                </Card>
              </div>

              {/* Score Distribution */}
              {cycleReport.scoreDistribution.some((n) => n > 0) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                  </CardHeader>
                  <ScoreDistributionChart
                    distribution={cycleReport.scoreDistribution}
                  />
                </Card>
              )}

              {/* Team Completion */}
              {cycleReport.teamCompletionRates.length > 0 && (
                <Card padding="sm" className="mb-6">
                  <CardHeader>
                    <CardTitle>Team Completion</CardTitle>
                  </CardHeader>
                  <div className="space-y-3 px-4 pb-4">
                    {cycleReport.teamCompletionRates.map((team) => (
                      <div key={team.teamId}>
                        <div className="flex justify-between text-[14px] mb-1">
                          <span className="text-gray-700">{team.teamName}</span>
                          <span className="text-gray-500">
                            {team.completed}/{team.total} ({team.rate}%)
                          </span>
                        </div>
                        <Progress value={team.rate} />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Individual Reports List */}
              <Card padding="sm">
                <CardHeader>
                  <CardTitle>Individual Reports</CardTitle>
                </CardHeader>
                <div className="divide-y divide-gray-50">
                  {cycleReport.individualSummaries.length === 0 ? (
                    <p className="text-center py-8 text-[14px] text-gray-400">
                      No individual reports available yet
                    </p>
                  ) : (
                    cycleReport.individualSummaries.map((person) => (
                      <Link
                        key={person.subjectId}
                        href={`/cycles/${cycleId}/reports/${person.subjectId}`}
                      >
                        <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <Avatar name={person.subjectName} size="md" />
                            <div>
                              <p className="text-[14px] font-medium text-gray-900">
                                {person.subjectName}
                              </p>
                              <p className="text-[12px] text-gray-500">
                                {person.completedCount}/{person.reviewCount}{" "}
                                reviews completed
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {person.completedCount > 0 && (
                              <ScoreBadge score={person.overallScore} />
                            )}
                            <ChevronRight
                              size={16}
                              strokeWidth={1.5}
                              className="text-gray-300 group-hover:text-gray-500 transition-colors"
                            />
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </Card>
            </>
          ) : (
            <Card className="text-center py-12">
              <p className="text-body text-gray-500">
                Failed to load report data
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setCycleReport(null);
                  fetchReport();
                }}
                className="mt-4"
              >
                Retry
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Skeleton ───

function CycleSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-48 mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-16 rounded-2xl mb-8" />
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
