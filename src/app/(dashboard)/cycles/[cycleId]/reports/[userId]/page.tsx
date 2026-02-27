"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

const reportData = {
  subject: { id: "1", name: "Alex Kim", email: "alex@company.com" },
  cycleName: "Q1 2026 Performance Review",
  overallScore: 4.2,
  categoryScores: [
    { category: "Communication", score: 4.5 },
    { category: "Leadership", score: 4.0 },
    { category: "Technical Skills", score: 4.3 },
    { category: "Teamwork", score: 4.5 },
    { category: "Problem Solving", score: 3.8 },
    { category: "Initiative", score: 4.1 },
  ],
  scoresByRelationship: {
    manager: 4.3,
    peer: 4.1,
    directReport: 4.4,
    self: 3.9,
  },
  textFeedback: [
    { relationship: "Manager", responses: ["Excellent communication skills and always willing to help the team.", "Shows great initiative in taking on new challenges."] },
    { relationship: "Peer", responses: ["Great collaborator, always open to new ideas.", "Could improve on providing more timely updates on project status."] },
    { relationship: "Direct Report", responses: ["Very supportive manager who invests in our growth.", "Provides clear direction and constructive feedback."] },
  ],
};

export default function IndividualReportPage({ params }: { params: { cycleId: string } }) {
  return (
    <div>
      <div className="mb-6">
        <Link href={`/cycles/${params.cycleId}/reports`} className="inline-flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-gray-700 transition-colors mb-4">
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to Reports
        </Link>
      </div>

      <PageHeader
        title={reportData.subject.name}
        description={reportData.cycleName}
      >
        <Button variant="secondary">
          <Download size={16} strokeWidth={1.5} className="mr-1.5" />
          Export PDF
        </Button>
      </PageHeader>

      {/* Overall Score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card padding="md" className="text-center sm:col-span-2 lg:col-span-1">
          <p className="text-callout text-gray-500">Overall</p>
          <p className="text-title-large text-gray-900 mt-1">{reportData.overallScore}</p>
          <p className="text-[12px] text-gray-400">out of 5.0</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-callout text-blue-600">Manager</p>
          <p className="text-title-small text-gray-900 mt-1">{reportData.scoresByRelationship.manager}</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-callout text-green-600">Peers</p>
          <p className="text-title-small text-gray-900 mt-1">{reportData.scoresByRelationship.peer}</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-callout text-amber-600">Reports</p>
          <p className="text-title-small text-gray-900 mt-1">{reportData.scoresByRelationship.directReport}</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-callout text-gray-500">Self</p>
          <p className="text-title-small text-gray-900 mt-1">{reportData.scoresByRelationship.self}</p>
        </Card>
      </div>

      <Tabs defaultValue="scores">
        <TabsList>
          <TabsTrigger value="scores">Score Breakdown</TabsTrigger>
          <TabsTrigger value="feedback">Open Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="scores">
          <Card>
            <CardHeader>
              <CardTitle>Competency Scores</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {reportData.categoryScores.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-[14px] mb-1.5">
                    <span className="text-gray-700">{cat.category}</span>
                    <span className="font-medium text-gray-900">{cat.score.toFixed(1)}</span>
                  </div>
                  <Progress value={(cat.score / 5) * 100} />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <div className="space-y-4">
            {reportData.textFeedback.map((group) => (
              <Card key={group.relationship}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {group.relationship} Feedback
                    <Badge variant="outline">{group.responses.length} responses</Badge>
                  </CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  {group.responses.map((response, i) => (
                    <div key={i} className="p-3 rounded-xl bg-gray-50">
                      <p className="text-[14px] text-gray-700 leading-relaxed">{response}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
