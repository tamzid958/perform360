"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ScoreDistributionChart } from "@/components/reports/score-distribution-chart";
import { CompletionDonutChart } from "@/components/reports/completion-donut-chart";
import { StatusBreakdownChart } from "@/components/reports/status-breakdown-chart";
import { TeamScoreChart } from "@/components/reports/team-score-chart";
import { RelationshipScoreChart } from "@/components/reports/relationship-score-chart";
import { SubmissionTrendChart } from "@/components/reports/submission-trend-chart";
import { UnlockGate, useEncryptionUnlock } from "@/components/encryption/unlock-gate";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Send,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Search,
  Users,
  BarChart3,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertTriangle,
  Trash2,
  XCircle,
  RotateCcw,
  MoreHorizontal,
  Scale,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import type { CycleReport } from "@/types/report";
import { CalibrationPanel } from "@/components/cycles/calibration-panel";
import { Breadcrumb } from "@/components/ui/breadcrumb";

// ─── Types ───

interface TeamTemplate {
  teamId: string;
  teamName: string;
  templateId: string;
  templateName: string;
  weights: {
    manager: number;
    peer: number;
    directReport: number;
    self: number;
    external: number;
  } | null;
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
  teamId: string;
  teamName: string;
}

// ─── Constants ───

type StatusFilterValue = "all" | "PENDING" | "IN_PROGRESS" | "SUBMITTED";
type RelationshipFilterValue =
  | "all"
  | "manager"
  | "direct_report"
  | "peer"
  | "self"
  | "external";

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
  external: "External",
};

const statusBadgeVariant: Record<
  string,
  "success" | "warning" | "default" | "outline"
