"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-md border-b border-gray-200/50"
          : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0071e3] to-[#004493] flex items-center justify-center">
            <span className="text-white text-[16px] font-bold leading-none">
              P
            </span>
          </div>
          <span className="text-headline text-gray-900">Perform360</span>
        </Link>

        {/* Center Nav Links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-[14px] text-gray-600 hover:text-gray-900 transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-[14px] text-gray-600 hover:text-gray-900 transition-colors"
          >
            How It Works
          </a>
          <a
            href="#security"
            className="text-[14px] text-gray-600 hover:text-gray-900 transition-colors"
          >
            Security
          </a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="primary" size="sm" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
