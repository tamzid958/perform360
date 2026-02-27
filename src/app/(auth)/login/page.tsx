"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-[24px] font-bold">P</span>
        </div>
        <h1 className="text-title text-gray-900">Welcome back</h1>
        <p className="text-body text-gray-500 mt-2">Sign in to Perform360</p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <p className="text-[13px] text-red-500">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Continue with Email"}
          </Button>
        </form>
        <p className="text-center text-[13px] text-gray-400 mt-4">
          We&apos;ll send you a magic link to sign in
        </p>
      </Card>

      <p className="text-center text-[14px] text-gray-500">
        Don&apos;t have an account?{" "}
        <a href="/register" className="text-[#0071e3] hover:text-[#0058b9] font-medium">
          Create one
        </a>
      </p>
    </div>
  );
}
