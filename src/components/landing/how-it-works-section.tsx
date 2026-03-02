import { Users, Zap, BarChart3 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Set Up Your Teams",
    description:
      "Create your team structure, add members, and define reporting relationships. Choose or build an evaluation template.",
    colorClass: "text-brand-500",
    bgClass: "bg-brand-50",
  },
  {
    number: "02",
    icon: Zap,
    title: "Launch an Evaluation Cycle",
    description:
      "Activate a cycle and every reviewer receives a unique, secure link via email. No accounts or passwords needed.",
    colorClass: "text-green-500",
    bgClass: "bg-green-50",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Get Actionable Insights",
    description:
      "View encrypted reports with radar charts, score breakdowns, and anonymized feedback grouped by relationship type.",
    colorClass: "text-purple-500",
    bgClass: "bg-purple-50",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white py-16 sm:py-28 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-brand-50 text-brand-500 text-[13px] font-medium px-4 py-1.5 border border-brand-500/10">
            How It Works
          </span>
          <h2 className="text-display-small text-gray-900 mt-6 text-center">
            Up and running in three steps
          </h2>
        </div>

        <div className="mt-20 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-14 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-brand-500/20 via-green-500/20 to-purple-500/20" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="text-center">
                  {/* Step circle */}
                  <div className="relative inline-flex">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto relative z-10 ${step.bgClass}`}
                    >
                      <Icon
                        size={24}
                        strokeWidth={1.5}
                        className={step.colorClass}
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <span
                      className={`text-[13px] font-bold tracking-wider ${step.colorClass}`}
                    >
                      STEP {step.number}
                    </span>
                  </div>

                  <h3 className="text-title-small text-gray-900 mt-3">
                    {step.title}
                  </h3>
                  <p className="text-body text-gray-500 mt-3 max-w-xs mx-auto leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
