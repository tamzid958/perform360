"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
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
import { UserPlus, Search, MoreHorizontal, Shield, AlertCircle, Inbox, Trash2 } from "lucide-react";
import type { PaginationMeta } from "@/types/pagination";

interface TeamMembership {
  id: string;
  team: { id: string; name: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  teamMemberships: TeamMembership[];
}

const roleBadgeMap: Record<string, { variant: "info" | "success" | "warning" | "default"; label: string }> = {
  ADMIN: { variant: "info", label: "Admin" },
  HR: { variant: "success", label: "HR" },
  MANAGER: { variant: "warning", label: "Manager" },
  MEMBER: { variant: "default", label: "Member" },
};

export default function PeoplePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const { addToast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const res = await fetch(`/api/users?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load users");
      setUsers(json.data);
      setPagination(json.pagination);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load users";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, page, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers, searchQuery]);

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inviteName, email: inviteEmail, role: inviteRole }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to invite user");
      addToast("Invitation sent", "success");
      setShowInviteDialog(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("MEMBER");
      setPage(1);
      fetchUsers();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to invite user", "error");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update role");
      addToast(`${selectedUser.name} role updated to ${newRole}`, "success");
      setShowRoleDialog(false);
      setSelectedUser(null);
      setNewRole("");
      fetchUsers();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update role", "error");
    }
  };

  const handleDeactivate = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to deactivate user");
      addToast(`${user.name} deactivated`, "success");
      setPage(1);
      fetchUsers();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to deactivate user", "error");
    }
  };

  if (error && users.length === 0) {
    return (
      <div>
        <PageHeader title="People" description="Manage users in your organization">
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus size={16} strokeWidth={2} className="mr-1.5" />Invite User
          </Button>
        </PageHeader>
        <Card className="max-w-lg mx-auto mt-12 text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle size={32} strokeWidth={1.5} className="text-red-400" />
            <p className="text-[14px] text-gray-600">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchUsers}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

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
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <Card padding="sm">
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox size={32} strokeWidth={1.5} className="text-gray-300" />
          <p className="text-[14px] text-gray-500">
            {searchQuery ? "No users match your search" : "No users yet"}
          </p>
        </div>
      ) : (
        <Card padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">User</th>
                  <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Role</th>
                  <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Teams</th>
                  <th className="text-right text-[12px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => {
                  const badge = roleBadgeMap[user.role] ?? { variant: "default" as const, label: user.role };
                  return (
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
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[14px] text-gray-600">
                          {user.teamMemberships.length} teams
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                              <MoreHorizontal size={16} strokeWidth={1.5} className="text-gray-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                              setShowRoleDialog(true);
                            }}>
                              <Shield size={14} strokeWidth={1.5} className="mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeactivate(user)}
                            >
                              <Trash2 size={14} strokeWidth={1.5} className="mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagination && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              showing={users.length}
              noun="people"
              onPageChange={setPage}
              className="px-4 pb-3 border-t border-gray-100"
            />
          )}
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>Send an invitation to join your organization</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleInvite();
            }}
          >
            <Input
              id="invite-name"
              label="Full Name"
              placeholder="John Doe"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
            />
            <Input
              id="invite-email"
              label="Email Address"
              type="email"
              placeholder="john@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-gray-700">Role</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
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
              <Button type="submit" disabled={inviteLoading}>
                {inviteLoading ? "Sending..." : "Send Invitation"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleChangeRole();
            }}
          >
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-gray-700">Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
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
              <Button type="submit">Update Role</Button>
              <Button type="button" variant="ghost" onClick={() => setShowRoleDialog(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
