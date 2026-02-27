"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section
      className="pt-32 pb-20 relative"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,113,227,0.08), transparent)",
      }}
    >
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0 }}
        >
          <span className="inline-flex items-center rounded-full bg-[#eff6ff] text-[#0071e3] text-[13px] font-medium px-4 py-1.5">
            360-Degree Performance Evaluation
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-display text-gray-900 text-center mt-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Performance reviews that{" "}
          <span className="text-gradient-brand">actually</span> improve
          performance.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-[18px] text-gray-500 text-center max-w-2xl mx-auto mt-6 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Run 360-degree evaluation cycles with feedback from managers, peers,
          and direct reports. End-to-end encrypted. Beautifully simple.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex items-center justify-center gap-4 mt-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Button size="lg" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <a href="#features">Learn More</a>
          </Button>
        </motion.div>

        {/* Dashboard Preview Mockup */}
        <motion.div
          className="max-w-5xl mx-auto mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <div className="rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden bg-white">
            {/* Mock Browser Top Bar */}
            <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <div className="flex-1 flex justify-center">
                <div className="w-48 h-5 rounded-md bg-gray-100" />
              </div>
              <div className="w-9" />
            </div>

            {/* Mock Dashboard Content */}
            <div className="p-6">
              {/* Mock Sidebar + Main Area */}
              <div className="flex gap-5">
                {/* Mini Sidebar */}
                <div className="hidden sm:flex flex-col gap-3 w-40 shrink-0">
                  <div className="h-7 w-28 rounded-md bg-gray-100" />
                  <div className="h-5 w-24 rounded-md bg-[#eff6ff]" />
                  <div className="h-5 w-20 rounded-md bg-gray-50" />
                  <div className="h-5 w-24 rounded-md bg-gray-50" />
                  <div className="h-5 w-16 rounded-md bg-gray-50" />
                  <div className="mt-auto h-5 w-20 rounded-md bg-gray-50" />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                  {/* Page Title */}
                  <div className="h-6 w-32 rounded-md bg-gray-100 mb-5" />

                  {/* Stat Cards Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <div className="h-3 w-16 rounded bg-gray-200 mb-2.5" />
                      <div className="h-6 w-10 rounded bg-[#0071e3]/15" />
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <div className="h-3 w-14 rounded bg-gray-200 mb-2.5" />
                      <div className="h-6 w-8 rounded bg-[#34c759]/15" />
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <div className="h-3 w-20 rounded bg-gray-200 mb-2.5" />
                      <div className="h-6 w-12 rounded bg-[#ff9f0a]/15" />
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <div className="h-3 w-16 rounded bg-gray-200 mb-2.5" />
                      <div className="h-6 w-10 rounded bg-[#5ac8fa]/15" />
                    </div>
                  </div>

                  {/* Progress / Chart Area */}
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">
                    <div className="h-4 w-28 rounded bg-gray-200 mb-4" />
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-20 rounded bg-gray-200 shrink-0" />
                        <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full w-[85%] rounded-full bg-[#0071e3]/30" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-20 rounded bg-gray-200 shrink-0" />
                        <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full w-[62%] rounded-full bg-[#34c759]/30" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-20 rounded bg-gray-200 shrink-0" />
                        <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full w-[45%] rounded-full bg-[#ff9f0a]/30" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
