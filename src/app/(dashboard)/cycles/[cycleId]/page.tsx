import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Play, Send, BarChart3, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

const cycle = {
  id: "1",
  name: "Q1 2026 Performance Review",
  status: "ACTIVE",
  template: "Standard 360°",
  startDate: "2026-01-01",
  endDate: "2026-03-31",
  totalAssignments: 48,
  completedAssignments: 32,
  pendingAssignments: 10,
  inProgressAssignments: 6,
  completionRate: 67,
};

const assignments = [
  { id: "1", subject: "Alex Kim", reviewer: "Sarah Chen", relationship: "peer", status: "SUBMITTED" },
  { id: "2", subject: "Alex Kim", reviewer: "Mike Johnson", relationship: "direct_report", status: "SUBMITTED" },
  { id: "3", subject: "Alex Kim", reviewer: "Lisa Park", relationship: "direct_report", status: "PENDING" },
  { id: "4", subject: "Sarah Chen", reviewer: "Alex Kim", relationship: "manager", status: "SUBMITTED" },
  { id: "5", subject: "Sarah Chen", reviewer: "James Wilson", relationship: "peer", status: "IN_PROGRESS" },
  { id: "6", subject: "Mike Johnson", reviewer: "Alex Kim", relationship: "manager", status: "PENDING" },
  { id: "7", subject: "Mike Johnson", reviewer: "Sarah Chen", relationship: "peer", status: "SUBMITTED" },
  { id: "8", subject: "Lisa Park", reviewer: "Alex Kim", relationship: "manager", status: "IN_PROGRESS" },
];

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

export default function CycleDetailPage() {
  return (
    <div>
      <PageHeader title={cycle.name} description={`${cycle.template} · ${new Date(cycle.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(cycle.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}>
        <Link href={`/cycles/${cycle.id}/reports`}>
          <Button variant="secondary">
            <BarChart3 size={16} strokeWidth={1.5} className="mr-1.5" />
            Reports
          </Button>
        </Link>
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
        <Badge variant="success">Active</Badge>
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

      {/* Assignments */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Assignments</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
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
                  {assignments.map((a) => (
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
        </TabsContent>

        <TabsContent value="pending">
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
                  {assignments.filter((a) => a.status === "PENDING" || a.status === "IN_PROGRESS").map((a) => (
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
        </TabsContent>

        <TabsContent value="completed">
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
                  {assignments.filter((a) => a.status === "SUBMITTED").map((a) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
