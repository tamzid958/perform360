"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("Acme Corp");
  const [companySlug, setCompanySlug] = useState("acme-corp");

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
            <form className="space-y-4">
              <Input
                id="company-name"
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                id="company-slug"
                label="URL Slug"
                value={companySlug}
                onChange={(e) => setCompanySlug(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-gray-700">Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-[24px] font-bold text-gray-300">A</div>
                  <Button variant="secondary" type="button" size="sm">Upload Logo</Button>
                </div>
              </div>
              <div className="pt-2">
                <Button type="button">Save Changes</Button>
              </div>
            </form>
          </Card>

          {/* Quick links to other settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-2xl">
            <Link href="/settings/roles">
              <Card className="hover:shadow-md transition-all cursor-pointer">
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Manage user roles and access levels</CardDescription>
              </Card>
            </Link>
            <Link href="/settings/encryption">
              <Card className="hover:shadow-md transition-all cursor-pointer">
                <CardTitle>Encryption</CardTitle>
                <CardDescription>Manage encryption passphrase and keys</CardDescription>
              </Card>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure when and how notifications are sent</CardDescription>
            </CardHeader>
            <div className="space-y-4">
              {[
                { label: "Evaluation invitations", description: "Notify reviewers when assigned a new evaluation" },
                { label: "Submission confirmations", description: "Confirm to reviewers when their submission is recorded" },
                { label: "Cycle reminders", description: "Automatic reminders for pending evaluations" },
                { label: "Cycle completion", description: "Notify admins when a cycle reaches 100% completion" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[14px] font-medium text-gray-700">{item.label}</p>
                    <p className="text-[12px] text-gray-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                  </label>
                </div>
              ))}
              <div className="pt-2">
                <Button type="button">Save Preferences</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
