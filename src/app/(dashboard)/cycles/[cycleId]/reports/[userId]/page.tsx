"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CompetencyRadarChart } from "@/components/reports/radar-chart";
import { ScoreBreakdown } from "@/components/reports/score-breakdown";
import { ScoreGauge } from "@/components/reports/score-gauge";
import { ScoreLabel } from "@/components/reports/score-label";
import { RelationshipScoreChart } from "@/components/reports/relationship-score-chart";
import { KeyInsights } from "@/components/reports/key-insights";
import { QuestionInsights } from "@/components/reports/question-insights";
import { ProfileBanner } from "@/components/reports/profile-banner";
import { SelfVsOthersChart } from "@/components/reports/self-vs-others-chart";
import { UnlockGate, useEncryptionUnlock } from "@/components/encryption/unlock-gate";
import { Download, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RELATIONSHIP_LABELS } from "@/lib/constants";
import type { IndividualReport, TeamBreakdown } from "@/types/report";

export default function IndividualReportPage() {
  const { cycleId, userId } = useParams<{ cycleId: string; userId: string }>();
  const [report, setReport] = useState<IndividualReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const { locked, reset, handleApiResponse, handleUnlocked } = useEncryptionUnlock();

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

  if (locked || reset) {
    return (
      <div>
        <BackLink cycleId={cycleId} />
        <UnlockGate locked={locked} reset={reset} onUnlocked={() => { handleUnlocked(); fetchReport(); }}>
          <div />
        </UnlockGate>
      </div>
    );
  }

  if (loading) return <ReportSkeleton />;

  if (error || !report) {
    return (
      <div>
        <BackLink cycleId={cycleId} />
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
  const selectedBreakdown = selectedTeam === "all"
    ? null
    : report.teamBreakdowns.find((t) => t.teamId === selectedTeam) ?? null;

  const displayData: ReportDisplayData = selectedBreakdown ?? report;

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
> & {
  weightedOverallScore?: number | null;
  weightedCategoryScores?: import("@/types/report").CategoryScore[] | null;
  appliedWeights?: import("@/types/report").RelationshipWeights | null;
  calibratedScore?: number | null;
  calibrationJustification?: string | null;
};

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

  const totalResponses = useMemo(
    () =>
      scoredQuestions.length > 0
        ? Math.max(...scoredQuestions.map((q) => q.responseCount))
        : 0,
    [scoredQuestions]
  );

  const effectiveScore = displayData.calibratedScore ?? displayData.weightedOverallScore ?? displayData.overallScore;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <BackLink cycleId={cycleId} />
        <div className="flex items-center gap-2">
          {report.calibratedScore != null && (
            <Badge variant="info">Calibrated</Badge>
          )}
          <Button variant="secondary" onClick={onExport}>
            <Download size={16} strokeWidth={1.5} className="mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* ─── Section 1: Profile Banner (Who + Data Confidence) ─── */}
      <ProfileBanner
        subjectName={report.subjectName}
        cycleName={report.cycleName}
        context={report.subjectContext}
        responseRate={report.responseRate}
        reviewerBreakdown={report.reviewerBreakdown}
      />

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

      {/* ─── Section 2: Score Overview (The Number + Context) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card padding="md">
          <CardHeader>
            <CardTitle>Overall Score</CardTitle>
          </CardHeader>
          <ScoreGauge score={effectiveScore} />
          <div className="flex flex-col items-center gap-1.5 mt-1">
            <ScoreLabel score={effectiveScore} />
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-gray-400">
                {totalResponses} reviewer{totalResponses !== 1 ? "s" : ""}
              </span>
              <span className="text-[12px] text-gray-400">
                {displayData.categoryScores.length} competencies
              </span>
            </div>
          </div>
          {displayData.calibratedScore != null && (
            <p className="text-center text-[11px] text-brand-500 font-medium mt-1">
              Calibrated
              {displayData.weightedOverallScore != null
                ? ` (weighted: ${displayData.weightedOverallScore.toFixed(2)}, raw: ${displayData.overallScore.toFixed(2)})`
                : ` (raw: ${displayData.overallScore.toFixed(2)})`}
            </p>
          )}
          {displayData.calibratedScore == null && displayData.weightedOverallScore != null && (
            <p className="text-center text-[11px] text-gray-400 mt-1">
              Weighted (unweighted: {displayData.overallScore.toFixed(2)})
            </p>
          )}
          {displayData.appliedWeights && (
            <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-gray-400">
              <span>Mgr {Math.round(displayData.appliedWeights.manager * 100)}%</span>
              <span>Peer {Math.round(displayData.appliedWeights.peer * 100)}%</span>
              <span>DR {Math.round(displayData.appliedWeights.directReport * 100)}%</span>
              <span>Self {Math.round(displayData.appliedWeights.self * 100)}%</span>
              <span>Ext {Math.round(displayData.appliedWeights.external * 100)}%</span>
            </div>
          )}
          {displayData.calibrationJustification && (
            <p className="text-center text-[11px] text-gray-400 mt-1 italic">
              {displayData.calibrationJustification}
            </p>
          )}
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

      {/* ─── Section 3: Key Insights (5 tiles: gap, consensus, pattern, top, growth) ─── */}
      <KeyInsights
        scoresByRelationship={displayData.scoresByRelationship}
        questionDetails={displayData.questionDetails}
        categoryScores={displayData.weightedCategoryScores ?? displayData.categoryScores}
      />

      {/* ─── Section 4: Self-Awareness (THE 360 unique value) ─── */}
      {selectedTeam === "all" && (
        <SelfVsOthersChart data={report.selfVsOthers} />
      )}

      {/* ─── Section 5: Competency Deep Dive ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Competency Radar</CardTitle>
          </CardHeader>
          <CompetencyRadarChart
            categories={displayData.weightedCategoryScores ?? displayData.categoryScores}
          />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Competency Scores</CardTitle>
          </CardHeader>
          <ScoreBreakdown
            categories={displayData.weightedCategoryScores ?? displayData.categoryScores}
          />
        </Card>
      </div>

      {/* ─── Section 6: Question Insights ─── */}
      <QuestionInsights questions={displayData.questionDetails} />

      {/* ─── Section 7: Open Feedback (Qualitative) ─── */}
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

function BackLink({ cycleId }: { cycleId: string }) {
  return (
    <Link
      href={`/cycles/${cycleId}`}
      className="inline-flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-gray-700 transition-colors"
    >
      <ArrowLeft size={14} strokeWidth={1.5} />
      Back to Cycle
    </Link>
  );
}

function ReportSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-24 mb-6" />
      {/* Profile banner skeleton */}
      <Skeleton className="h-28 rounded-2xl mb-6" />
      {/* Score overview row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
      {/* Key insights skeleton */}
      <Skeleton className="h-24 rounded-2xl mb-6" />
      {/* Self-awareness skeleton */}
      <Skeleton className="h-48 rounded-2xl mb-6" />
      {/* Competency row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      {/* Question insights */}
      <Skeleton className="h-80 rounded-2xl mb-6" />
      {/* Open feedback */}
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
