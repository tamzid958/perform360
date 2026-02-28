"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/overview",
      });

      if (result?.error) {
        setError("Failed to send magic link. Please try again.");
      } else {
        window.location.href = "/verify";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

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

          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending link...
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
