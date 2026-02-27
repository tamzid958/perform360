import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Download, ChevronRight } from "lucide-react";
import Link from "next/link";

const cycleReportData = {
  cycleName: "Q1 2026 Performance Review",
  completionRate: 67,
  individuals: [
    { id: "1", name: "Alex Kim", avgScore: 4.2, reviewCount: 5, completedCount: 4 },
    { id: "2", name: "Sarah Chen", avgScore: 4.5, reviewCount: 4, completedCount: 3 },
    { id: "3", name: "Mike Johnson", avgScore: 3.8, reviewCount: 6, completedCount: 5 },
    { id: "4", name: "Lisa Park", avgScore: 4.1, reviewCount: 4, completedCount: 2 },
    { id: "5", name: "James Wilson", avgScore: 3.9, reviewCount: 5, completedCount: 5 },
    { id: "6", name: "Emily Davis", avgScore: 4.4, reviewCount: 3, completedCount: 3 },
  ],
};

function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 4.0 ? "success" : score >= 3.0 ? "warning" : "error";
  return <Badge variant={variant}>{score.toFixed(1)}</Badge>;
}

export default function CycleReportsPage({ params }: { params: { cycleId: string } }) {
  return (
    <div>
      <PageHeader
        title="Reports"
        description={cycleReportData.cycleName}
      >
        <Button variant="secondary">
          <Download size={16} strokeWidth={1.5} className="mr-1.5" />
          Export PDF
        </Button>
      </PageHeader>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card padding="md" className="text-center">
          <p className="text-callout text-gray-500">Completion Rate</p>
          <p className="text-title-small text-gray-900 mt-1">{cycleReportData.completionRate}%</p>
          <Progress value={cycleReportData.completionRate} className="mt-2" />
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-callout text-gray-500">Avg Score</p>
          <p className="text-title-small text-gray-900 mt-1">4.15</p>
          <p className="text-[12px] text-gray-400 mt-1">out of 5.0</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-callout text-gray-500">Participants</p>
          <p className="text-title-small text-gray-900 mt-1">{cycleReportData.individuals.length}</p>
          <p className="text-[12px] text-gray-400 mt-1">individuals</p>
        </Card>
      </div>

      {/* Individual Reports */}
      <Card padding="sm">
        <CardHeader>
          <CardTitle>Individual Reports</CardTitle>
        </CardHeader>
        <div className="divide-y divide-gray-50">
          {cycleReportData.individuals.map((person) => (
            <Link key={person.id} href={`/cycles/${params.cycleId}/reports/${person.id}`}>
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
    </div>
  );
}