> = {
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
  const router = useRouter();
  const { cycleId } = useParams<{ cycleId: string }>();
  const [cycle, setCycle] = useState<CycleApiData | null>(null);
  const [cycleReport, setCycleReport] = useState<CycleReport | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "assignments" | "reports" | "calibration"
  >("overview");
  const [calibrationData, setCalibrationData] = useState<any>(null);
  const [calibrationLoading, setCalibrationLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [relationshipFilter, setRelationshipFilter] =
    useState<RelationshipFilterValue>("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [reportTeamFilter, setReportTeamFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activatePassphrase, setActivatePassphrase] = useState("");
  const [activateError, setActivateError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const { locked, reset, handleApiResponse, handleUnlocked } = useEncryptionUnlock();
  const { addToast } = useToast();

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
      if (handleApiResponse(json)) return;
      if (json.success) setCycleReport(json.data);
    } catch {
      // handled by null state
    } finally {
      setReportLoading(false);
    }
  }, [cycleId, cycleReport, handleApiResponse]);

  useEffect(() => {
    fetchCycle();
  }, [fetchCycle]);

  const fetchCalibration = useCallback(async () => {
    if (calibrationData || calibrationLoading) return;
    setCalibrationLoading(true);
    try {
      const res = await fetch(`/api/cycles/${cycleId}/calibration`);
      const json = await res.json();
      if (handleApiResponse(json)) return;
      if (json.success) setCalibrationData(json.data);
    } catch {
      // handled by null state
    } finally {
      setCalibrationLoading(false);
    }
  }, [cycleId, calibrationData, calibrationLoading, handleApiResponse]);

  useEffect(() => {
    if (activeTab === "reports") fetchReport();
    if (activeTab === "calibration") fetchCalibration();
  }, [activeTab, fetchReport, fetchCalibration]);

  // ─── Filtered assignments ───

  const assignments = useMemo(
    () => cycle?.assignmentsWithNames ?? [],
    [cycle?.assignmentsWithNames]
  );

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return assignments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (relationshipFilter !== "all" && a.relationship !== relationshipFilter)
        return false;
      if (teamFilter !== "all" && a.teamId !== teamFilter) return false;
      if (
        query &&
        !a.subjectName.toLowerCase().includes(query) &&
        !a.reviewerName.toLowerCase().includes(query)
      )
        return false;
      return true;
    });
  }, [assignments, statusFilter, relationshipFilter, teamFilter, searchQuery]);

  // Group filtered assignments by team
  const groupedByTeam = useMemo(() => {
    const groups = new Map<string, { teamName: string; items: AssignmentWithNames[] }>();
    for (const a of filteredAssignments) {
      const group = groups.get(a.teamId) ?? { teamName: a.teamName, items: [] };
      group.items.push(a);
      groups.set(a.teamId, group);
    }
    return Array.from(groups.entries()).map(([teamId, g]) => ({
      teamId,
      teamName: g.teamName,
      items: g.items,
    }));
  }, [filteredAssignments]);

  const activeFilterCount = [
    statusFilter !== "all",
    relationshipFilter !== "all",
    teamFilter !== "all",
    searchQuery.trim() !== "",
  ].filter(Boolean).length;

  // ─── Report computed data ───

  const hasWeightedScores = cycleReport?.individualSummaries?.some(
    (s) => s.weightedOverallScore !== null && s.weightedOverallScore !== undefined
  ) ?? false;

  const avgScore =
    cycleReport?.individualSummaries &&
    cycleReport.individualSummaries.length > 0
      ? cycleReport.individualSummaries.reduce(
          (sum, s) => sum + (hasWeightedScores && s.weightedOverallScore != null ? s.weightedOverallScore : s.overallScore),
          0
        ) / cycleReport.individualSummaries.length
      : 0;

  // Resolve which subjects belong to which team(s) for report filtering
  const subjectTeamMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of assignments) {
      const teams = map.get(a.subjectId) ?? new Set<string>();
      teams.add(a.teamId);
      map.set(a.subjectId, teams);
    }
    return map;
  }, [assignments]);

  const filteredReportSummaries = useMemo(() => {
    if (!cycleReport) return [];
    if (reportTeamFilter === "all") return cycleReport.individualSummaries;
    return cycleReport.individualSummaries.filter(
      (s) => subjectTeamMap.get(s.subjectId)?.has(reportTeamFilter)
    );
  }, [cycleReport, reportTeamFilter, subjectTeamMap]);

  const getDisplayScore = useCallback(
    (s: { overallScore: number; weightedOverallScore?: number | null }) =>
      hasWeightedScores && s.weightedOverallScore != null
        ? s.weightedOverallScore
        : s.overallScore,
    [hasWeightedScores]
  );

  const topPerformers = useMemo(() => {
    return [...filteredReportSummaries]
      .filter((s) => s.completedCount > 0 && getDisplayScore(s) > 0)
      .sort((a, b) => getDisplayScore(b) - getDisplayScore(a))
      .slice(0, 5);
  }, [filteredReportSummaries, getDisplayScore]);

  const bottomPerformers = useMemo(() => {
    return [...filteredReportSummaries]
      .filter((s) => s.completedCount > 0 && getDisplayScore(s) > 0)
      .sort((a, b) => getDisplayScore(a) - getDisplayScore(b))
      .slice(0, 5);
  }, [filteredReportSummaries, getDisplayScore]);

  // ─── Handlers ───

  async function handleEditCycle() {
    if (!editName.trim()) return;
    setEditLoading(true);
    try {
      const body: Record<string, string> = { name: editName.trim() };
      if (editStartDate) body.startDate = new Date(editStartDate).toISOString();
      if (editEndDate) body.endDate = new Date(editEndDate).toISOString();
      const res = await fetch(`/api/cycles/${cycleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update cycle");
      addToast("Cycle updated", "success");
      setShowEditDialog(false);
      fetchCycle();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update cycle", "error");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/reports/cycle/${cycleId}/export`, {
        method: "POST",
      });
      const json = await res.json();
      if (handleApiResponse(json)) return;
      if (!json.success) {
        throw new Error(json.error || "Failed to start export");
      }
      addToast("Export started — check your email shortly", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to start export",
        "error"
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleRemind() {
    setReminding(true);
    try {
      const res = await fetch(`/api/cycles/${cycleId}/remind`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        addToast(
          `Reminders sent to ${json.data.totalPending} reviewer${json.data.totalPending !== 1 ? "s" : ""}`,
          "success"
        );
      } else {
        addToast(json.error ?? "Failed to send reminders", "error");
      }
    } catch {
      addToast("Failed to send reminders", "error");
    } finally {
      setReminding(false);
    }
  }

  async function handleRemindIndividual(
    assignmentId: string,
    reviewerName: string
  ) {
    setRemindingId(assignmentId);
    try {
      const res = await fetch(`/api/cycles/${cycleId}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      const json = await res.json();
      if (json.success && json.data.totalPending > 0) {
        addToast(`Reminder sent to ${reviewerName}`, "success");
      } else if (json.success && json.data.totalPending === 0) {
        addToast(json.data.message ?? "No reminder sent", "warning");
      } else {
        addToast(json.error ?? "Failed to send reminder", "error");
      }
    } catch {
      addToast("Failed to send reminder", "error");
    } finally {
      setRemindingId(null);
    }
  }

  async function handleActivate() {
    setActivating(true);
    setActivateError("");
    try {
      // 1. Unlock encryption with the provided passphrase
      const unlockRes = await fetch("/api/encryption/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: activatePassphrase }),
      });
      const unlockJson = await unlockRes.json();
      if (!unlockJson.success) {
        setActivateError(unlockJson.error ?? "Incorrect passphrase");
        return;
      }

      // 2. Activate the cycle
      const res = await fetch(`/api/cycles/${cycleId}/activate`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setShowActivateDialog(false);
        addToast(
          `Cycle activated — invitation emails are being sent to reviewers`,
          "success"
        );
        fetchCycle();
      } else {
        addToast(json.error ?? "Failed to activate cycle", "error");
      }
    } catch {
      addToast("Failed to activate cycle", "error");
    } finally {
      setActivating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/cycles/${cycleId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        addToast("Cycle deleted", "success");
        router.push("/cycles");
      } else {
        addToast(json.error ?? "Failed to delete cycle", "error");
      }
    } catch {
      addToast("Failed to delete cycle", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleClose() {
    setClosing(true);
    try {
      const res = await fetch(`/api/cycles/${cycleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      const json = await res.json();
      if (json.success) {
        setShowCloseDialog(false);
        addToast("Cycle closed", "success");
        fetchCycle();
      } else {
        addToast(json.error ?? "Failed to close cycle", "error");
      }
    } catch {
      addToast("Failed to close cycle", "error");
    } finally {
      setClosing(false);
    }
  }

  async function handleReopen() {
    setReopening(true);
    try {
      const res = await fetch(`/api/cycles/${cycleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      const json = await res.json();
      if (json.success) {
        setShowReopenDialog(false);
        addToast("Cycle reopened", "success");
        fetchCycle();
      } else {
        addToast(json.error ?? "Failed to reopen cycle", "error");
      }
    } catch {
      addToast("Failed to reopen cycle", "error");
    } finally {
      setReopening(false);
    }
  }

  function clearFilters() {
    setStatusFilter("all");
    setRelationshipFilter("all");
    setTeamFilter("all");
    setSearchQuery("");
  }

  // ─── Render ───

  if (loading) return <CycleSkeleton />;
  if (!cycle) {
    return (
      <Card className="text-center py-12">
        <p className="text-body text-gray-500">Cycle not found</p>
      </Card>
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Cycles", href: "/cycles" }, { label: cycle.name }]} />
      <PageHeader
        title={cycle.name}
        description={`${cycle.teamTemplates.length} team${cycle.teamTemplates.length !== 1 ? "s" : ""} \u00B7 ${new Date(cycle.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${new Date(cycle.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
      >
        <Badge variant={statusBadgeVariant[cycle.status]}>
          {cycle.status.charAt(0) + cycle.status.slice(1).toLowerCase()}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 p-0" aria-label="More actions">
              <MoreHorizontal size={18} strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {cycle.status === "DRAFT" && (
              <DropdownMenuItem onClick={() => {
                setEditName(cycle.name);
                setEditStartDate(cycle.startDate.slice(0, 10));
                setEditEndDate(cycle.endDate.slice(0, 10));
                setShowEditDialog(true);
              }}>
                <Pencil size={15} strokeWidth={1.5} className="mr-2" />
                Edit Cycle
              </DropdownMenuItem>
            )}
            {cycle.status === "DRAFT" && (
              <DropdownMenuItem onClick={() => setShowActivateDialog(true)}>
                <Play size={15} strokeWidth={1.5} className="mr-2" />
                Activate
              </DropdownMenuItem>
            )}
            {cycle.status === "ACTIVE" && (
              <DropdownMenuItem onClick={handleRemind} disabled={reminding}>
                <Send size={15} strokeWidth={1.5} className="mr-2" />
                {reminding ? "Sending…" : "Send Reminders"}
              </DropdownMenuItem>
            )}
            {activeTab === "reports" && (
              <DropdownMenuItem onClick={handleExport} disabled={exporting}>
                <Download size={15} strokeWidth={1.5} className="mr-2" />
                {exporting ? "Starting export…" : "Export PDF"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {cycle.status === "ACTIVE" && (
              <DropdownMenuItem
                onClick={() => setShowCloseDialog(true)}
                className="text-red-500 focus:text-red-600"
              >
                <XCircle size={15} strokeWidth={1.5} className="mr-2" />
                End Cycle
              </DropdownMenuItem>
            )}
            {cycle.status === "CLOSED" && (
              <DropdownMenuItem onClick={() => setShowReopenDialog(true)}>
                <RotateCcw size={15} strokeWidth={1.5} className="mr-2" />
                Reopen Cycle
              </DropdownMenuItem>
            )}
            {cycle.status === "DRAFT" && (
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-500 focus:text-red-600"
              >
                <Trash2 size={15} strokeWidth={1.5} className="mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      {/* ─── Top-Level Tabs ─── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as "overview" | "assignments" | "reports" | "calibration")
        }
      >
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 size={15} strokeWidth={1.5} className="mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <ClipboardList size={15} strokeWidth={1.5} className="mr-1.5" />
            Assignments
            {cycle.stats.totalAssignments > 0 && (
              <span className="ml-1.5 text-[11px] font-normal bg-gray-200/80 text-gray-600 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {cycle.stats.totalAssignments}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Users size={15} strokeWidth={1.5} className="mr-1.5" />
            Reports
          </TabsTrigger>
          {(cycle.status === "CLOSED" || cycle.status === "ARCHIVED") && (
            <TabsTrigger value="calibration">
              <Scale size={15} strokeWidth={1.5} className="mr-1.5" />
              Calibration
            </TabsTrigger>
          )}
        </TabsList>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview">
          {/* Completion Donut + Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card padding="md">
              <CardHeader>
                <CardTitle>Completion Progress</CardTitle>
              </CardHeader>
              <div className="flex justify-center py-2">
                <CompletionDonutChart
                  completed={cycle.stats.submittedAssignments}
                  total={cycle.stats.totalAssignments}
                />
              </div>
            </Card>
            <Card padding="md">
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
              </CardHeader>
              <StatusBreakdownChart
                submitted={cycle.stats.submittedAssignments}
                inProgress={cycle.stats.inProgressAssignments}
                pending={cycle.stats.pendingAssignments}
              />
            </Card>
          </div>

          {/* Team-Template Pairs */}
          {cycle.teamTemplates.length > 0 && (
            <Card padding="sm">
              <CardHeader>
                <CardTitle>Teams & Templates</CardTitle>
              </CardHeader>
              <div className="divide-y divide-gray-50">
                {cycle.teamTemplates.map((tt) => (
                  <div key={tt.teamId} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-medium text-gray-900 truncate">
                        {tt.teamName}
                      </span>
                      <Badge variant="outline" className="shrink-0">{tt.templateName}</Badge>
                    </div>
                    {tt.weights && (
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                        <span>Weights:</span>
                        <span>Mgr {tt.weights.manager}%</span>
                        <span>Peer {tt.weights.peer}%</span>
                        <span>DR {tt.weights.directReport}%</span>
                        <span>Self {tt.weights.self}%</span>
                        <span>Ext {tt.weights.external}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ─── Assignments Tab ─── */}
        <TabsContent value="assignments">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 flex-wrap">
            {/* Status segmented control */}
            <div className="inline-flex items-center gap-0.5 rounded-xl bg-gray-100 p-1 overflow-x-auto shrink-0">
              {(
                [
                  { value: "all", label: "All" },
                  { value: "PENDING", label: "Pending" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "SUBMITTED", label: "Submitted" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    statusFilter === opt.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Team dropdown */}
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-auto h-9 min-w-[130px] text-[13px] rounded-lg">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {cycle.teamTemplates.map((tt) => (
                  <SelectItem key={tt.teamId} value={tt.teamId}>
                    {tt.teamName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Relationship dropdown */}
            <Select
              value={relationshipFilter}
              onValueChange={(v) =>
                setRelationshipFilter(v as RelationshipFilterValue)
              }
            >
              <SelectTrigger className="w-auto h-9 min-w-[150px] text-[13px] rounded-lg">
                <SelectValue placeholder="Relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Relationships</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="direct_report">Direct Report</SelectItem>
                <SelectItem value="peer">Peer</SelectItem>
                <SelectItem value="self">Self</SelectItem>
                <SelectItem value="external">External</SelectItem>
              </SelectContent>
            </Select>

            {/* Search input */}
            <div className="relative flex-1 w-full sm:min-w-[180px]">
              <Search
                size={15}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by name\u2026"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all duration-200"
              />
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-[12px] text-brand-500 hover:text-brand-600 font-medium whitespace-nowrap transition-colors"
              >
                Clear filters ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] text-gray-400">
              {filteredAssignments.length} of {assignments.length} assignment
              {assignments.length !== 1 ? "s" : ""}
              {groupedByTeam.length > 1 &&
                ` across ${groupedByTeam.length} teams`}
            </p>
          </div>

          {/* Grouped Assignments Table */}
          {filteredAssignments.length === 0 ? (
            <Card className="py-12">
              <div className="flex flex-col items-center gap-2">
                <Search
                  size={24}
                  strokeWidth={1.5}
                  className="text-gray-300"
                />
                <p className="text-[14px] text-gray-400">
                  {activeFilterCount > 0
                    ? "No assignments match your filters"
                    : "No assignments found"}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-[13px] text-brand-500 hover:text-brand-600 font-medium transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedByTeam.map((group) => (
                <Card key={group.teamId} padding="sm">
                  {/* Team header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Users
                        size={15}
                        strokeWidth={1.5}
                        className="text-gray-400"
                      />
                      <span className="text-[14px] font-semibold text-gray-900">
                        {group.teamName}
                      </span>
                    </div>
                    <span className="text-[12px] text-gray-400">
                      {group.items.filter((a) => a.status === "SUBMITTED").length}
                      /{group.items.length} completed
                    </span>
                  </div>
                  <div className="overflow-x-auto -mx-1 sm:mx-0">
                    <table className="w-full min-w-[580px]">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="text-left text-[11px] font-medium text-gray-400 tracking-wide px-4 py-2">
                            Subject
                          </th>
                          <th className="text-left text-[11px] font-medium text-gray-400 tracking-wide px-4 py-2">
                            Reviewer
                          </th>
                          <th className="text-left text-[11px] font-medium text-gray-400 tracking-wide px-4 py-2">
                            Relationship
                          </th>
                          <th className="text-left text-[11px] font-medium text-gray-400 tracking-wide px-4 py-2">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {group.items.map((a) => (
                          <tr
                            key={a.id}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <Avatar name={a.subjectName} size="sm" />
                                <span className="text-[13px] font-medium text-gray-900">
                                  {a.subjectName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <Avatar name={a.reviewerName} size="sm" />
                                <span className="text-[13px] text-gray-700">
                                  {a.reviewerName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge variant="outline">
                                {relationshipLabel[a.relationship] ??
                                  a.relationship}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {statusIcon[a.status]}
                                  <span className="text-[12px] text-gray-600">
                                    {statusLabel[a.status]}
                                  </span>
                                </div>
                                {cycle.status === "ACTIVE" &&
                                  a.status !== "SUBMITTED" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={remindingId === a.id}
                                      onClick={() =>
                                        handleRemindIndividual(
                                          a.id,
                                          a.reviewerName
                                        )
                                      }
                                    >
                                      <Send
                                        size={14}
                                        strokeWidth={1.5}
                                        className="mr-1"
                                      />
                                      {remindingId === a.id
                                        ? "Sending\u2026"
                                        : "Remind"}
                                    </Button>
                                  )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Reports Tab ─── */}
        <TabsContent value="reports">
          {locked || reset ? (
            <UnlockGate
              locked={locked}
              reset={reset}
              onUnlocked={() => {
                handleUnlocked();
                setCycleReport(null);
                fetchReport();
              }}
            >
              <div />
            </UnlockGate>
          ) : reportLoading ? (
            <ReportSkeleton />
          ) : cycleReport ? (
            <>
              {/* Summary Stats + Team Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-headline text-gray-900">Summary</h3>
                {cycle.teamTemplates.length > 1 && (
                  <Select
                    value={reportTeamFilter}
                    onValueChange={setReportTeamFilter}
                  >
                    <SelectTrigger className="w-auto h-9 min-w-[160px] text-[13px] rounded-lg">
                      <SelectValue placeholder="Filter by team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {cycle.teamTemplates.map((tt) => (
                        <SelectItem key={tt.teamId} value={tt.teamId}>
                          {tt.teamName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
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
                    {filteredReportSummaries.length}
                  </p>
                  <p className="text-[12px] text-gray-400 mt-1">
                    {reportTeamFilter !== "all" ? "in team" : "individuals"}
                  </p>
                </Card>
              </div>

              {/* Submission Trend */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Submission Timeline</CardTitle>
                </CardHeader>
                <SubmissionTrendChart data={cycleReport.submissionTrend} />
              </Card>

              {/* Score Distribution + Relationship Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                  </CardHeader>
                  <ScoreDistributionChart
                    distribution={cycleReport.scoreDistribution}
                  />
                </Card>
                {cycleReport.avgScoreByRelationship && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Scores by Relationship</CardTitle>
                    </CardHeader>
                    <RelationshipScoreChart
                      manager={cycleReport.avgScoreByRelationship.manager}
                      peer={cycleReport.avgScoreByRelationship.peer}
                      directReport={
                        cycleReport.avgScoreByRelationship.directReport
                      }
                      self={cycleReport.avgScoreByRelationship.self}
                      external={cycleReport.avgScoreByRelationship.external}
                    />
                  </Card>
                )}
              </div>

              {/* Avg Score by Team */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Average Score by Team</CardTitle>
                </CardHeader>
                <TeamScoreChart
                  teams={cycleReport.avgScoreByTeam.map((t) => ({
                    teamName: t.teamName,
                    avgScore: t.weightedAvgScore ?? t.avgScore,
                  }))}
                />
              </Card>

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
                          <span className="text-gray-700">
                            {team.teamName}
                          </span>
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

              {/* Top & Bottom Performers */}
              {topPerformers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card padding="sm">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          size={16}
                          strokeWidth={1.5}
                          className="text-green-500"
                        />
                        <CardTitle>Top Performers</CardTitle>
                      </div>
                    </CardHeader>
                    <div className="divide-y divide-gray-50">
                      {topPerformers.map((person, idx) => (
                        <Link
                          key={person.subjectId}
                          href={`/cycles/${cycleId}/reports/${person.subjectId}`}
                        >
                          <div className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/50 transition-colors group gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-[12px] font-semibold text-gray-400 w-5 text-center shrink-0">
                                {idx === 0 ? (
                                  <Trophy
                                    size={14}
                                    strokeWidth={1.5}
                                    className="text-amber-500 inline"
                                  />
                                ) : (
                                  idx + 1
                                )}
                              </span>
                              <Avatar name={person.subjectName} size="sm" />
                              <span className="text-[14px] font-medium text-gray-900 truncate">
                                {person.subjectName}
                              </span>
                            </div>
                            <ScoreBadge score={getDisplayScore(person)} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>

                  <Card padding="sm">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <TrendingDown
                          size={16}
                          strokeWidth={1.5}
                          className="text-amber-500"
                        />
                        <CardTitle>Needs Improvement</CardTitle>
                      </div>
                    </CardHeader>
                    <div className="divide-y divide-gray-50">
                      {bottomPerformers.map((person, idx) => (
                        <Link
                          key={person.subjectId}
                          href={`/cycles/${cycleId}/reports/${person.subjectId}`}
                        >
                          <div className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/50 transition-colors group gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-[12px] font-semibold text-gray-400 w-5 text-center shrink-0">
                                {idx + 1}
                              </span>
                              <Avatar name={person.subjectName} size="sm" />
                              <span className="text-[14px] font-medium text-gray-900 truncate">
                                {person.subjectName}
                              </span>
                            </div>
                            <ScoreBadge score={getDisplayScore(person)} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* Individual Reports List */}
              <Card padding="sm">
                <CardHeader>
                  <CardTitle>
                    {reportTeamFilter !== "all"
                      ? "Team Individual Reports"
                      : "All Individual Reports"}
                  </CardTitle>
                </CardHeader>
                <div className="divide-y divide-gray-50">
                  {filteredReportSummaries.length === 0 ? (
                    <p className="text-center py-8 text-[14px] text-gray-400">
                      No individual reports available
                      {reportTeamFilter !== "all" && " for this team"}
                    </p>
                  ) : (
                    filteredReportSummaries.map((person) => (
                      <Link
                        key={person.subjectId}
                        href={`/cycles/${cycleId}/reports/${person.subjectId}`}
                      >
                        <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer group gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={person.subjectName} size="md" />
                            <div className="min-w-0">
                              <p className="text-[14px] font-medium text-gray-900 truncate">
                                {person.subjectName}
                              </p>
                              <p className="text-[12px] text-gray-500">
                                {person.completedCount}/{person.reviewCount}{" "}
                                reviews completed
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {person.completedCount > 0 && (
                              <ScoreBadge score={getDisplayScore(person)} />
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

        {/* ─── Calibration Tab ─── */}
        {(cycle.status === "CLOSED" || cycle.status === "ARCHIVED") && (
          <TabsContent value="calibration">
            {locked || reset ? (
              <UnlockGate
                locked={locked}
                reset={reset}
                onUnlocked={() => {
                  handleUnlocked();
                  setCalibrationData(null);
                  fetchCalibration();
                }}
              >
                <div />
              </UnlockGate>
            ) : calibrationLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
            ) : calibrationData ? (
              <CalibrationPanel
                cycleId={cycleId}
                data={calibrationData}
                readOnly={cycle.status === "ARCHIVED"}
                onSaved={() => {
                  setCalibrationData(null);
                  fetchCalibration();
                }}
              />
            ) : (
              <Card className="text-center py-12">
                <p className="text-body text-gray-500">
                  Failed to load calibration data
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCalibrationData(null);
                    fetchCalibration();
                  }}
                  className="mt-4"
                >
                  Retry
                </Button>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* ─── Activate Confirmation Dialog ─── */}
      <Dialog
        open={showActivateDialog}
        onOpenChange={(open) => {
          setShowActivateDialog(open);
          if (!open) {
            setActivatePassphrase("");
            setActivateError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate this cycle?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please review the consequences below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-4">
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200/60 px-4 py-3">
              <AlertTriangle
                size={18}
                strokeWidth={1.5}
                className="text-amber-500 mt-0.5 shrink-0"
              />
              <ul className="text-[13px] text-amber-900 space-y-1.5">
                <li>
                  <strong>Invitation emails</strong> will be sent immediately to
                  all assigned reviewers.
                </li>
                <li>
                  The cycle will move from <strong>Draft to Active</strong> — you
                  will no longer be able to edit teams, templates, or delete the
                  cycle.
                </li>
                <li>
                  Unique evaluation links will become <strong>live</strong> and
                  accessible to reviewers.
                </li>
                <li>
                  Assignments are <strong>locked</strong> and cannot be modified
                  after activation.
                </li>
              </ul>
            </div>
            <p className="text-[13px] text-gray-500">
              {cycle.stats.totalAssignments} assignment
              {cycle.stats.totalAssignments !== 1 ? "s" : ""} across{" "}
              {cycle.teamTemplates.length} team
              {cycle.teamTemplates.length !== 1 ? "s" : ""} will be activated.
            </p>
            <Input
              id="activate-passphrase"
              label="Encryption Passphrase"
              type="password"
              placeholder="Enter your passphrase to confirm"
              value={activatePassphrase}
              onChange={(e) => {
                setActivatePassphrase(e.target.value);
                setActivateError("");
              }}
              autoFocus={false}
            />
            {activateError && (
              <p className="text-[13px] text-red-600">{activateError}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowActivateDialog(false)}
              disabled={activating}
            >
              Cancel
            </Button>
            <Button onClick={handleActivate} disabled={activating || !activatePassphrase}>
              {activating ? (
                "Activating\u2026"
              ) : (
                <>
                  <Play size={16} strokeWidth={1.5} className="mr-1.5" />
                  Activate Cycle
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this cycle?</DialogTitle>
            <DialogDescription>
              This will permanently delete the cycle and all its assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200/60 px-4 py-3 my-4">
            <AlertTriangle
              size={18}
              strokeWidth={1.5}
              className="text-red-500 mt-0.5 shrink-0"
            />
            <p className="text-[13px] text-red-900">
              <strong>{cycle.stats.totalAssignments} assignment
              {cycle.stats.totalAssignments !== 1 ? "s" : ""}</strong> across{" "}
              {cycle.teamTemplates.length} team
              {cycle.teamTemplates.length !== 1 ? "s" : ""} will be permanently
              removed. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? (
                "Deleting\u2026"
              ) : (
                <>
                  <Trash2 size={16} strokeWidth={1.5} className="mr-1.5" />
                  Delete Cycle
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Close Cycle Confirmation Dialog ─── */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End this cycle?</DialogTitle>
            <DialogDescription>
              This will close the cycle and stop accepting new submissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-4">
            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200/60 px-4 py-3">
              <AlertTriangle
                size={18}
                strokeWidth={1.5}
                className="text-red-500 mt-0.5 shrink-0"
              />
              <ul className="text-[13px] text-red-900 space-y-1.5">
                <li>
                  All <strong>evaluation links will be deactivated</strong> —
                  reviewers will no longer be able to submit responses.
                </li>
                <li>
                  <strong>
                    {cycle.stats.pendingAssignments + cycle.stats.inProgressAssignments} pending/in-progress
                  </strong>{" "}
                  assignment
                  {cycle.stats.pendingAssignments + cycle.stats.inProgressAssignments !== 1 ? "s" : ""}{" "}
                  will remain incomplete and cannot be submitted after closing.
                </li>
                <li>
                  Only <strong>{cycle.stats.submittedAssignments}</strong> of{" "}
                  <strong>{cycle.stats.totalAssignments}</strong> assignment
                  {cycle.stats.totalAssignments !== 1 ? "s" : ""} have been
                  submitted ({cycle.stats.completionRate}% complete).
                </li>
                <li>
                  You can <strong>reopen</strong> the cycle later if needed.
                </li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowCloseDialog(false)}
              disabled={closing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClose}
              disabled={closing}
              className="bg-red-500 hover:bg-red-600"
            >
              {closing ? (
                "Closing\u2026"
              ) : (
                <>
                  <XCircle size={16} strokeWidth={1.5} className="mr-1.5" />
                  End Cycle
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Reopen Cycle Confirmation Dialog ─── */}
      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen this cycle?</DialogTitle>
            <DialogDescription>
              This will reactivate the cycle and allow reviewers to submit
              responses again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-4">
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200/60 px-4 py-3">
              <AlertTriangle
                size={18}
                strokeWidth={1.5}
                className="text-amber-500 mt-0.5 shrink-0"
              />
              <ul className="text-[13px] text-amber-900 space-y-1.5">
                <li>
                  All evaluation links will become <strong>active again</strong>{" "}
                  — reviewers with pending assignments can submit responses.
                </li>
                <li>
                  <strong>
                    {cycle.stats.pendingAssignments + cycle.stats.inProgressAssignments} incomplete
                  </strong>{" "}
                  assignment
                  {cycle.stats.pendingAssignments + cycle.stats.inProgressAssignments !== 1 ? "s" : ""}{" "}
                  will be reopened for submission.
                </li>
                <li>
                  Already submitted responses ({cycle.stats.submittedAssignments})
                  will <strong>not be affected</strong>.
                </li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowReopenDialog(false)}
              disabled={reopening}
            >
              Cancel
            </Button>
            <Button onClick={handleReopen} disabled={reopening}>
              {reopening ? (
                "Reopening\u2026"
              ) : (
                <>
                  <RotateCcw size={16} strokeWidth={1.5} className="mr-1.5" />
                  Reopen Cycle
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Cycle Dialog ─── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cycle</DialogTitle>
            <DialogDescription>Update the cycle name and dates</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 mt-4"
            onSubmit={(e) => { e.preventDefault(); handleEditCycle(); }}
          >
            <Input
              id="edit-cycle-name"
              label="Cycle Name"
              placeholder="Q1 2026 Review"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
            <Input
              id="edit-start-date"
              label="Start Date"
              type="date"
              value={editStartDate}
              onChange={(e) => setEditStartDate(e.target.value)}
            />
            <Input
              id="edit-end-date"
              label="End Date"
              type="date"
              value={editEndDate}
              onChange={(e) => setEditEndDate(e.target.value)}
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={editLoading || !editName.trim()}>
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Skeletons ───

function CycleSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-48 mb-8" />
      <div className="inline-flex gap-1 mb-6">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
      <Skeleton className="h-16 rounded-2xl mb-6" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-40 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
