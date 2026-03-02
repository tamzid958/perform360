import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative py-16 sm:py-28 px-4 sm:px-6 overflow-hidden isolate">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-brand-700 to-gray-900" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <h2 className="text-display-small text-white">
          Ready to transform your
          <br />
          performance reviews?
        </h2>

        <p className="text-[18px] text-white/70 mt-6">
          Get started in minutes. Free forever — no credit card required.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild className="bg-white text-brand-500 hover:bg-gray-50">
            <Link href="/register" className="group gap-2">
              Start Free
              <ArrowRight size={18} strokeWidth={1.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button variant="ghost" size="lg" asChild className="text-white/70 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/40">
            <Link href="#features">
              Learn More
            </Link>
          </Button>
        </div>

        <p className="text-[13px] text-white/60 text-center mt-8">
          Free forever &middot; End-to-end encrypted &middot; Export your data anytime &middot; No vendor lock-in
        </p>
      </div>
    </section>
  );
}
