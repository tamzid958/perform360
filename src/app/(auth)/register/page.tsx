"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, Building2, Loader2, User, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const COOLDOWN_SECONDS = 60;

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const isDisabled = isLoading || cooldown > 0;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isDisabled) return;
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName, name, email }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 429) {
            setCooldown(COOLDOWN_SECONDS);
            setError("Too many attempts. Please wait before trying again.");
          } else {
            setError(data.error || "Registration failed. Please try again.");
          }
          return;
        }

        const result = await signIn("email", {
          email,
          redirect: false,
          callbackUrl: "/overview",
        });

        if (result?.error) {
          setError(
            "Account created but failed to send verification email. Please sign in."
          );
        } else {
          setCooldown(COOLDOWN_SECONDS);
          window.location.href = "/verify";
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [companyName, name, email, isDisabled]
  );


  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Mobile-only logo */}
      <div className="flex items-center justify-center gap-3 lg:hidden">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <span className="text-white text-[18px] font-bold">P</span>
        </div>
        <span className="text-[20px] font-semibold tracking-tight text-gray-900">
          Perform360
        </span>
      </div>

      <div>
        <h1 className="text-title text-gray-900">Create your organization</h1>
        <p className="text-body text-gray-500 mt-2">
          Set up your workspace and start running evaluations
        </p>
      </div>

      <Card padding="lg" className="animate-fade-in-up delay-100">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Input
              id="companyName"
              label="Company name"
              type="text"
              placeholder="Acme Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoFocus
              className="pl-11"
            />
            <Building2
              size={16}
              strokeWidth={1.5}
              className="absolute left-4 top-[34px] text-gray-400 pointer-events-none"
            />
          </div>

          <div className="relative">
            <Input
              id="name"
              label="Your name"
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="pl-11"
            />
            <User
              size={16}
              strokeWidth={1.5}
              className="absolute left-4 top-[34px] text-gray-400 pointer-events-none"
            />
          </div>

          <div className="relative">
            <Input
              id="email"
              label="Work email"
              type="email"
              placeholder="jane@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-11"
            />
            <Mail
              size={16}
              strokeWidth={1.5}
              className="absolute left-4 top-[34px] text-gray-400 pointer-events-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-[13px] text-red-600">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={isDisabled}>
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating account...
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock size={16} strokeWidth={2} />
                Retry in {cooldown}s
              </>
            ) : (
              <>
                Create Account
                <ArrowRight size={16} strokeWidth={2} />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-[13px] text-gray-400 mt-5">
          By creating an account, you agree to our{" "}
          <Link
            href="/privacy"
            className="text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
          >
            Privacy Policy
          </Link>
        </p>
      </Card>

      <p className="text-center text-[14px] text-gray-500 animate-fade-in-up delay-200">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#0071e3] hover:text-[#0058b9] font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
