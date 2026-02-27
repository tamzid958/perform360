"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      // Trigger magic link flow
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/overview",
      });

      if (result?.error) {
        setError("Account created but failed to send verification email. Please sign in.");
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
        <h1 className="text-title text-gray-900">Create your organization</h1>
        <p className="text-body text-gray-500 mt-2">
          Start running 360-degree evaluations
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="companyName"
            label="Company name"
            type="text"
            placeholder="Acme Inc."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            autoFocus
          />
          <Input
            id="name"
            label="Your name"
            type="text"
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="email"
            label="Work email"
            type="email"
            placeholder="jane@acme.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && (
            <p className="text-[13px] text-red-500">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Account"}
          </Button>
        </form>
        <p className="text-center text-[13px] text-gray-400 mt-4">
          We&apos;ll send you a magic link to verify your email
        </p>
      </Card>

      <p className="text-center text-[14px] text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-[#0071e3] hover:text-[#0058b9] font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
