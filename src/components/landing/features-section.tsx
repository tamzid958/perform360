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
    color: "#0071e3",
    bgColor: "#eff6ff",
  },
  {
    icon: Users,
    title: "Smart Assignments",
    description:
      "Auto-generate evaluation assignments based on your team structure and reporting relationships.",
    color: "#34c759",
    bgColor: "#f0fdf4",
  },
  {
    icon: FileText,
    title: "Template Builder",
    description:
      "Build custom evaluation forms with rating scales, open text, and multiple choice questions.",
    color: "#ff9f0a",
    bgColor: "#fffbeb",
  },
  {
    icon: Link2,
    title: "Link-Based Submissions",
    description:
      "Reviewers submit via unique tokenized links with OTP verification. No accounts needed.",
    color: "#af52de",
    bgColor: "#faf5ff",
  },
  {
    icon: Shield,
    title: "End-to-End Encryption",
    description:
      "Evaluation data encrypted with your company's key. Even the platform operator can't read it.",
    color: "#ff3b30",
    bgColor: "#fef2f2",
  },
  {
    icon: BarChart3,
    title: "Insightful Reports",
    description:
      "Radar charts, score breakdowns, and anonymized feedback summaries at a glance.",
    color: "#5ac8fa",
    bgColor: "#eff6ff",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[#fafafa] py-16 sm:py-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-[#eff6ff] text-[#0071e3] text-[13px] font-medium px-4 py-1.5 border border-[#0071e3]/10">
            Features
          </span>
          <h2 className="text-display-small text-gray-900 mt-6 text-center">
            Everything you need for
            <br />
            meaningful evaluations
          </h2>
          <p className="text-[16px] sm:text-[18px] text-gray-500 text-center mt-4 max-w-lg mx-auto">
            A complete platform for running 360-degree performance reviews.
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
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: feature.bgColor }}
                >
                  <Icon
                    size={24}
                    strokeWidth={1.5}
                    style={{ color: feature.color }}
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
