import Link from "next/link";

export function CtaSection() {
  return (
    <section className="bg-gradient-to-br from-[#0071e3] to-[#004493] py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-display-small text-white">
          Ready to transform your performance reviews?
        </h2>

        <p className="text-[18px] text-white/70 mt-4">
          Get started in minutes. No credit card required.
        </p>

        <div className="mt-8">
          <Link
            href="/register"
            className="inline-flex items-center justify-center bg-white text-[#0071e3] hover:bg-gray-50 rounded-full px-8 py-3 text-[17px] font-medium transition-all duration-200"
          >
            Start Free
          </Link>
        </div>

        <p className="text-[13px] text-white/50 text-center mt-6">
          No credit card required &middot; Set up in under 5 minutes
        </p>
      </div>
    </section>
  );
}
