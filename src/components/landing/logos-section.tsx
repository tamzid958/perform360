import { Lock, CreditCard, Download, Users } from "lucide-react";

const stats = [
  {
    icon: CreditCard,
    label: "Free Forever",
    description: "No credit card required",
  },
  {
    icon: Lock,
    label: "AES-256 Encrypted",
    description: "End-to-end protection",
  },
  {
    icon: Download,
    label: "One-Click Export",
    description: "Zero vendor lock-in",
  },
  {
    icon: Users,
    label: "Teams of 5 to 5,000",
    description: "Built to scale with you",
  },
];

export function LogosSection() {
  return (
    <section className="bg-white py-12 sm:py-14 border-y border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} strokeWidth={1.5} className="text-brand-500" />
                </div>
                <p className="text-headline text-gray-900">{stat.label}</p>
                <p className="text-caption text-gray-500 mt-1">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
