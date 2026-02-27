import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

const statusBadge: Record<string, { variant: "success" | "warning" | "default" | "info"; label: string }> = {
  DRAFT: { variant: "default", label: "Draft" },
  ACTIVE: { variant: "success", label: "Active" },
  CLOSED: { variant: "warning", label: "Closed" },
  ARCHIVED: { variant: "info", label: "Archived" },
};

const cycles = [
  { id: "1", name: "Q1 2026 Performance Review", status: "ACTIVE", startDate: "2026-01-01", endDate: "2026-03-31", template: "Standard 360°", completionRate: 67, totalAssignments: 48, completedAssignments: 32 },
  { id: "2", name: "Annual Leadership Assessment", status: "ACTIVE", startDate: "2026-02-01", endDate: "2026-04-30", template: "Leadership 360°", completionRate: 23, totalAssignments: 24, completedAssignments: 6 },
  { id: "3", name: "Q4 2025 Performance Review", status: "CLOSED", startDate: "2025-10-01", endDate: "2025-12-31", template: "Standard 360°", completionRate: 94, totalAssignments: 42, completedAssignments: 39 },
  { id: "4", name: "Mid-Year Check-in 2025", status: "ARCHIVED", startDate: "2025-06-01", endDate: "2025-07-31", template: "Quick Check-in", completionRate: 100, totalAssignments: 36, completedAssignments: 36 },
  { id: "5", name: "Q2 2026 Review (Draft)", status: "DRAFT", startDate: "2026-04-01", endDate: "2026-06-30", template: "Standard 360°", completionRate: 0, totalAssignments: 0, completedAssignments: 0 },
];

function CycleCard({ cycle }: { cycle: typeof cycles[0] }) {
  const badge = statusBadge[cycle.status];
  return (
    <Link href={`/cycles/${cycle.id}`}>
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <ChevronRight size={16} strokeWidth={1.5} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
        <CardTitle>{cycle.name}</CardTitle>
        <CardDescription>{cycle.template}</CardDescription>
        <div className="flex items-center gap-2 text-[12px] text-gray-400 mt-2">
          <Calendar size={12} strokeWidth={1.5} />
          <span>{new Date(cycle.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(cycle.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        {cycle.status !== "DRAFT" && (
          <div className="mt-4">
            <div className="flex justify-between text-[12px] mb-1.5">
              <span className="text-gray-500">{cycle.completedAssignments}/{cycle.totalAssignments} completed</span>
              <span className="font-medium text-gray-700">{cycle.completionRate}%</span>
            </div>
            <Progress value={cycle.completionRate} />
          </div>
        )}
      </Card>
    </Link>
  );
}

export default function CyclesPage() {
  return (
    <div>
      <PageHeader title="Evaluation Cycles" description="Create and manage 360° evaluation cycles">
        <Link href="/cycles/new">
          <Button>
            <Plus size={16} strokeWidth={2} className="mr-1.5" />
            New Cycle
          </Button>
        </Link>
      </PageHeader>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cycles.map((cycle) => (
              <CycleCard key={cycle.id} cycle={cycle} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cycles.filter((c) => c.status === "ACTIVE").map((cycle) => (
              <CycleCard key={cycle.id} cycle={cycle} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="draft">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cycles.filter((c) => c.status === "DRAFT").map((cycle) => (
              <CycleCard key={cycle.id} cycle={cycle} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="closed">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cycles.filter((c) => c.status === "CLOSED" || c.status === "ARCHIVED").map((cycle) => (
              <CycleCard key={cycle.id} cycle={cycle} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
