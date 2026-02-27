"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Set Up Your Teams",
    description:
      "Create your team structure, add members, and define reporting relationships. Choose or build an evaluation template.",
  },
  {
    number: "02",
    title: "Launch an Evaluation Cycle",
    description:
      "Activate a cycle and every reviewer receives a unique, secure link via email. No accounts or passwords needed.",
  },
  {
    number: "03",
    title: "Get Actionable Insights",
    description:
      "View encrypted reports with radar charts, score breakdowns, and anonymized feedback grouped by relationship type.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[#f5f5f7] py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center">
          <span className="text-[13px] uppercase tracking-wider text-[#0071e3] font-medium">
            HOW IT WORKS
          </span>
          <h2 className="text-display-small text-gray-900 mt-4 text-center">
            Up and running in three steps
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
            >
              <span className="text-[64px] font-bold text-[#0071e3]/10 leading-none">
                {step.number}
              </span>
              <div className="w-12 h-0.5 bg-[#0071e3]/20 mt-4" />
              <h3 className="text-title-small text-gray-900 mt-4">
                {step.title}
              </h3>
              <p className="text-body text-gray-500 mt-3">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
