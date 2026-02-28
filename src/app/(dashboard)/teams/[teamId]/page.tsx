"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { UserPlus, MoreHorizontal, Mail, Trash2, AlertCircle } from "lucide-react";

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  user: { id: string; name: string; email: string; avatar: string | null; role: string };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  members: TeamMember[];
}

const roleBadgeVariant: Record<string, "info" | "success"> = {
  MANAGER: "info",
  MEMBER: "success",
};

const roleLabels: Record<string, string> = {
  MANAGER: "Manager",
  MEMBER: "Member",
};

export default function TeamDetailPage() {
  const params = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("MEMBER");
  const [addLoading, setAddLoading] = useState(false);
  const { addToast } = useToast();

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${params.teamId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load team");
      setTeam(json.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load team";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [params.teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleAddMember = async () => {
    if (!addEmail.trim()) return;
    setAddLoading(true);
    try {
      const usersRes = await fetch("/api/users");
      const usersJson = await usersRes.json();
      if (!usersJson.success) throw new Error("Failed to find users");

      const user = usersJson.data.find(
        (u: { email: string }) => u.email.toLowerCase() === addEmail.trim().toLowerCase()
      );
      if (!user) throw new Error("No user found with that email in your company");

      const res = await fetch(`/api/teams/${params.teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: addRole }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to add member");

      addToast("Member added", "success");
      setShowAddDialog(false);
      setAddEmail("");
      setAddRole("MEMBER");
      fetchTeam();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to add member", "error");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    try {
      const res = await fetch(`/api/teams/${params.teamId}/members/${userId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to remove member");
      addToast(`${name} removed from team`, "success");
      fetchTeam();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to remove member", "error");
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader title="Team" description="" />
        <Card className="max-w-lg mx-auto mt-12 text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle size={32} strokeWidth={1.5} className="text-red-400" />
            <p className="text-[14px] text-gray-600">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchTeam}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading || !team) {
    return (
      <div>
        <PageHeader title="" description="">
          <Skeleton className="h-9 w-32" />
        </PageHeader>
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-lg">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
        <Card>
          <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3 px-1">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  const managers = team.members.filter((m) => m.role === "MANAGER");
  const members = team.members.filter((m) => m.role === "MEMBER");

  // Downward: Manager → Member (each manager evaluates each member)
  const downwardCount = managers.length * members.length;
  // Upward: Member → Manager (each member evaluates each manager)
  const upwardCount = members.length * managers.length;
  // Lateral: Member → Member (each member evaluates every other member)
  const lateralCount = members.length * (members.length - 1);

  return (
    <div>
      <PageHeader title={team.name} description={team.description ?? ""}>
        <Button variant="secondary" onClick={() => setShowAddDialog(true)}>
          <UserPlus size={16} strokeWidth={1.5} className="mr-1.5" />
          Add Member
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl">
        <Card padding="sm" className="text-center">
          <p className="text-title-small text-brand-500">{downwardCount}</p>
          <p className="text-[12px] text-gray-500 mt-0.5">Downward</p>
          <p className="text-[11px] text-gray-400">Manager → Member</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-title-small text-amber-500">{upwardCount}</p>
          <p className="text-[12px] text-gray-500 mt-0.5">Upward</p>
          <p className="text-[11px] text-gray-400">Member → Manager</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-title-small text-green-600">{lateralCount}</p>
          <p className="text-[12px] text-gray-500 mt-0.5">Lateral</p>
          <p className="text-[11px] text-gray-400">Member → Member</p>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        {team.members.length === 0 ? (
          <p className="text-center text-[14px] text-gray-400 py-6">No members yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {team.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3 px-1">
                <div className="flex items-center gap-3">
                  <Avatar name={member.user.name} src={member.user.avatar} size="md" />
                  <div>
                    <p className="text-[14px] font-medium text-gray-900">{member.user.name}</p>
                    <p className="text-[12px] text-gray-500 flex items-center gap-1">
                      <Mail size={12} strokeWidth={1.5} />
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {roleLabels[member.role] && (
                    <Badge variant={roleBadgeVariant[member.role]}>
                      {roleLabels[member.role]}
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <MoreHorizontal size={16} strokeWidth={1.5} className="text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleRemoveMember(member.user.id, member.user.name)}
                      >
                        <Trash2 size={14} strokeWidth={1.5} className="mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add an existing user to this team</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddMember();
            }}
          >
            <Input
              id="member-email"
              label="Email Address"
              type="email"
              placeholder="member@company.com"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-gray-700">Team Role</label>
              <Select value={addRole} onValueChange={setAddRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={addLoading}>
                {addLoading ? "Adding..." : "Add Member"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
