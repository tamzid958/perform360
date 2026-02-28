import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="relative py-28 px-6 overflow-hidden isolate">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0071e3] via-[#004493] to-[#002a5c]" />

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

        <p className="text-[18px] text-white/60 mt-6">
          Get started in minutes. No credit card required.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2 bg-white text-[#0071e3] hover:bg-gray-50 rounded-full px-8 py-3.5 text-[17px] font-medium transition-all duration-200"
          >
            Start Free
            <ArrowRight size={18} strokeWidth={1.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center text-white/70 hover:text-white rounded-full px-8 py-3.5 text-[17px] font-medium transition-all duration-200 border border-white/20 hover:border-white/40"
          >
            Learn More
          </a>
        </div>

        <p className="text-[13px] text-white/40 text-center mt-8">
          No credit card required &middot; End-to-end encrypted &middot; Export your data anytime &middot; No vendor lock-in
        </p>
      </div>
    </section>
  );
}
