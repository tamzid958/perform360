"use client";

import { useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Play, Send, Download, CheckCircle2, Clock, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCycleDetail } from "@/store/cycle-detail";

// ─── Mock Data ───

const mockCycle = {
  id: "1",
  name: "Q1 2026 Performance Review",
  status: "ACTIVE" as const,
  template: "Standard 360°",
  startDate: "2026-01-01",
  endDate: "2026-03-31",
  totalAssignments: 48,
  completedAssignments: 32,
  pendingAssignments: 10,
  inProgressAssignments: 6,
  completionRate: 67,
};

const mockAssignments = [
  { id: "1", subject: "Alex Kim", reviewer: "Sarah Chen", relationship: "peer" as const, status: "SUBMITTED" as const },
  { id: "2", subject: "Alex Kim", reviewer: "Mike Johnson", relationship: "direct_report" as const, status: "SUBMITTED" as const },
  { id: "3", subject: "Alex Kim", reviewer: "Lisa Park", relationship: "direct_report" as const, status: "PENDING" as const },
  { id: "4", subject: "Sarah Chen", reviewer: "Alex Kim", relationship: "manager" as const, status: "SUBMITTED" as const },
  { id: "5", subject: "Sarah Chen", reviewer: "James Wilson", relationship: "peer" as const, status: "IN_PROGRESS" as const },
  { id: "6", subject: "Mike Johnson", reviewer: "Alex Kim", relationship: "manager" as const, status: "PENDING" as const },
  { id: "7", subject: "Mike Johnson", reviewer: "Sarah Chen", relationship: "peer" as const, status: "SUBMITTED" as const },
  { id: "8", subject: "Lisa Park", reviewer: "Alex Kim", relationship: "manager" as const, status: "IN_PROGRESS" as const },
];

const mockIndividuals = [
  { id: "1", name: "Alex Kim", avgScore: 4.2, reviewCount: 5, completedCount: 4 },
  { id: "2", name: "Sarah Chen", avgScore: 4.5, reviewCount: 4, completedCount: 3 },
  { id: "3", name: "Mike Johnson", avgScore: 3.8, reviewCount: 6, completedCount: 5 },
  { id: "4", name: "Lisa Park", avgScore: 4.1, reviewCount: 4, completedCount: 2 },
  { id: "5", name: "James Wilson", avgScore: 3.9, reviewCount: 5, completedCount: 5 },
  { id: "6", name: "Emily Davis", avgScore: 4.4, reviewCount: 3, completedCount: 3 },
];

// ─── Constants ───

const statusIcon: Record<string, React.ReactNode> = {
  SUBMITTED: <CheckCircle2 size={14} strokeWidth={1.5} className="text-green-500" />,
  IN_PROGRESS: <Clock size={14} strokeWidth={1.5} className="text-amber-500" />,
  PENDING: <AlertCircle size={14} strokeWidth={1.5} className="text-gray-400" />,
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

function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 4.0 ? "success" : score >= 3.0 ? "warning" : "error";
  return <Badge variant={variant}>{score.toFixed(1)}</Badge>;
}

// ─── Page ───

export default function CycleDetailPage() {
  const { cycleId } = useParams<{ cycleId: string }>();
  const {
    cycle,
    individuals,
    activeTab,
    assignmentFilter,
    avgScore,
    setCycle,
    setAssignments,
    setIndividuals,
    setActiveTab,
    setAssignmentFilter,
    filteredAssignments,
    reset,
  } = useCycleDetail();

  useEffect(() => {
    setCycle(mockCycle);
    setAssignments(mockAssignments);
    setIndividuals(mockIndividuals);
    return () => reset();
  }, [setCycle, setAssignments, setIndividuals, reset]);

  if (!cycle) return null;

  const displayed = filteredAssignments();

  return (
    <div>
      <PageHeader
        title={cycle.name}
        description={`${cycle.template} · ${new Date(cycle.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(cycle.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
      >
        {activeTab === "reports" && (
          <Button variant="secondary">
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
        <Badge variant="success">{cycle.status.charAt(0) + cycle.status.slice(1).toLowerCase()}</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card padding="md">
          <p className="text-callout text-gray-500">Total</p>
          <p className="text-title-small text-gray-900 mt-1">{cycle.totalAssignments}</p>
        </Card>
        <Card padding="md">
          <p className="text-callout text-green-600">Completed</p>
          <p className="text-title-small text-green-700 mt-1">{cycle.completedAssignments}</p>
        </Card>
        <Card padding="md">
          <p className="text-callout text-amber-600">In Progress</p>
          <p className="text-title-small text-amber-700 mt-1">{cycle.inProgressAssignments}</p>
        </Card>
        <Card padding="md">
          <p className="text-callout text-gray-500">Pending</p>
          <p className="text-title-small text-gray-700 mt-1">{cycle.pendingAssignments}</p>
        </Card>
      </div>

      {/* Progress */}
      <Card className="mb-8">
        <div className="flex justify-between text-[14px] mb-3">
          <span className="text-gray-500">Overall Completion</span>
          <span className="font-semibold text-gray-900">{cycle.completionRate}%</span>
        </div>
        <Progress value={cycle.completionRate} className="h-3" />
      </Card>

      {/* Main Tabs — Assignments + Reports */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "assignments" | "reports")}>
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* ─── Assignments Tab ─── */}
        <TabsContent value="assignments">
          <Tabs value={assignmentFilter} onValueChange={(v) => setAssignmentFilter(v as "all" | "pending" | "completed")}>
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
                        <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Subject</th>
                        <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Reviewer</th>
                        <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Relationship</th>
                        <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {displayed.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={a.subject} size="sm" />
                              <span className="text-[14px] font-medium text-gray-900">{a.subject}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={a.reviewer} size="sm" />
                              <span className="text-[14px] text-gray-700">{a.reviewer}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{relationshipLabel[a.relationship]}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {statusIcon[a.status]}
                              <span className="text-[13px] text-gray-600">{statusLabel[a.status]}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </Tabs>
        </TabsContent>

        {/* ─── Reports Tab ─── */}
        <TabsContent value="reports">
          {/* Report Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card padding="md" className="text-center">
              <p className="text-callout text-gray-500">Completion Rate</p>
              <p className="text-title-small text-gray-900 mt-1">{cycle.completionRate}%</p>
              <Progress value={cycle.completionRate} className="mt-2" />
            </Card>
            <Card padding="md" className="text-center">
              <p className="text-callout text-gray-500">Avg Score</p>
              <p className="text-title-small text-gray-900 mt-1">{avgScore.toFixed(2)}</p>
              <p className="text-[12px] text-gray-400 mt-1">out of 5.0</p>
            </Card>
            <Card padding="md" className="text-center">
              <p className="text-callout text-gray-500">Participants</p>
              <p className="text-title-small text-gray-900 mt-1">{individuals.length}</p>
              <p className="text-[12px] text-gray-400 mt-1">individuals</p>
            </Card>
          </div>

          {/* Individual Reports List */}
          <Card padding="sm">
            <CardHeader>
              <CardTitle>Individual Reports</CardTitle>
            </CardHeader>
            <div className="divide-y divide-gray-50">
              {individuals.map((person) => (
                <Link key={person.id} href={`/cycles/${cycleId}/reports/${person.id}`}>
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <Avatar name={person.name} size="md" />
                      <div>
                        <p className="text-[14px] font-medium text-gray-900">{person.name}</p>
                        <p className="text-[12px] text-gray-500">{person.completedCount}/{person.reviewCount} reviews completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={person.avgScore} />
                      <ChevronRight size={16} strokeWidth={1.5} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
