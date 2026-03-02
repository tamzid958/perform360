"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
  { href: "/guide", label: "Guide" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || mobileOpen
          ? "bg-white/80 backdrop-blur-xl shadow-md border-b border-gray-200/50"
          : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <span className="text-white text-[16px] font-bold leading-none">
              P
            </span>
          </div>
          <span className="text-headline text-gray-900">Performs360</span>
        </Link>

        {/* Center Nav Links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-callout text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="primary" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/register">Get Started</Link>
          </Button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X size={20} strokeWidth={1.5} className="text-gray-600" />
            ) : (
              <Menu size={20} strokeWidth={1.5} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl animate-fade-in-up px-4 pb-4 pt-2">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-callout text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl px-4 py-2.5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
            <Button variant="ghost" size="sm" asChild className="flex-1">
              <Link href="/login" onClick={() => setMobileOpen(false)}>Login</Link>
            </Button>
            <Button variant="primary" size="sm" asChild className="flex-1">
              <Link href="/register" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
