import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Globe,
  ListChecks,
  HelpCircle,
  Building2,
  RefreshCcw,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const CUID_REGEX = /^c[a-z0-9]{20,28}$/;

interface Section {
  title: string;
  description?: string;
  questions: { text: string; type: string; required: boolean }[];
}

const QUESTION_TYPE_BADGE: Record<string, { label: string; variant: "info" | "default" | "success" | "warning" }> = {
  rating_scale: { label: "Rating Scale", variant: "info" },
  text: { label: "Text", variant: "default" },
  multiple_choice: { label: "Multiple Choice", variant: "success" },
  yes_no: { label: "Yes/No", variant: "warning" },
  competency_matrix: { label: "Competency Matrix", variant: "info" },
};

async function getTemplateAnalytics(templateId: string) {
  const [template, cycleTeams] = await Promise.all([
    prisma.evaluationTemplate.findFirst({
      where: { id: templateId, isGlobal: true, companyId: null },
    }),
    prisma.cycleTeam.findMany({
      where: { templateId },
      select: {
        cycle: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            companyId: true,
            company: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    }),
  ]);

  if (!template) return null;

  const sections = Array.isArray(template.sections)
    ? (template.sections as unknown as Section[])
    : [];

  const questionCount = sections.reduce(
    (acc, s) => acc + (s.questions?.length ?? 0),
    0
  );

  // Deduplicate cycles and companies
  const uniqueCycles = new Map<string, (typeof cycleTeams)[0]["cycle"]>();
  const uniqueCompanies = new Set<string>();
  for (const ct of cycleTeams) {
    if (!uniqueCycles.has(ct.cycle.id)) {
      uniqueCycles.set(ct.cycle.id, ct.cycle);
    }
    uniqueCompanies.add(ct.cycle.companyId);
  }

  return {
    template: {
      id: template.id,
      name: template.name,
      description: template.description,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    },
    sections,
    stats: {
      sectionCount: sections.length,
      questionCount,
      adoptedByCompanies: uniqueCompanies.size,
      usedInCycles: uniqueCycles.size,
    },
    cycles: Array.from(uniqueCycles.values()).map((c) => ({
      cycleId: c.id,
      cycleName: c.name,
      cycleStatus: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
      companyId: c.company.id,
      companyName: c.company.name,
    })),
  };
}

export default async function TemplateAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!CUID_REGEX.test(id)) notFound();

  const data = await getTemplateAnalytics(id);
  if (!data) notFound();

  const { template, sections, stats, cycles } = data;

  const statCards = [
    { label: "Sections", value: stats.sectionCount, icon: ListChecks, accent: "bg-blue-50 text-blue-500" },
    { label: "Questions", value: stats.questionCount, icon: HelpCircle, accent: "bg-purple-50 text-purple-500" },
    { label: "Companies Using", value: stats.adoptedByCompanies, icon: Building2, accent: "bg-amber-50 text-amber-500" },
    { label: "Cycles Using", value: stats.usedInCycles, icon: RefreshCcw, accent: "bg-green-50 text-green-500" },
  ];

  return (
    <div>
      {/* Back link */}
      <Link
        href="/superadmin/global-templates"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-500 hover:text-brand-600 transition-colors mb-6"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        Back to Global Templates
      </Link>

      {/* Template Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Globe size={24} strokeWidth={1.5} className="text-brand-500" />
          </div>
          <div>
            <h1 className="text-title text-gray-900">{template.name}</h1>
            {template.description && (
              <p className="text-body text-gray-500 mt-1">{template.description}</p>
            )}
            <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mt-1">
              <Calendar size={13} strokeWidth={1.5} />
              Created {formatDate(template.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="md" className="group hover:shadow-md transition-shadow duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-[28px] font-bold text-gray-900 tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.accent}`}>
                  <Icon size={20} strokeWidth={1.5} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — 2/3: Template Structure */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Template Structure</CardTitle>
              <CardDescription>{sections.length} sections, {stats.questionCount} questions</CardDescription>
            </CardHeader>
            {sections.length === 0 ? (
              <p className="text-[14px] text-gray-400 text-center py-6">No sections defined</p>
            ) : (
              <div className="space-y-6">
                {sections.map((section, sIdx) => (
                  <div key={sIdx}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500">
                        {sIdx + 1}
                      </div>
                      <h3 className="text-[15px] font-semibold text-gray-900">{section.title}</h3>
                    </div>
                    {section.description && (
                      <p className="text-[13px] text-gray-500 ml-8 mb-2">{section.description}</p>
                    )}
                    <div className="ml-8 space-y-2">
                      {section.questions?.map((q, qIdx) => {
                        const typeInfo = QUESTION_TYPE_BADGE[q.type] ?? { label: q.type, variant: "default" as const };
                        return (
                          <div
                            key={qIdx}
                            className="flex items-start justify-between py-2 px-3 rounded-xl bg-gray-50/60 border border-gray-100/50"
                          >
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className="text-[12px] text-gray-400 mt-0.5 shrink-0">
                                Q{qIdx + 1}
                              </span>
                              <p className="text-[13px] text-gray-700">{q.text}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-3 shrink-0">
                              <Badge variant={typeInfo.variant}>
                                {typeInfo.label}
                              </Badge>
                              {q.required && (
                                <span className="text-[11px] font-medium text-red-400">Required</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column — 1/3: Adoption */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Adoption</CardTitle>
              <CardDescription>Cycles using this template</CardDescription>
            </CardHeader>
            {cycles.length === 0 ? (
              <div className="text-center py-6">
                <RefreshCcw size={24} strokeWidth={1.5} className="text-gray-300 mx-auto mb-2" />
                <p className="text-[13px] text-gray-400">No cycles are using this template yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cycles.map((cycle) => (
                  <div key={cycle.cycleId} className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[14px] font-medium text-gray-900">{cycle.cycleName}</p>
                      <Badge
                        variant={
                          cycle.cycleStatus === "ACTIVE"
                            ? "success"
                            : cycle.cycleStatus === "CLOSED"
                              ? "info"
                              : cycle.cycleStatus === "ARCHIVED"
                                ? "outline"
                                : "default"
                        }
                      >
                        {cycle.cycleStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-gray-400">
                      <Link
                        href={`/superadmin/companies/${cycle.companyId}`}
                        className="hover:text-brand-500 transition-colors"
                      >
                        {cycle.companyName}
                      </Link>
                      <span>&middot;</span>
                      <span>{formatDate(cycle.startDate)} &mdash; {formatDate(cycle.endDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
