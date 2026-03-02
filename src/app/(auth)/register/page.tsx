"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight, Building2, Loader2, User, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { executeRecaptcha } from "@/lib/recaptcha-client";

const COOLDOWN_SECONDS = 60;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

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
        const recaptchaToken = await executeRecaptcha("register");

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName, name, email, recaptchaToken }),
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
        <h1 className="text-title text-gray-900">Create your organization</h1>
        <p className="text-body text-gray-500 mt-2">
          Set up your workspace and start running evaluations
        </p>
      </div>

      <Card padding="lg" className="animate-fade-in-up delay-100">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="companyName"
            label="Company name"
            type="text"
            placeholder="Acme Inc."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            autoFocus
            startIcon={<Building2 size={16} strokeWidth={1.5} />}
          />

          <Input
            id="name"
            label="Your name"
            type="text"
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            startIcon={<User size={16} strokeWidth={1.5} />}
          />

          <Input
            id="email"
            label="Work email"
            type="email"
            placeholder="jane@acme.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            startIcon={<Mail size={16} strokeWidth={1.5} />}
          />

          {error && <InlineAlert>{error}</InlineAlert>}

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
            href="/terms"
            className="text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
          >
            Privacy Policy
          </Link>
        </p>
      </Card>

      <p className="text-center text-callout text-gray-500 animate-fade-in-up delay-200">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-brand-500 hover:text-brand-600 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
