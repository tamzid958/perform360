import Link from "next/link";
import { Mail } from "lucide-react";

const productLinks = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#security", label: "Security" },
  { href: "/guide", label: "Guide" },
  { href: "/blog", label: "Blog" },
];

const companyLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/security-policy", label: "Security Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-[15px] font-bold text-white">P</span>
              </div>
              <span className="text-headline text-white">Performs360</span>
            </Link>
            <p className="text-[14px] text-gray-400 mt-4 leading-relaxed max-w-xs">
              Free 360-degree performance review platform with end-to-end
              encryption. Your data, your keys.
            </p>
            <a
              href="mailto:support@performs360.com"
              className="inline-flex items-center gap-2 text-[14px] text-gray-400 hover:text-white transition-colors mt-4"
            >
              <Mail size={14} strokeWidth={1.5} />
              support@performs360.com
            </a>
          </div>

          {/* Product column */}
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Product
            </p>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Legal
            </p>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Started column */}
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Get Started
            </p>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/register"
                  className="text-[14px] text-gray-400 hover:text-white transition-colors"
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-[14px] text-gray-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[13px] text-gray-500">
            &copy; {new Date().getFullYear()} Performs360. All rights reserved.
          </p>
          <p className="text-[13px] text-gray-600">
            Free forever. End-to-end encrypted.
          </p>
        </div>
      </div>
    </footer>
  );
}
