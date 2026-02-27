import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, RefreshCcw, DollarSign } from "lucide-react";

const stats = [
  { label: "Total Companies", value: "42", icon: Building2, change: "+3 this month" },
  { label: "Total Users", value: "1,248", icon: Users, change: "+87 this month" },
  { label: "Active Cycles", value: "18", icon: RefreshCcw, change: "across 12 companies" },
  { label: "Monthly Revenue", value: "$12,450", icon: DollarSign, change: "+12% MoM" },
];

const recentCompanies = [
  { name: "Acme Corp", users: 45, activeCycles: 2, plan: "Enterprise", status: "active" as const },
  { name: "TechStart Inc", users: 18, activeCycles: 1, plan: "Pro", status: "active" as const },
  { name: "Global Services", users: 120, activeCycles: 3, plan: "Enterprise", status: "active" as const },
  { name: "Design Studio", users: 8, activeCycles: 0, plan: "Starter", status: "trial" as const },
  { name: "FinanceHub", users: 32, activeCycles: 1, plan: "Pro", status: "active" as const },
];

function getPlanBadgeVariant(plan: string): "info" | "default" | "outline" {
  if (plan === "Enterprise") return "info";
  if (plan === "Pro") return "default";
  return "outline";
}

export default function SuperAdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-title text-gray-900">Platform Overview</h1>
        <p className="text-body text-gray-500 mt-1">
          Perform360 platform analytics and management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-callout text-gray-500">{stat.label}</p>
                  <p className="text-title-small text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-[12px] text-gray-400 mt-1">{stat.change}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50">
                  <Icon size={20} strokeWidth={1.5} className="text-gray-400" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Companies */}
      <Card padding="sm">
        <CardHeader>
          <CardTitle>Recent Companies</CardTitle>
          <CardDescription>Latest tenant organizations on the platform</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Company
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Users
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Active Cycles
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Plan
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentCompanies.map((company) => (
                <tr
                  key={company.name}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-[14px] font-semibold text-gray-500">
                        {company.name[0]}
                      </div>
                      <span className="text-[14px] font-medium text-gray-900">
                        {company.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-gray-600">
                    {company.users}
                  </td>
                  <td className="px-4 py-3 text-[14px] text-gray-600">
                    {company.activeCycles}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getPlanBadgeVariant(company.plan)}>
                      {company.plan}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={company.status === "active" ? "success" : "warning"}
                    >
                      {company.status === "active" ? "Active" : "Trial"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
