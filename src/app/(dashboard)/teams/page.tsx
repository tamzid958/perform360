import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Users, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";

const teams = [
  { id: "1", name: "Engineering", description: "Core product development team", memberCount: 12, managers: 2, directReports: 8 },
  { id: "2", name: "Design", description: "Product design and UX team", memberCount: 6, managers: 1, directReports: 4 },
  { id: "3", name: "Marketing", description: "Growth and marketing team", memberCount: 8, managers: 1, directReports: 5 },
  { id: "4", name: "Sales", description: "Sales and business development", memberCount: 10, managers: 2, directReports: 6 },
  { id: "5", name: "Customer Success", description: "Customer support and success team", memberCount: 5, managers: 1, directReports: 3 },
];

export default function TeamsPage() {
  return (
    <div>
      <PageHeader title="Teams" description="Manage your organization's team structure">
        <Link href="/teams/new">
          <Button>
            <Plus size={16} strokeWidth={2} className="mr-1.5" />
            New Team
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Link key={team.id} href={`/teams/${team.id}`}>
            <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-brand-50">
                    <Users size={20} strokeWidth={1.5} className="text-brand-500" />
                  </div>
                  <ChevronRight size={16} strokeWidth={1.5} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </CardHeader>
              <CardTitle>{team.name}</CardTitle>
              <CardDescription>{team.description}</CardDescription>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <Badge variant="default">{team.memberCount} members</Badge>
                <Badge variant="info">{team.managers} managers</Badge>
                <Badge variant="outline">{team.directReports} reports</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
