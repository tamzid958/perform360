"use client";

import { useState, useCallback } from "react";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Building2, User, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLoading) return;
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName, adminName, adminEmail }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Setup failed. Please try again.");
          return;
        }

        // Redirect to login so the admin can sign in via magic link
        window.location.href = "/login";
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [companyName, adminName, adminEmail, isLoading]
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo className="h-12 w-auto" />
        </div>

        <div className="text-center">
          <h1 className="text-[11px] font-medium tracking-widest uppercase text-gray-900">
            Welcome to Performs360
          </h1>
          <p className="text-body text-gray-500 mt-2">
            Set up your organization to get started
          </p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="companyName"
              label="Organization name"
              type="text"
              placeholder="Acme Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoFocus
              startIcon={<Building2 size={16} strokeWidth={1.5} />}
            />

            <Input
              id="adminName"
              label="Admin name"
              type="text"
              placeholder="Jane Smith"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              required
              startIcon={<User size={16} strokeWidth={1.5} />}
            />

            <Input
              id="adminEmail"
              label="Admin email"
              type="email"
              placeholder="jane@acme.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              startIcon={<Mail size={16} strokeWidth={1.5} />}
            />

            {error && <InlineAlert>{error}</InlineAlert>}

            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Set Up Organization
                  <ArrowRight size={16} strokeWidth={2} />
                </>
              )}
            </Button>
          </form>

          <p className="text-[13px] text-gray-400 mt-5">
            This creates your organization and admin account.
            You&apos;ll set up encryption after your first sign-in.
          </p>
        </Card>
      </div>
    </div>
  );
}
