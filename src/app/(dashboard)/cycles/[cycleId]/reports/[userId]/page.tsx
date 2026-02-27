"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompetencyRadarChart } from "@/components/reports/radar-chart";
import { ScoreBreakdown } from "@/components/reports/score-breakdown";
import { Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RELATIONSHIP_LABELS } from "@/lib/constants";
import type { IndividualReport } from "@/types/report";

export default function IndividualReportPage() {
  const { cycleId, userId } = useParams<{ cycleId: string; userId: string }>();
  const [report, setReport] = useState<IndividualReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/cycle/${cycleId}/user/${userId}`);
      const json = await res.json();
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
  }, [cycleId, userId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  function handleExport() {
    window.open(`/api/reports/cycle/${cycleId}/export?userId=${userId}`, "_blank");
  }

  if (loading) return <ReportSkeleton />;

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

  const relScores = report.scoresByRelationship;

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
        <Button variant="secondary" onClick={handleExport}>
          <Download size={16} strokeWidth={1.5} className="mr-1.5" />
          Export PDF
        </Button>
      </PageHeader>

      {/* Overall Score + Relationship Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Card padding="md" className="text-center col-span-2 sm:col-span-1">
          <p className="text-callout text-gray-500">Overall</p>
          <p className="text-title-large text-gray-900 mt-1">
            {report.overallScore.toFixed(1)}
          </p>
          <p className="text-[12px] text-gray-400">out of 5.0</p>
        </Card>
        <RelationshipScoreCard label="Manager" value={relScores.manager} color="blue" />
        <RelationshipScoreCard label="Peers" value={relScores.peer} color="green" />
        <RelationshipScoreCard label="Reports" value={relScores.directReport} color="amber" />
        <RelationshipScoreCard label="Self" value={relScores.self} color="gray" />
      </div>

      <Tabs defaultValue="scores">
        <TabsList>
          <TabsTrigger value="scores">Score Breakdown</TabsTrigger>
          <TabsTrigger value="radar">Radar Chart</TabsTrigger>
          <TabsTrigger value="feedback">Open Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="scores">
          <Card>
            <CardHeader>
              <CardTitle>Competency Scores</CardTitle>
            </CardHeader>
            <ScoreBreakdown categories={report.categoryScores} />
          </Card>
        </TabsContent>

        <TabsContent value="radar">
          <Card>
            <CardHeader>
              <CardTitle>Competency Radar</CardTitle>
            </CardHeader>
            <CompetencyRadarChart categories={report.categoryScores} />
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <div className="space-y-4">
            {report.textFeedback.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-callout text-gray-400">
                  No open-text feedback submitted.
                </p>
              </Card>
            ) : (
              report.textFeedback.map((group, i) => (
                <Card key={`${group.questionId}-${group.relationship}-${i}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {RELATIONSHIP_LABELS[group.relationship] ?? group.relationship}{" "}
                      Feedback
                      <Badge variant="outline">
                        {group.responses.length} responses
                      </Badge>
                    </CardTitle>
                    <p className="text-[13px] text-gray-400 mt-0.5">
                      {group.questionText}
                    </p>
                  </CardHeader>
                  <div className="space-y-3">
                    {group.responses.map((response, j) => (
                      <div key={j} className="p-3 rounded-xl bg-gray-50">
                        <p className="text-[14px] text-gray-700 leading-relaxed">
                          {response}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ───

function RelationshipScoreCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: "blue" | "green" | "amber" | "gray";
}) {
  const colorClass: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    amber: "text-amber-600",
    gray: "text-gray-500",
  };

  return (
    <Card padding="md" className="text-center">
      <p className={`text-callout ${colorClass[color]}`}>{label}</p>
      <p className="text-title-small text-gray-900 mt-1">
        {value !== null ? value.toFixed(1) : "\u2014"}
      </p>
    </Card>
  );
}

function ReportSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-24 mb-6" />
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64 mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-80 mb-4" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
