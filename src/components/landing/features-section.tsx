"use client";

import { motion } from "framer-motion";
import {
  RefreshCcw,
  Users,
  FileText,
  Link2,
  Shield,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: RefreshCcw,
    title: "360-Degree Feedback",
    description:
      "Collect feedback from managers, peers, and direct reports in one unified evaluation cycle.",
  },
  {
    icon: Users,
    title: "Smart Assignments",
    description:
      "Auto-generate evaluation assignments based on your team structure and reporting relationships.",
  },
  {
    icon: FileText,
    title: "Template Builder",
    description:
      "Build custom evaluation forms with rating scales, open text, multiple choice, and competency matrices.",
  },
  {
    icon: Link2,
    title: "Link-Based Submissions",
    description:
      "Reviewers submit via unique tokenized links with OTP verification. No accounts needed.",
  },
  {
    icon: Shield,
    title: "End-to-End Encryption",
    description:
      "Evaluation data encrypted with your company's key. Even the platform operator can't read it.",
  },
  {
    icon: BarChart3,
    title: "Insightful Reports",
    description:
      "Radar charts, score breakdowns, and anonymized feedback summaries at a glance.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <span className="text-[13px] uppercase tracking-wider text-[#0071e3] font-medium">
            FEATURES
          </span>
          <h2 className="text-display-small text-gray-900 mt-4 text-center">
            Everything you need for meaningful evaluations
          </h2>
          <p className="text-[18px] text-gray-500 text-center mt-4">
            A complete platform for running 360-degree performance reviews.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
                className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center mb-5">
                  <Icon
                    size={24}
                    strokeWidth={1.5}
                    className="text-[#0071e3]"
                  />
                </div>
                <h3 className="text-headline text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-body text-gray-500">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
