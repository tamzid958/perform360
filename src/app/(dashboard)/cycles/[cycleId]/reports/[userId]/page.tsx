"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { CompetencyRadarChart } from "@/components/reports/radar-chart";
import { ScoreBreakdown } from "@/components/reports/score-breakdown";
import { ScoreGauge } from "@/components/reports/score-gauge";
import { RelationshipScoreChart } from "@/components/reports/relationship-score-chart";
import { QuestionDetailChart } from "@/components/reports/question-detail-chart";
import { DistributionMiniChart } from "@/components/reports/distribution-mini-chart";
import { UnlockGate, useEncryptionUnlock } from "@/components/encryption/unlock-gate";
import { Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RELATIONSHIP_LABELS } from "@/lib/constants";
import type { IndividualReport, TeamBreakdown } from "@/types/report";
import { Users } from "lucide-react";

export default function IndividualReportPage() {
  const { cycleId, userId } = useParams<{ cycleId: string; userId: string }>();
  const [report, setReport] = useState<IndividualReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const { locked, handleApiResponse, handleUnlocked } = useEncryptionUnlock();

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/cycle/${cycleId}/user/${userId}`);
      const json = await res.json();
      if (handleApiResponse(json)) return;
      if (!json.success) {
        setError(json.error ?? "Failed to load report");
        return;
      }
      setReport(json.data);
    } catch {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [cycleId, userId, handleApiResponse]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  function handleExport() {
    window.open(`/api/reports/cycle/${cycleId}/export?userId=${userId}`, "_blank");
  }

  if (loading) return <ReportSkeleton />;

  if (locked) {
    return (
      <div>
        <div className="mb-6">
          <Link
            href={`/cycles/${cycleId}`}
            className="inline-flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back to Cycle
          </Link>
        </div>
        <UnlockGate locked={locked} onUnlocked={() => { handleUnlocked(); fetchReport(); }}>
          <div />
        </UnlockGate>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div>
        <div className="mb-6">
          <Link
            href={`/cycles/${cycleId}`}
            className="inline-flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back to Cycle
          </Link>
        </div>
        <Card className="text-center py-12">
          <p className="text-body text-gray-500">{error ?? "Report not found"}</p>
          <Button variant="secondary" onClick={fetchReport} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  // Derive display data based on selected team
  const displayData: ReportDisplayData = selectedTeam === "all"
    ? report
    : report.teamBreakdowns.find((t) => t.teamId === selectedTeam) ?? report;

  const showTeamSelector = report.teamBreakdowns.length > 1;

  return (
    <ReportContent
      report={report}
      displayData={displayData}
      cycleId={cycleId}
      onExport={handleExport}
      selectedTeam={selectedTeam}
      onSelectTeam={setSelectedTeam}
      showTeamSelector={showTeamSelector}
    />
  );
}

// ─── Shared display data shape ───

type ReportDisplayData = Pick<
  IndividualReport | TeamBreakdown,
  "overallScore" | "categoryScores" | "scoresByRelationship" | "questionDetails" | "textFeedback"
>;

// ─── Main Report Content ───

function ReportContent({
  report,
  displayData,
  cycleId,
  onExport,
  selectedTeam,
  onSelectTeam,
  showTeamSelector,
}: {
  report: IndividualReport;
  displayData: ReportDisplayData;
  cycleId: string;
  onExport: () => void;
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
  showTeamSelector: boolean;
}) {
  const relScores = displayData.scoresByRelationship;

  const scoredQuestions = useMemo(
    () => displayData.questionDetails.filter((q) => q.averageScore !== null),
    [displayData.questionDetails]
  );

  const questionsWithDistribution = useMemo(
    () =>
      displayData.questionDetails.filter(
        (q) => Object.keys(q.distribution).length > 0
      ),
    [displayData.questionDetails]
  );

  const totalResponses = useMemo(
    () =>
      scoredQuestions.length > 0
        ? Math.max(...scoredQuestions.map((q) => q.responseCount))
        : 0,
    [scoredQuestions]
  );

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/cycles/${cycleId}`}
          className="inline-flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to Cycle
        </Link>
      </div>

      <PageHeader title={report.subjectName} description={report.cycleName}>
        <Button variant="secondary" onClick={onExport}>
          <Download size={16} strokeWidth={1.5} className="mr-1.5" />
          Export PDF
        </Button>
      </PageHeader>

      {/* ─── Team Selector ─── */}
      {showTeamSelector && (
        <div className="flex items-center gap-2 mb-6">
          <Users size={16} strokeWidth={1.5} className="text-gray-400" />
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSelectTeam("all")}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                selectedTeam === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Teams
            </button>
            {report.teamBreakdowns.map((tb) => (
              <button
                key={tb.teamId}
                onClick={() => onSelectTeam(tb.teamId)}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                  selectedTeam === tb.teamId
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tb.teamName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Hero: Score Gauge + Relationship Bars ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card padding="md">
          <CardHeader>
            <CardTitle>Overall Score</CardTitle>
          </CardHeader>
          <ScoreGauge score={displayData.overallScore} />
          <div className="flex items-center justify-center gap-4 mt-1">
            <span className="text-[12px] text-gray-400">
              {totalResponses} reviewer{totalResponses !== 1 ? "s" : ""}
            </span>
            <span className="text-[12px] text-gray-400">
              {displayData.categoryScores.length} competencies
            </span>
          </div>
        </Card>
        <Card padding="md">
          <CardHeader>
            <CardTitle>Scores by Relationship</CardTitle>
          </CardHeader>
          <RelationshipScoreChart
            manager={relScores.manager}
            peer={relScores.peer}
            directReport={relScores.directReport}
            self={relScores.self}
            external={relScores.external}
          />
        </Card>
      </div>

      {/* ─── Competency Radar + Bar Breakdown ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Competency Radar</CardTitle>
          </CardHeader>
          <CompetencyRadarChart categories={displayData.categoryScores} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Competency Scores</CardTitle>
          </CardHeader>
          <ScoreBreakdown categories={displayData.categoryScores} />
        </Card>
      </div>

      {/* ─── Per-Question Average Scores ─── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Per-Question Scores</CardTitle>
        </CardHeader>
        <QuestionDetailChart questions={scoredQuestions} />
      </Card>

      {/* ─── Response Distributions ─── */}
      {questionsWithDistribution.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Response Distributions</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {questionsWithDistribution.map((q) => (
              <div
                key={q.questionId}
                className="p-3 rounded-xl bg-gray-50/80 border border-gray-100"
              >
                <p className="text-[12px] font-medium text-gray-700 mb-2 line-clamp-2">
                  {q.questionText}
                </p>
                <DistributionMiniChart distribution={q.distribution} />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-gray-400">
                    {q.responseCount} responses
                  </span>
                  {q.averageScore !== null && (
                    <span className="text-[11px] font-medium text-gray-600">
                      avg {q.averageScore.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Open Feedback ─── */}
      <Card>
        <CardHeader>
          <CardTitle>
            Open Feedback
          </CardTitle>
        </CardHeader>
        {displayData.textFeedback.length === 0 ? (
          <p className="text-center py-8 text-callout text-gray-400">
            No open-text feedback submitted.
          </p>
        ) : (
          <div className="space-y-4">
            {displayData.textFeedback.map((group, i) => (
              <div key={`${group.questionId}-${group.relationship}-${i}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    {RELATIONSHIP_LABELS[group.relationship] ?? group.relationship}
                  </Badge>
                  <span className="text-[13px] text-gray-500">
                    {group.questionText}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.responses.map((response, j) => (
                    <div key={j} className="p-3 rounded-xl bg-gray-50">
                      <p className="text-[14px] text-gray-700 leading-relaxed">
                        {response}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Sub-components ───

function ReportSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-24 mb-6" />
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-80 rounded-2xl mb-6" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
