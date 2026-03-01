"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { executeRecaptcha } from "@/lib/recaptcha-client";

const COOLDOWN_SECONDS = 60;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function LoginPage() {
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
        const recaptchaToken = await executeRecaptcha("login");

        const res = await fetch("/api/auth/verify-and-signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, recaptchaToken }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 429) {
            setError("Too many attempts. Please wait before trying again.");
            setCooldown(COOLDOWN_SECONDS);
          } else {
            setError(data.error || "No account found with this email. Please check or register.");
          }
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
    [email, isDisabled]
  );


  return (
    <div className="space-y-8 animate-fade-in-up">
      {RECAPTCHA_SITE_KEY && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
      )}
      {/* Mobile-only logo */}
      <div className="flex items-center justify-center gap-3 lg:hidden">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <span className="text-white text-[18px] font-bold">P</span>
        </div>
        <span className="text-[20px] font-semibold tracking-tight text-gray-900">
          Performs360
        </span>
      </div>

      <div className="text-center lg:text-left">
        <h1 className="text-title text-gray-900">Welcome back</h1>
        <p className="text-body text-gray-500 mt-2">
          Sign in to your account to continue
        </p>
      </div>

      <Card padding="lg" className="animate-fade-in-up delay-100">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="email"
            label="Email address"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-[13px] text-red-600">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={isDisabled}>
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending link...
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock size={16} strokeWidth={2} />
                Retry in {cooldown}s
              </>
            ) : (
              <>
                Continue with Email
                <ArrowRight size={16} strokeWidth={2} />
              </>
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-[12px]">
            <span className="bg-white px-3 text-gray-400">
              passwordless sign-in via magic link
            </span>
          </div>
        </div>

        <p className="text-center text-[13px] text-gray-400">
          A secure link will be sent to your email.
          <br />
          No password needed.
        </p>
      </Card>

      <p className="text-center text-[14px] text-gray-500 animate-fade-in-up delay-200">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-[#0071e3] hover:text-[#0058b9] font-medium transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
