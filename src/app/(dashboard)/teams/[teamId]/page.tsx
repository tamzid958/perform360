"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, MoreHorizontal, Mail } from "lucide-react";

const teamData = {
  id: "1",
  name: "Engineering",
  description: "Core product development team",
  members: [
    { id: "1", name: "Alex Kim", email: "alex@company.com", avatar: null, role: "MEMBER" as const, teamRole: "MANAGER" as const },
    { id: "2", name: "Sarah Chen", email: "sarah@company.com", avatar: null, role: "MEMBER" as const, teamRole: "MANAGER" as const },
    { id: "3", name: "Mike Johnson", email: "mike@company.com", avatar: null, role: "MEMBER" as const, teamRole: "DIRECT_REPORT" as const },
    { id: "4", name: "Lisa Park", email: "lisa@company.com", avatar: null, role: "MEMBER" as const, teamRole: "DIRECT_REPORT" as const },
    { id: "5", name: "James Wilson", email: "james@company.com", avatar: null, role: "MEMBER" as const, teamRole: "DIRECT_REPORT" as const },
    { id: "6", name: "Emily Davis", email: "emily@company.com", avatar: null, role: "MEMBER" as const, teamRole: "MEMBER" as const },
  ],
};

const roleBadgeVariant: Record<string, "info" | "success"> = {
  MANAGER: "info",
  DIRECT_REPORT: "success",
};

const roleLabels: Record<string, string> = {
  MANAGER: "Manager",
  DIRECT_REPORT: "Direct Report",
};

export default function TeamDetailPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div>
      <PageHeader title={teamData.name} description={teamData.description}>
        <Button variant="secondary" onClick={() => setShowAddDialog(true)}>
          <UserPlus size={16} strokeWidth={1.5} className="mr-1.5" />
          Add Member
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 max-w-lg">
        <Card padding="sm" className="text-center">
          <p className="text-title-small text-gray-900">{teamData.members.length}</p>
          <p className="text-[12px] text-gray-500">Total</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-title-small text-brand-500">{teamData.members.filter((m) => m.teamRole === "MANAGER").length}</p>
          <p className="text-[12px] text-gray-500">Managers</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-title-small text-green-600">{teamData.members.filter((m) => m.teamRole === "DIRECT_REPORT").length}</p>
          <p className="text-[12px] text-gray-500">Reports</p>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <div className="divide-y divide-gray-100">
          {teamData.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-3 px-1">
              <div className="flex items-center gap-3">
                <Avatar name={member.name} src={member.avatar} size="md" />
                <div>
                  <p className="text-[14px] font-medium text-gray-900">{member.name}</p>
                  <p className="text-[12px] text-gray-500 flex items-center gap-1">
                    <Mail size={12} strokeWidth={1.5} />
                    {member.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {roleLabels[member.teamRole] && (
                  <Badge variant={roleBadgeVariant[member.teamRole]}>
                    {roleLabels[member.teamRole]}
                  </Badge>
                )}
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreHorizontal size={16} strokeWidth={1.5} className="text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add an existing user to this team</DialogDescription>
          </DialogHeader>
          <form className="space-y-4 mt-4">
            <Input
              id="member-email"
              label="Email Address"
              type="email"
              placeholder="member@company.com"
            />
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-gray-700">Team Role</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="DIRECT_REPORT">Direct Report</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button">Add Member</Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
