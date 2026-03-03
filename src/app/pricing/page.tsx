import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Lock, Users, FileText, BarChart3, Download, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "Pricing — Free 360° Performance Reviews",
  description:
    "Performs360 is free forever. Run unlimited 360-degree performance review cycles with end-to-end encryption. No credit card required.",
  alternates: { canonical: "/pricing" },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://performs360.com" },
    { "@type": "ListItem", position: 2, name: "Pricing", item: "https://performs360.com/pricing" },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is Performs360 really free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Performs360 is free forever with no feature restrictions, no usage limits, and no credit card required. Every feature available to enterprise customers (except SSO/SAML) is included in the free plan.",
      },
    },
    {
      "@type": "Question",
      name: "How do you make money?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We plan to offer an Enterprise tier for organizations that need SSO/SAML, dedicated support, and custom SLAs. The core product will remain free.",
      },
    },
    {
      "@type": "Question",
      name: "Can I export my data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. You can export all your company data in a readable format at any time with one click. There is zero vendor lock-in.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All evaluation data is encrypted end-to-end using AES-256-GCM with keys derived from your company's passphrase via Argon2id. Even Performs360 cannot read your data.",
      },
    },
  ],
};

const freeFeatures = [
  "Unlimited evaluation cycles",
  "Unlimited team members",
  "End-to-end encryption (AES-256-GCM)",
  "Custom evaluation templates",
  "360-degree multi-rater feedback",
  "Auto-generated assignments",
  "Link-based reviewer submissions",
  "PDF report export",
  "Radar charts and score breakdowns",
  "One-click company data export",
  "Passwordless authentication",
  "OTP-secured reviewer access",
];

const enterpriseFeatures = [
  "Everything in Free, plus:",
  "SSO / SAML integration",
  "Dedicated account manager",
  "Custom SLAs",
  "Priority onboarding",
  "Advanced audit logging",
  "Custom branding",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingNavbar />

      <main className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center rounded-full bg-brand-50 text-brand-500 text-[13px] font-medium px-4 py-1.5 border border-brand-500/10">
              Pricing
            </span>
            <h1 className="text-display-small text-gray-900 mt-6">
              Simple, transparent pricing
            </h1>
            <p className="text-[16px] sm:text-[18px] text-gray-500 mt-4">
              Performs360 is free forever. Every feature, every team size.
              No credit card, no trial expiration, no surprises.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free plan */}
            <div className="relative rounded-2xl border-2 border-brand-500 bg-white p-8 shadow-lg shadow-brand-500/10">
              <div className="absolute -top-3 left-8">
                <span className="bg-brand-500 text-white text-[12px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                  Current Plan
                </span>
              </div>

              <div className="mt-2">
                <h2 className="text-title text-gray-900">Free</h2>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-[48px] font-bold tracking-tight text-gray-900">
                    $0
                  </span>
                  <span className="text-body text-gray-500">/ month</span>
                </div>
                <p className="text-[14px] text-gray-500 mt-2">
                  Everything you need. Free forever.
                </p>
              </div>

              <Button size="lg" className="w-full mt-8" asChild>
                <Link href="/register" className="gap-2">
                  Get Started Free
                  <ArrowRight size={16} strokeWidth={2} />
                </Link>
              </Button>

              <ul className="mt-8 space-y-3.5">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={2.5} className="text-green-500" />
                    </span>
                    <span className="text-[14px] text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Enterprise plan */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
              <div>
                <h2 className="text-title text-gray-900">Enterprise</h2>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-[48px] font-bold tracking-tight text-gray-300">
                    &mdash;
                  </span>
                </div>
                <p className="text-[14px] text-gray-500 mt-2">
                  Coming soon for organizations with advanced requirements.
                </p>
              </div>

              <Button
                variant="secondary"
                size="lg"
                className="w-full mt-8"
                asChild
              >
                <a href="mailto:support@performs360.com" className="gap-2">
                  Contact Us
                  <ArrowRight size={16} strokeWidth={2} />
                </a>
              </Button>

              <ul className="mt-8 space-y-3.5">
                {enterpriseFeatures.map((feature, i) => (
                  <li key={feature} className="flex items-start gap-3">
                    {i === 0 ? (
                      <span className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={12} strokeWidth={2.5} className="text-gray-400" />
                      </span>
                    )}
                    <span
                      className={`text-[14px] ${
                        i === 0
                          ? "font-medium text-gray-500"
                          : "text-gray-400"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-20 text-center">
            <h2 className="text-title text-gray-900">
              Everything included in the free plan
            </h2>
            <p className="text-body text-gray-500 mt-2 max-w-lg mx-auto">
              No feature gating. No usage limits. The full platform, free
              forever.
            </p>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Users, label: "Unlimited Teams" },
                { icon: Zap, label: "Unlimited Cycles" },
                { icon: FileText, label: "Custom Templates" },
                { icon: Lock, label: "E2E Encryption" },
                { icon: BarChart3, label: "PDF Reports" },
                { icon: Download, label: "Data Export" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto">
                      <Icon size={22} strokeWidth={1.5} className="text-brand-500" />
                    </div>
                    <p className="text-[13px] font-medium text-gray-600 mt-3">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FAQ-style section */}
          <div className="mt-20 max-w-2xl mx-auto">
            <h2 className="text-title text-gray-900 text-center">
              Frequently asked questions
            </h2>

            <div className="mt-10 space-y-8">
              <div>
                <h3 className="text-headline text-gray-900">
                  Is Performs360 really free?
                </h3>
                <p className="text-body text-gray-500 mt-2 leading-relaxed">
                  Yes. Performs360 is free forever with no feature restrictions,
                  no usage limits, and no credit card required. Every feature
                  available to enterprise customers (except SSO/SAML) is
                  included in the free plan.
                </p>
              </div>

              <div>
                <h3 className="text-headline text-gray-900">
                  How do you make money?
                </h3>
                <p className="text-body text-gray-500 mt-2 leading-relaxed">
                  We plan to offer an Enterprise tier for organizations that
                  need SSO/SAML, dedicated support, and custom SLAs. The core
                  product will remain free.
                </p>
              </div>

              <div>
                <h3 className="text-headline text-gray-900">
                  Can I export my data?
                </h3>
                <p className="text-body text-gray-500 mt-2 leading-relaxed">
                  Absolutely. You can export all your company data in a readable
                  format at any time with one click. There is zero vendor
                  lock-in.
                </p>
              </div>

              <div>
                <h3 className="text-headline text-gray-900">
                  Is my data secure?
                </h3>
                <p className="text-body text-gray-500 mt-2 leading-relaxed">
                  All evaluation data is encrypted end-to-end using AES-256-GCM
                  with keys derived from your company&apos;s passphrase via Argon2id.
                  Even Performs360 cannot read your data. Read our{" "}
                  <Link
                    href="/security-policy"
                    className="text-brand-500 hover:text-brand-600 underline underline-offset-2"
                  >
                    security policy
                  </Link>{" "}
                  for full details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
