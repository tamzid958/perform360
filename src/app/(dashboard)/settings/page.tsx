"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";

interface NotificationSettings {
  evaluationInvitations: boolean;
  cycleCompletion: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  evaluationInvitations: true,
  cycleCompletion: true,
};

interface CompanySettings {
  notifications?: NotificationSettings;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  settings: CompanySettings | null;
}

const NOTIFICATION_ITEMS: { key: keyof NotificationSettings; label: string; description: string }[] = [
  { key: "evaluationInvitations", label: "Evaluation invitations", description: "Notify reviewers when assigned a new evaluation" },
  { key: "cycleCompletion", label: "Cycle completion", description: "Notify admins when a cycle reaches 100% completion" },
];

export default function SettingsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [exportingData, setExportingData] = useState(false);
  const [showDestroyDialog, setShowDestroyDialog] = useState(false);
  const [destroyPassphrase, setDestroyPassphrase] = useState("");
  const [destroyConfirmName, setDestroyConfirmName] = useState("");
  const [destroyExportFirst, setDestroyExportFirst] = useState(true);
  const [destroying, setDestroying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/company");
      const json = await res.json();
      if (json.success) {
        setCompany(json.data);
        setCompanyName(json.data.name);
        setCompanySlug(json.data.slug);
        const saved = json.data.settings?.notifications;
        setNotifications(saved ? { ...DEFAULT_NOTIFICATIONS, ...saved } : DEFAULT_NOTIFICATIONS);
      }
    } catch {
      addToast("Failed to load company settings", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const validateSlug = (value: string): boolean => {
    if (value.length < 2) {
      setSlugError("Slug must be at least 2 characters");
      return false;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      setSlugError("Only lowercase letters, numbers, and hyphens allowed");
      return false;
    }
    setSlugError("");
    return true;
  };

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setCompanySlug(sanitized);
    if (sanitized) validateSlug(sanitized);
    else setSlugError("");
  };

  const handleSaveProfile = async () => {
    if (!companyName.trim()) {
      addToast("Company name is required", "error");
      return;
    }
    if (!validateSlug(companySlug)) return;

    setSavingProfile(true);
    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName.trim(), slug: companySlug }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save");
      setCompany(json.data);
      addToast("Company profile updated", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save settings", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (file.size > 1024 * 1024) {
      addToast("File must be under 1 MB", "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      addToast("File must be an image", "error");
      return;
    }
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/company/logo", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Upload failed");
      setCompany(json.data);
      addToast("Logo uploaded", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to upload logo", "error");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogoRemove = async () => {
    setUploadingLogo(true);
    try {
      const res = await fetch("/api/company/logo", { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to remove logo");
      setCompany(json.data);
      addToast("Logo removed", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to remove logo", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleToggleNotification = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { notifications } }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save");
      setCompany(json.data);
      addToast("Notification preferences saved", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save preferences", "error");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleDestroyCompany = async () => {
    if (!destroyPassphrase || !destroyConfirmName) {
      addToast("All fields are required", "error");
      return;
    }

    setDestroying(true);
    try {
      const res = await fetch("/api/company/destroy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passphrase: destroyPassphrase,
          confirmName: destroyConfirmName,
          exportBeforeDestroy: destroyExportFirst,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to destroy company");
      }

      addToast(
        "Company deletion initiated. You will be signed out shortly.",
        "success"
      );
      setShowDestroyDialog(false);

      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to destroy company",
        "error"
      );
    } finally {
      setDestroying(false);
    }
  };

  const handleExportData = async () => {
    if (!exportPassphrase) {
      addToast("Passphrase is required", "error");
      return;
    }

    setExportingData(true);
    try {
      const res = await fetch("/api/company/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: exportPassphrase }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to start data export");
      }

      addToast("Export started — check your email shortly", "success");
      setShowExportDialog(false);
      setExportPassphrase("");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to start data export", "error");
    } finally {
      setExportingData(false);
    }
  };

  const profileDirty =
    company !== null && (companyName !== company.name || companySlug !== company.slug);

  const notificationsDirty =
    company !== null &&
    NOTIFICATION_ITEMS.some(
      ({ key }) => notifications[key] !== (company.settings?.notifications?.[key] ?? true)
    );

  return (
    <div>
      <PageHeader title="Settings" description="Manage your organization settings" />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-9 w-32" />
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProfile();
                }}
              >
                <Input
                  id="company-name"
                  label="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  maxLength={100}
                />
                <div>
                  <Input
                    id="company-slug"
                    label="URL Slug"
                    value={companySlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    maxLength={50}
                  />
                  {slugError && (
                    <p className="mt-1 text-[12px] text-red-500">{slugError}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-gray-700">Logo</label>
                  <div className="flex items-center gap-4">
                    {company?.logo ? (
                      <Image
                        src={company.logo}
                        alt={`${companyName} logo`}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-2xl object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-[24px] font-bold text-gray-300">
                        {companyName.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      />
                      <Button
                        variant="secondary"
                        type="button"
                        size="sm"
                        disabled={uploadingLogo}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadingLogo ? "Uploading..." : company?.logo ? "Change Logo" : "Upload Logo"}
                      </Button>
                      {company?.logo && (
                        <Button
                          variant="ghost"
                          type="button"
                          size="sm"
                          disabled={uploadingLogo}
                          onClick={handleLogoRemove}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-[12px] text-gray-400">PNG, JPEG, WebP, or SVG. Max 1 MB.</p>
                </div>
                <div className="pt-2">
                  <Button type="submit" disabled={savingProfile || !profileDirty || !!slugError}>
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}
          </Card>

          {/* Quick links to other settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-2xl">
            <Link href="/settings/roles" className="h-full">
              <Card className="hover:shadow-md transition-all cursor-pointer h-full">
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Manage user roles and access levels</CardDescription>
              </Card>
            </Link>
            <Link href="/settings/encryption" className="h-full">
              <Card className="hover:shadow-md transition-all cursor-pointer h-full">
                <CardTitle>Encryption</CardTitle>
                <CardDescription>Manage encryption passphrase and keys</CardDescription>
              </Card>
            </Link>
          </div>

          <Card className="max-w-2xl mt-6 border-amber-200 bg-amber-50/40">
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>
                Export a full company data dump with decrypted evaluation responses.
                The export will be emailed to you as a JSON attachment.
              </CardDescription>
            </CardHeader>
            <div className="pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowExportDialog(true);
                  setExportPassphrase("");
                }}
              >
                Export Company Data
              </Button>
            </div>
          </Card>

          <Card className="max-w-2xl mt-6 border-red-200 bg-red-50/40">
            <CardHeader>
              <CardTitle className="text-red-700">Danger Zone</CardTitle>
              <CardDescription className="text-red-600/80">
                Permanently delete this company and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <div className="pt-2">
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setShowDestroyDialog(true);
                  setDestroyPassphrase("");
                  setDestroyConfirmName("");
                  setDestroyExportFirst(true);
                }}
              >
                Delete Company
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure when and how notifications are sent</CardDescription>
            </CardHeader>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40 rounded" />
                      <Skeleton className="h-3 w-64 rounded" />
                    </div>
                    <Skeleton className="h-6 w-10 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {NOTIFICATION_ITEMS.map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[14px] font-medium text-gray-700">{label}</p>
                      <p className="text-[12px] text-gray-500">{description}</p>
                    </div>
                    <Toggle
                      checked={notifications[key]}
                      onChange={() => handleToggleNotification(key)}
                    />
                  </div>
                ))}
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveNotifications}
                    disabled={savingNotifications || !notificationsDirty}
                  >
                    {savingNotifications ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

      </Tabs>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Company Data</DialogTitle>
            <DialogDescription>
              Enter your encryption passphrase to export all company data. The export will be emailed to you as a JSON file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              id="export-passphrase"
              label="Encryption Passphrase"
              type="password"
              placeholder="Enter passphrase"
              value={exportPassphrase}
              onChange={(e) => setExportPassphrase(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowExportDialog(false);
                  setExportPassphrase("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleExportData}
                disabled={!exportPassphrase || exportingData}
                className="flex-1"
              >
                {exportingData ? "Starting export..." : "Verify & Export"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDestroyDialog} onOpenChange={setShowDestroyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">
              Delete Company Permanently
            </DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <strong>{company?.name}</strong> and all associated data
              including users, teams, evaluation cycles, responses, and
              encryption keys. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-[13px] text-red-700">
                All users will be signed out immediately. Company data will be
                permanently erased.
              </p>
            </div>

            <div className="flex items-center gap-3 py-1">
              <Toggle
                checked={destroyExportFirst}
                onChange={setDestroyExportFirst}
              />
              <div>
                <p className="text-[14px] font-medium text-gray-700">
                  Export data before deletion
                </p>
                <p className="text-[12px] text-gray-500">
                  Receive a data export email before the company is deleted
                </p>
              </div>
            </div>

            <Input
              id="destroy-confirm-name"
              label={`Type "${company?.name}" to confirm`}
              placeholder={company?.name ?? "Company name"}
              value={destroyConfirmName}
              onChange={(e) => setDestroyConfirmName(e.target.value)}
            />

            <Input
              id="destroy-passphrase"
              label="Encryption Passphrase"
              type="password"
              placeholder="Enter passphrase"
              value={destroyPassphrase}
              onChange={(e) => setDestroyPassphrase(e.target.value)}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowDestroyDialog(false);
                  setDestroyPassphrase("");
                  setDestroyConfirmName("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDestroyCompany}
                disabled={
                  destroying ||
                  !destroyPassphrase ||
                  destroyConfirmName.trim().toLowerCase() !==
                    (company?.name ?? "").trim().toLowerCase()
                }
              >
                {destroying
                  ? "Deleting..."
                  : "Permanently Delete Company"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
