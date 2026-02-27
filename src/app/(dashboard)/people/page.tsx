"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UserPlus, Search, MoreHorizontal, Mail, Shield } from "lucide-react";

const users = [
  { id: "1", name: "Alex Kim", email: "alex@company.com", avatar: null, role: "ADMIN", teams: 2, status: "active" },
  { id: "2", name: "Sarah Chen", email: "sarah@company.com", avatar: null, role: "HR", teams: 1, status: "active" },
  { id: "3", name: "Mike Johnson", email: "mike@company.com", avatar: null, role: "MANAGER", teams: 3, status: "active" },
  { id: "4", name: "Lisa Park", email: "lisa@company.com", avatar: null, role: "MEMBER", teams: 2, status: "active" },
  { id: "5", name: "James Wilson", email: "james@company.com", avatar: null, role: "MEMBER", teams: 1, status: "active" },
  { id: "6", name: "Emily Davis", email: "emily@company.com", avatar: null, role: "MEMBER", teams: 2, status: "active" },
];

const roleBadgeMap: Record<string, { variant: "info" | "success" | "warning" | "default"; label: string }> = {
  ADMIN: { variant: "info", label: "Admin" },
  HR: { variant: "success", label: "HR" },
  MANAGER: { variant: "warning", label: "Manager" },
  MEMBER: { variant: "default", label: "Member" },
};

export default function PeoplePage() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="People" description="Manage users in your organization">
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus size={16} strokeWidth={2} className="mr-1.5" />
          Invite User
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search people..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        />
      </div>

      {/* Users Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Teams</th>
                <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} src={user.avatar} size="sm" />
                      <div>
                        <p className="text-[14px] font-medium text-gray-900">{user.name}</p>
                        <p className="text-[12px] text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleBadgeMap[user.role].variant}>
                      {roleBadgeMap[user.role].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[14px] text-gray-600">{user.teams} teams</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <MoreHorizontal size={16} strokeWidth={1.5} className="text-gray-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Shield size={14} strokeWidth={1.5} className="mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail size={14} strokeWidth={1.5} className="mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>Send an invitation to join your organization</DialogDescription>
          </DialogHeader>
          <form className="space-y-4 mt-4">
            <Input id="invite-name" label="Full Name" placeholder="John Doe" required />
            <Input id="invite-email" label="Email Address" type="email" placeholder="john@company.com" required />
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-gray-700">Role</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button">Send Invitation</Button>
              <Button type="button" variant="ghost" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
