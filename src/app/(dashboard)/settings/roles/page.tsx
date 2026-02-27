import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Shield, CheckCircle2, XCircle } from "lucide-react";

const roles = [
  {
    name: "Admin",
    description: "Full access to all company features including encryption management",
    permissions: ["Manage cycles", "Manage teams", "Manage templates", "View reports", "Export reports", "Manage people", "Manage settings", "Manage encryption"],
    restricted: [],
  },
  {
    name: "HR",
    description: "Full operational access without encryption and settings management",
    permissions: ["Manage cycles", "Manage teams", "Manage templates", "View reports", "Export reports", "Manage people"],
    restricted: ["Manage settings", "Manage encryption"],
  },
  {
    name: "Employee",
    description: "Can submit evaluations via link only",
    permissions: ["Submit evaluations (via link)"],
    restricted: ["View reports", "Manage cycles", "Manage teams", "Manage templates", "Manage people", "Manage settings"],
  },
  {
    name: "External",
    description: "External evaluators provide one-way feedback on team members",
    permissions: ["Submit evaluations (via link)"],
    restricted: ["View reports", "Manage cycles", "Manage teams", "Manage templates", "Manage people", "Manage settings", "Receive evaluations", "Self-assessment"],
  },
];

export default function RolesSettingsPage() {
  return (
    <div>
      <PageHeader title="Roles & Permissions" description="View role-based access control for your organization" />

      <div className="space-y-4 max-w-3xl">
        {roles.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div>
                  <Shield size={20} strokeWidth={1.5} className="text-gray-900" />
                </div>
                <div>
                  <CardTitle>{role.name}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {role.permissions.map((p) => (
                <div key={p} className="flex items-center gap-2 text-[13px]">
                  <CheckCircle2 size={14} strokeWidth={1.5} className="text-gray-900" />
                  <span className="text-gray-700">{p}</span>
                </div>
              ))}
              {role.restricted.map((p) => (
                <div key={p} className="flex items-center gap-2 text-[13px]">
                  <XCircle size={14} strokeWidth={1.5} className="text-gray-300" />
                  <span className="text-gray-400">{p}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
