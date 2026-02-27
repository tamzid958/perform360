"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Building2,
  Users,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Company {
  id: string;
  name: string;
  slug: string;
  users: number;
  activeCycles: number;
  plan: string;
  status: "active" | "trial";
  createdAt: string;
}

const companies: Company[] = [
  {
    id: "1",
    name: "Acme Corp",
    slug: "acme-corp",
    users: 45,
    activeCycles: 2,
    plan: "Enterprise",
    status: "active",
    createdAt: "2025-06-15",
  },
  {
    id: "2",
    name: "TechStart Inc",
    slug: "techstart",
    users: 18,
    activeCycles: 1,
    plan: "Pro",
    status: "active",
    createdAt: "2025-08-22",
  },
  {
    id: "3",
    name: "Global Services",
    slug: "global-services",
    users: 120,
    activeCycles: 3,
    plan: "Enterprise",
    status: "active",
    createdAt: "2025-03-10",
  },
  {
    id: "4",
    name: "Design Studio",
    slug: "design-studio",
    users: 8,
    activeCycles: 0,
    plan: "Starter",
    status: "trial",
    createdAt: "2026-02-01",
  },
  {
    id: "5",
    name: "FinanceHub",
    slug: "financehub",
    users: 32,
    activeCycles: 1,
    plan: "Pro",
    status: "active",
    createdAt: "2025-11-05",
  },
  {
    id: "6",
    name: "HealthTech Labs",
    slug: "healthtech",
    users: 55,
    activeCycles: 2,
    plan: "Enterprise",
    status: "active",
    createdAt: "2025-04-18",
  },
];

function getPlanBadgeVariant(plan: string): "info" | "default" | "outline" {
  if (plan === "Enterprise") return "info";
  if (plan === "Pro") return "default";
  return "outline";
}

export default function CompaniesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-title text-gray-900">Companies</h1>
          <p className="text-body text-gray-500 mt-1">
            Manage tenant organizations
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus size={16} strokeWidth={2} className="mr-1.5" />
          Add Company
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search
          size={16}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all"
        />
      </div>

      {/* Table */}
      <Card padding="sm">
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
                  Cycles
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Plan
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Created
                </th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Building2
                          size={16}
                          strokeWidth={1.5}
                          className="text-gray-400"
                        />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-900">
                          {company.name}
                        </p>
                        <p className="text-[12px] text-gray-500">
                          {company.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users
                        size={14}
                        strokeWidth={1.5}
                        className="text-gray-400"
                      />
                      {company.users}
                    </div>
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
                      variant={
                        company.status === "active" ? "success" : "warning"
                      }
                    >
                      {company.status === "active" ? "Active" : "Trial"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500">
                    {new Date(company.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <MoreHorizontal
                            size={16}
                            strokeWidth={1.5}
                            className="text-gray-400"
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <ExternalLink
                            size={14}
                            strokeWidth={1.5}
                            className="mr-2"
                          />
                          Impersonate Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Suspend
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Company</DialogTitle>
            <DialogDescription>
              Manually onboard a new tenant organization
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4 mt-4">
            <Input
              id="company-name"
              label="Company Name"
              placeholder="Acme Corp"
              required
            />
            <Input
              id="company-slug"
              label="URL Slug"
              placeholder="acme-corp"
              required
            />
            <Input
              id="admin-email"
              label="Admin Email"
              type="email"
              placeholder="admin@company.com"
              required
            />
            <Input
              id="admin-name"
              label="Admin Name"
              placeholder="John Doe"
              required
            />
            <div className="flex gap-3 pt-2">
              <Button type="button">Create Company</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
