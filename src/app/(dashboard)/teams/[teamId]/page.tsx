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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { UserPlus, MoreHorizontal, Mail, Trash2, AlertCircle, ArrowDown, ArrowUp, ArrowLeftRight, RotateCcw, ArrowRight, Archive, ArchiveRestore } from "lucide-react";

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
  archivedAt: string | null;
  members: TeamMember[];
}

const roleBadgeVariant: Record<string, "info" | "success" | "warning"> = {
  MANAGER: "info",
  MEMBER: "success",
  EXTERNAL: "warning",
};

const roleLabels: Record<string, string> = {
  MANAGER: "Manager",
  MEMBER: "Member",
  EXTERNAL: "External",
};

export default function TeamDetailPage() {
  const params = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userOptions, setUserOptions] = useState<ComboboxOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
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

  // Fetch users for combobox when dialog is open
  useEffect(() => {
    if (!showAddDialog) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setUsersLoading(true);
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (userSearchQuery.trim()) params.set("search", userSearchQuery.trim());
        const res = await fetch(`/api/users?${params}`, { signal: controller.signal });
        const json = await res.json();
        if (json.success) {
          const existingIds = new Set(team?.members.map((m) => m.user.id) ?? []);
          setUserOptions(
            json.data.map((u: { id: string; name: string; email: string; avatar: string | null }) => ({
              value: u.id,
              label: u.name,
              sublabel: u.email,
              disabled: existingIds.has(u.id),
              disabledReason: "Already in team",
              icon: <Avatar name={u.name} src={u.avatar} size="sm" />,
            }))
          );
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          /* silently handle */
        }
      } finally {
        setUsersLoading(false);
      }
    }, userSearchQuery ? 300 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [showAddDialog, userSearchQuery, team?.members]);

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setAddLoading(true);
    try {
      const res = await fetch(`/api/teams/${params.teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, role: addRole }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to add member");

      addToast("Member added", "success");
      setShowAddDialog(false);
      setSelectedUserId(null);
      setUserSearchQuery("");
      setAddRole("MEMBER");
      fetchTeam();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to add member", "error");
    } finally {
      setAddLoading(false);
    }
  };

  const handleArchive = async (archived: boolean) => {
    try {
      const res = await fetch(`/api/teams/${params.teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update team");
      addToast(`Team ${archived ? "archived" : "restored"}`, "success");
      fetchTeam();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update team", "error");
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
  const externals = team.members.filter((m) => m.role === "EXTERNAL");

  // Downward: Manager → Member (each manager evaluates each member)
  const downwardCount = managers.length * members.length;
  // Upward: Member → Manager (each member evaluates each manager)
  const upwardCount = members.length * managers.length;
  // Lateral: Member → Member (each member evaluates every other member)
  const lateralCount = members.length * (members.length - 1);
  // Self: Everyone evaluates themselves (except External)
  const selfCount = managers.length + members.length;
  // External: Each external evaluates all managers + members
  const externalCount = externals.length * (managers.length + members.length);

  return (
    <div>
      <PageHeader title={team.name} description={team.description ?? ""}>
        {team.archivedAt ? (
          <Button variant="secondary" onClick={() => handleArchive(false)}>
            <ArchiveRestore size={16} strokeWidth={1.5} className="mr-1.5" />
            Unarchive
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => handleArchive(true)}>
              <Archive size={16} strokeWidth={1.5} className="mr-1.5" />
              Archive
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <UserPlus size={16} strokeWidth={1.5} className="mr-1.5" />
              Add Member
            </Button>
          </>
        )}
      </PageHeader>

      {team.archivedAt && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-6">
          <Archive size={16} strokeWidth={1.5} className="text-amber-600 shrink-0" />
          <p className="text-[13px] text-amber-700">This team is archived and hidden from the active teams list.</p>
        </div>
      )}

      {/* Evaluation Direction Stats */}
      <div className={`grid gap-3 mb-6 max-w-2xl ${externalCount > 0 ? "grid-cols-5" : "grid-cols-4"}`}>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
          <div className="p-2 rounded-xl bg-emerald-100">
            <ArrowDown size={18} strokeWidth={1.5} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-title-small text-emerald-700">{downwardCount}</p>
            <p className="text-[12px] font-medium text-emerald-600/70">Downward</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/50 px-4 py-3">
          <div className="p-2 rounded-xl bg-violet-100">
            <ArrowUp size={18} strokeWidth={1.5} className="text-violet-600" />
          </div>
          <div>
            <p className="text-title-small text-violet-700">{upwardCount}</p>
            <p className="text-[12px] font-medium text-violet-600/70">Upward</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3">
          <div className="p-2 rounded-xl bg-amber-100">
            <ArrowLeftRight size={18} strokeWidth={1.5} className="text-amber-600" />
          </div>
          <div>
            <p className="text-title-small text-amber-700">{lateralCount}</p>
            <p className="text-[12px] font-medium text-amber-600/70">Lateral</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3">
          <div className="p-2 rounded-xl bg-green-100">
            <RotateCcw size={18} strokeWidth={1.5} className="text-green-600" />
          </div>
          <div>
            <p className="text-title-small text-green-700">{selfCount}</p>
            <p className="text-[12px] font-medium text-green-600/70">Self</p>
          </div>
        </div>
        {externalCount > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3">
            <div className="p-2 rounded-xl bg-orange-100">
              <ArrowRight size={18} strokeWidth={1.5} className="text-orange-600" />
            </div>
            <div>
              <p className="text-title-small text-orange-700">{externalCount}</p>
              <p className="text-[12px] font-medium text-orange-600/70">External</p>
            </div>
          </div>
        )}
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
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setSelectedUserId(null);
            setUserSearchQuery("");
            setAddRole("MEMBER");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add an existing user to this team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Combobox
              id="member-select"
              label="Select Person"
              placeholder="Search by name or email..."
              value={selectedUserId}
              onChange={setSelectedUserId}
              options={userOptions}
              onSearchChange={setUserSearchQuery}
              loading={usersLoading}
              emptyMessage="No matching users found"
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
                  <SelectItem value="EXTERNAL">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button disabled={addLoading || !selectedUserId} onClick={handleAddMember}>
                {addLoading ? "Adding..." : "Add Member"}
              </Button>
              <Button variant="ghost" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
