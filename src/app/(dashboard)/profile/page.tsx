"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  companyName: string;
  teams: { id: string; name: string; role: string }[];
}

const ROLE_BADGE_VARIANT: Record<string, "info" | "success" | "warning" | "default"> = {
  ADMIN: "info",
  HR: "success",
  MEMBER: "default",
};

const TEAM_ROLE_LABELS: Record<string, string> = {
  MANAGER: "Manager",
  DIRECT_REPORT: "Direct Report",
  MEMBER: "Member",
  PEER: "Peer",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const { addToast } = useToast();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
        setName(json.data.name);
      } else {
        addToast("Failed to load profile", "error");
      }
    } catch {
      addToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!name.trim()) {
      addToast("Name cannot be empty", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save");
      setProfile((prev) => (prev ? { ...prev, name: json.data.name } : prev));
      addToast("Profile updated", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" description="Manage your personal information" />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your name and profile details</CardDescription>
            </CardHeader>

            {loading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-9 w-32" />
              </div>
            ) : profile ? (
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                {/* Avatar + role */}
                <div className="flex items-center gap-4">
                  <Avatar src={profile.avatar} name={profile.name} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-headline text-gray-900">{profile.name}</p>
                      <Badge variant={ROLE_BADGE_VARIANT[profile.role] ?? "default"}>
                        {profile.role}
                      </Badge>
                    </div>
                    <p className="text-callout text-gray-500">{profile.companyName}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <Input
                    id="profile-name"
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />

                  <Input
                    id="profile-email"
                    label="Email"
                    value={profile.email}
                    disabled
                    className="opacity-60"
                  />

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-gray-700">Avatar</label>
                    <div className="flex items-center gap-4">
                      <Avatar src={profile.avatar} name={name || profile.name} size="lg" />
                      <Button variant="secondary" type="button" size="sm">
                        Upload Photo
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={saving || name.trim() === profile.name}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            ) : null}
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Your Teams</CardTitle>
              <CardDescription>Teams you belong to and your role in each</CardDescription>
            </CardHeader>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : profile && profile.teams.length > 0 ? (
              <div className="space-y-2">
                {profile.teams.map((team) => (
                  <Link key={team.id} href={`/teams/${team.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Users size={16} strokeWidth={1.5} className="text-gray-500" />
                        </div>
                        <p className="text-[15px] font-medium text-gray-900">{team.name}</p>
                      </div>
                      <Badge variant="outline">
                        {TEAM_ROLE_LABELS[team.role] ?? team.role}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users size={32} strokeWidth={1.5} className="text-gray-300 mx-auto mb-3" />
                <p className="text-[15px] text-gray-500">You are not a member of any teams yet.</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
