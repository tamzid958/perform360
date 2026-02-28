import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="pt-32 pb-24 relative overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,113,227,0.1), transparent)",
        }}
      />

      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#eff6ff] text-[#0071e3] text-[13px] font-medium px-4 py-1.5 border border-[#0071e3]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
            360-Degree Performance Evaluation
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-display text-gray-900 text-center mt-8 animate-fade-in-up delay-100">
          Performance reviews that{" "}
          <span className="text-gradient-brand">actually</span> improve
          performance.
        </h1>

        {/* Subtitle */}
        <p className="text-[18px] text-gray-500 text-center max-w-2xl mx-auto mt-6 leading-relaxed animate-fade-in-up delay-200">
          Run 360-degree evaluation cycles with feedback from managers, peers,
          and direct reports. End-to-end encrypted. Beautifully simple.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 mt-10 animate-fade-in-up delay-300">
          <Button size="lg" asChild>
            <Link href="/register">Get Started Free</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <a href="#how-it-works">See How It Works</a>
          </Button>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-5xl mx-auto mt-20 relative animate-fade-in-up delay-500">
          {/* Glow behind image */}
          <div className="absolute -inset-4 bg-gradient-to-b from-[#0071e3]/10 via-[#0071e3]/5 to-transparent rounded-3xl blur-2xl -z-10" />

          <div className="rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-gray-200/60 overflow-hidden bg-white ring-1 ring-black/[0.03]">
            <Image
              src="/image.png"
              alt="Perform360 Dashboard"
              width={1200}
              height={750}
              className="w-full h-auto"
              priority
            />
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
