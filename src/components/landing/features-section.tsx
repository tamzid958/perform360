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
    title: "Complete Performance Picture",
    description:
      "See how every team member is perceived across the organization. Collect 360-degree feedback from managers, peers, and direct reports in one unified cycle.",
    iconClass: "text-brand-500",
    bgClass: "bg-brand-50",
  },
  {
    icon: Users,
    title: "Set It and Forget It",
    description:
      "Stop mapping reviewers in spreadsheets. Auto-generate evaluation assignments from your org chart and reporting relationships.",
    iconClass: "text-green-500",
    bgClass: "bg-green-50",
  },
  {
    icon: FileText,
    title: "Your Questions, Your Way",
    description:
      "Build custom evaluation templates with rating scales, open-text questions, and multiple choice. Tailor every cycle to what matters most.",
    iconClass: "text-amber-500",
    bgClass: "bg-amber-50",
  },
  {
    icon: Link2,
    title: "Zero Friction for Reviewers",
    description:
      "Reviewers click a secure link, verify with a one-time code, and start. No accounts, no passwords, no onboarding.",
    iconClass: "text-purple-500",
    bgClass: "bg-purple-50",
  },
  {
    icon: Shield,
    title: "Truly Private Feedback",
    description:
      "Evaluation data is encrypted with your company's own key using AES-256-GCM. Not even Performs360 can read your data.",
    iconClass: "text-red-500",
    bgClass: "bg-red-50",
  },
  {
    icon: BarChart3,
    title: "Actionable Insights, Instantly",
    description:
      "Radar charts, score breakdowns, and anonymized feedback summaries grouped by relationship type. Export as PDF anytime.",
    iconClass: "text-sky-500",
    bgClass: "bg-sky-50",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-gray-50 py-16 sm:py-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-brand-50 text-brand-500 text-[13px] font-medium px-4 py-1.5 border border-brand-500/10">
            Features
          </span>
          <h2 className="text-display-small text-gray-900 mt-6 text-center">
            Everything you need for
            <br />
            meaningful evaluations
          </h2>
          <p className="text-[16px] sm:text-[18px] text-gray-500 text-center mt-4 max-w-lg mx-auto">
            A free, end-to-end encrypted platform for running 360-degree
            performance reviews from start to finish.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-gray-200/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 ${feature.bgClass}`}
                >
                  <Icon
                    size={24}
                    strokeWidth={1.5}
                    className={feature.iconClass}
                  />
                </div>
                <h3 className="text-headline text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-body text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
