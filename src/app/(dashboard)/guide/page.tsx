"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import {
  Users,
  ChevronDown,
  ChevronRight,
  Building2,
  UserCircle,
  Briefcase,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  Info,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Hierarchy Node Component ───

interface OrgNode {
  title: string;
  role?: string;
  badge?: { label: string; variant: "success" | "warning" | "info" | "default" | "outline" };
  children?: OrgNode[];
}

function OrgTree({ nodes, depth = 0 }: { nodes: OrgNode[]; depth?: number }) {
  return (
    <div className={cn("space-y-1", depth > 0 && "ml-6 border-l border-gray-200 pl-4")}>
      {nodes.map((node, i) => (
        <OrgNodeItem key={`${node.title}-${i}`} node={node} depth={depth} />
      ))}
    </div>
  );
}

function OrgNodeItem({ node, depth }: { node: OrgNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2.5 w-full text-left py-2 px-3 rounded-xl transition-all duration-200",
          hasChildren ? "hover:bg-gray-50 cursor-pointer" : "cursor-default",
          depth === 0 && "bg-gray-50/80"
        )}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown size={14} strokeWidth={1.5} className="text-gray-400 shrink-0" />
          ) : (
            <ChevronRight size={14} strokeWidth={1.5} className="text-gray-400 shrink-0" />
          )
        ) : (
          <div className="w-[14px] shrink-0 flex justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          </div>
        )}
        <span className={cn(
          "text-[14px]",
          depth === 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"
        )}>
          {node.title}
        </span>
        {node.role && (
          <span className="text-[12px] text-gray-400">{node.role}</span>
        )}
        {node.badge && (
          <Badge variant={node.badge.variant}>{node.badge.label}</Badge>
        )}
      </button>
      {hasChildren && expanded && (
        <OrgTree nodes={node.children!} depth={depth + 1} />
      )}
    </div>
  );
}

// ─── Step Card ───

function StepCard({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-[14px] font-semibold shrink-0">
          {step}
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-2" />
      </div>
      <div className="pb-8 flex-1">
        <h4 className="text-headline text-gray-900">{title}</h4>
        <p className="text-callout text-gray-500 mt-1 mb-4">{description}</p>
        {children}
      </div>
    </div>
  );
}

// ─── Tip Box ───

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-amber-50/60 border border-amber-100 rounded-xl">
      <Lightbulb size={18} strokeWidth={1.5} className="text-amber-500 shrink-0 mt-0.5" />
      <div className="text-[14px] text-amber-800 leading-relaxed">{children}</div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-blue-50/60 border border-blue-100 rounded-xl">
      <Info size={18} strokeWidth={1.5} className="text-blue-500 shrink-0 mt-0.5" />
      <div className="text-[14px] text-blue-800 leading-relaxed">{children}</div>
    </div>
  );
}

// ─── Example Hierarchy Data ───

const techCompanyHierarchy: OrgNode[] = [
  {
    title: "TechCorp Inc.",
    role: "Organization",
    badge: { label: "Example", variant: "outline" },
    children: [
      {
        title: "Executive / Leadership Team",
        role: "CTO evaluates all department heads",
        badge: { label: "Team", variant: "success" },
        children: [
          { title: "James Carter", role: "CTO / Director", badge: { label: "Manager", variant: "warning" } },
          { title: "Sarah Chen", role: "Engineering Manager", badge: { label: "Direct Report", variant: "info" } },
          { title: "Robert Hayes", role: "Finance Director", badge: { label: "Direct Report", variant: "info" } },
          { title: "Emily Tran", role: "Accounts Lead", badge: { label: "Direct Report", variant: "info" } },
          { title: "Maria Santos", role: "HR Director", badge: { label: "Direct Report", variant: "info" } },
          { title: "David Liu", role: "Office Manager", badge: { label: "Direct Report", variant: "info" } },
        ],
      },
      {
        title: "Engineering",
        role: "Department",
        badge: { label: "4 Teams", variant: "info" },
        children: [
          {
            title: "Engineering Management",
            role: "EM evaluates all solution architects",
            badge: { label: "Team", variant: "success" },
            children: [
              { title: "Sarah Chen", role: "Engineering Manager", badge: { label: "Manager", variant: "warning" } },
              { title: "Alex Rivera", role: "Solution Architect — Platform", badge: { label: "Direct Report", variant: "info" } },
              { title: "Priya Sharma", role: "Solution Architect — Frontend", badge: { label: "Direct Report", variant: "info" } },
              { title: "Dan Kim", role: "Solution Architect - DevOps", badge: { label: "Direct Report", variant: "info" } },
            ],
          },
          {
            title: "Platform Team",
            role: "Lead: Alex Rivera",
            badge: { label: "Team", variant: "success" },
            children: [
              { title: "Alex Rivera", role: "Solution Architect", badge: { label: "Manager", variant: "warning" } },
              { title: "Jordan Lee", role: "Senior Engineer", badge: { label: "Direct Report", variant: "info" } },
              { title: "Maya Patel", role: "Engineer", badge: { label: "Direct Report", variant: "info" } },
              { title: "Chris Wu", role: "Junior Engineer", badge: { label: "Direct Report", variant: "info" } },
            ],
          },
          {
            title: "Frontend Team",
            role: "Lead: Priya Sharma",
            badge: { label: "Team", variant: "success" },
            children: [
              { title: "Priya Sharma", role: "Solution Architect", badge: { label: "Manager", variant: "warning" } },
              { title: "Tom Zhang", role: "Senior Engineer", badge: { label: "Direct Report", variant: "info" } },
              { title: "Nina Costa", role: "Engineer", badge: { label: "Direct Report", variant: "info" } },
            ],
          },
          {
            title: "DevOps Team",
            role: "Lead: Dan Kim",
            badge: { label: "Team", variant: "success" },
            children: [
              { title: "Dan Kim", role: "Solution Architect", badge: { label: "Manager", variant: "warning" } },
              { title: "Sam Ali", role: "DevOps Engineer", badge: { label: "Direct Report", variant: "info" } },
            ],
          },
        ],
      },
      {
        title: "Finance & Accounts",
        role: "Department",
        badge: { label: "2 Teams", variant: "info" },
        children: [
          {
            title: "Finance Team",
            role: "Lead: Robert Hayes",
            badge: { label: "Team", variant: "success" },
            children: [
              { title: "Robert Hayes", role: "Finance Director", badge: { label: "Manager", variant: "warning" } },
              { title: "Lisa Park", role: "Financial Analyst", badge: { label: "Direct Report", variant: "info" } },
              { title: "Mark Jensen", role: "Budget Analyst", badge: { label: "Direct Report", variant: "info" } },
            ],
          },
          {
            title: "Accounts Team",
            role: "Lead: Emily Tran",
            badge: { label: "Team", variant: "success" },
            children: [
              { title: "Emily Tran", role: "Accounts Lead", badge: { label: "Manager", variant: "warning" } },
              { title: "James Wong", role: "Accountant", badge: { label: "Direct Report", variant: "info" } },
              { title: "Aisha Khan", role: "Accounts Payable", badge: { label: "Direct Report", variant: "info" } },
            ],
          },
        ],
      },
      {
        title: "Human Resources",
        role: "Department",
        badge: { label: "1 Team", variant: "info" },
        children: [
          {
            title: "HR Team",
            role: "Lead: Maria Santos",
            badge: { label: "Team", variant: "success" },
            children: [
              { title: "Maria Santos", role: "HR Director", badge: { label: "Manager", variant: "warning" } },
              { title: "Kevin Brown", role: "HR Specialist", badge: { label: "Direct Report", variant: "info" } },
              { title: "Rachel Adams", role: "Recruiter", badge: { label: "Direct Report", variant: "info" } },
            ],
          },
        ],
      },
      {
        title: "Administration",
        role: "Department",
        badge: { label: "1 Team", variant: "info" },
        children: [
          {
            title: "Admin Team",
            role: "Lead: David Liu",
            badge: { label: "Team", variant: "success" },
            children: [
              { title: "David Liu", role: "Office Manager", badge: { label: "Manager", variant: "warning" } },
              { title: "Sophie Martin", role: "Executive Assistant", badge: { label: "Direct Report", variant: "info" } },
              { title: "Omar Farooq", role: "Facilities Coordinator", badge: { label: "Direct Report", variant: "info" } },
            ],
          },
        ],
      },
    ],
  },
];

// ─── Page ───

export default function GuidePage() {
  return (
    <div>
      <PageHeader
        title="Setup Guide"
        description="Learn how to structure your organization and set up teams for 360° evaluations"
      />

      <div className="max-w-4xl space-y-8">
        {/* Intro Card */}
        <Card>
          <div className="flex gap-4">
            <div className="p-3 rounded-xl bg-brand-50 h-fit">
              <Building2 size={24} strokeWidth={1.5} className="text-brand-500" />
            </div>
            <div>
              <h2 className="text-title-small text-gray-900">Understanding Team Structure</h2>
              <p className="text-body text-gray-500 mt-2 leading-relaxed">
                In Perform360, <strong>teams</strong> are the building blocks of your evaluation cycles.
                Each team represents a functional group within your organization. Team members are assigned
                one of three roles &mdash; <strong>Manager</strong>, <strong>Direct Report</strong>, or{" "}
                <strong>Peer</strong> &mdash; which determines the evaluation relationship during review cycles.
              </p>
            </div>
          </div>
        </Card>

        {/* Role Explainer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Briefcase size={18} strokeWidth={1.5} className="text-amber-500" />
              </div>
              <h3 className="text-headline text-gray-900">Manager</h3>
            </div>
            <p className="text-callout text-gray-500">
              Team leads, engineering managers, directors. They evaluate their direct reports
              and receive upward feedback.
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <UserCircle size={18} strokeWidth={1.5} className="text-blue-500" />
              </div>
              <h3 className="text-headline text-gray-900">Direct Report</h3>
            </div>
            <p className="text-callout text-gray-500">
              Team members who report to a manager. They receive evaluations from their
              manager and peers.
            </p>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <Users size={18} strokeWidth={1.5} className="text-gray-500" />
              </div>
              <h3 className="text-headline text-gray-900">Peer</h3>
            </div>
            <p className="text-callout text-gray-500">
              Colleagues at a similar level. They provide lateral feedback to each other
              during evaluation cycles.
            </p>
          </Card>
        </div>

        {/* Example Hierarchy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50">
                <GitBranch size={20} strokeWidth={1.5} className="text-purple-500" />
              </div>
              <div>
                <CardTitle>Example: TechCorp Inc. Hierarchy</CardTitle>
                <CardDescription>
                  A typical mid-size company with Engineering, Finance, HR, and Admin departments.
                  Click to expand each level.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="mt-2">
            <OrgTree nodes={techCompanyHierarchy} />
          </div>
        </Card>

        {/* How to Map This */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-50">
                <CheckCircle2 size={20} strokeWidth={1.5} className="text-green-500" />
              </div>
              <div>
                <CardTitle>How to Map This in Perform360</CardTitle>
                <CardDescription>
                  Follow these steps to translate your org chart into Perform360 teams
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="mt-4">
            <StepCard
              step={1}
              title="Identify Your Teams"
              description="Each functional group that works together becomes a team. Don't create teams for departments — create them for actual working groups."
            >
              <Card padding="sm" className="bg-gray-50/50 border-gray-100">
                <div className="text-[14px] text-gray-600 space-y-2">
                  <p className="font-medium text-gray-900">For TechCorp, you would create 9 teams:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {[
                      "Leadership Team",
                      "Engineering Management",
                      "Platform Team",
                      "Frontend Team",
                      "DevOps Team",
                      "Finance Team",
                      "Accounts Team",
                      "HR Team",
                      "Admin Team",
                    ].map((team) => (
                      <div key={team} className="flex items-center gap-2">
                        <CheckCircle2 size={14} strokeWidth={1.5} className="text-green-500 shrink-0" />
                        <span>{team}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </StepCard>

            <StepCard
              step={2}
              title="Add Members with Roles"
              description="For each team, add members and assign their role based on the reporting relationship within that team."
            >
              <Card padding="sm" className="bg-gray-50/50 border-gray-100">
                <div className="text-[14px] text-gray-600">
                  <p className="font-medium text-gray-900 mb-3">Example: Platform Team</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg">
                      <span>Alex Rivera (Solution Architect)</span>
                      <Badge variant="warning">Manager</Badge>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg">
                      <span>Jordan Lee (Senior Engineer)</span>
                      <Badge variant="info">Direct Report</Badge>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg">
                      <span>Maya Patel (Engineer)</span>
                      <Badge variant="info">Direct Report</Badge>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg">
                      <span>Chris Wu (Junior Engineer)</span>
                      <Badge variant="info">Direct Report</Badge>
                    </div>
                  </div>
                </div>
              </Card>
              <div className="mt-3">
                <TipBox>
                  A person can be a <strong>Manager</strong> in one team and a <strong>Direct Report</strong> in
                  another. For example, Sarah Chen is a Direct Report in the Leadership Team (evaluated by the CTO),
                  while Alex Rivera is a Manager of the Platform Team. This is how directors evaluate their department heads.
                </TipBox>
              </div>
            </StepCard>

            <StepCard
              step={3}
              title="Create an Evaluation Cycle"
              description="Once your teams are set up, create a cycle and select which teams to include. Assignments are generated automatically."
            >
              <Card padding="sm" className="bg-gray-50/50 border-gray-100">
                <div className="text-[14px] text-gray-600 space-y-3">
                  <p className="font-medium text-gray-900">Auto-generated assignments for Platform Team:</p>
                  <div className="space-y-1.5">
                    {[
                      { reviewer: "Alex Rivera", subject: "Jordan Lee", rel: "Manager → Direct Report" },
                      { reviewer: "Alex Rivera", subject: "Maya Patel", rel: "Manager → Direct Report" },
                      { reviewer: "Alex Rivera", subject: "Chris Wu", rel: "Manager → Direct Report" },
                      { reviewer: "Jordan Lee", subject: "Alex Rivera", rel: "Direct Report → Manager" },
                      { reviewer: "Maya Patel", subject: "Alex Rivera", rel: "Direct Report → Manager" },
                      { reviewer: "Jordan Lee", subject: "Maya Patel", rel: "Peer → Peer" },
                    ].map((a, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-white rounded-lg text-[13px]">
                        <span className="text-gray-900 font-medium">{a.reviewer}</span>
                        <ArrowRight size={12} strokeWidth={1.5} className="text-gray-400 shrink-0" />
                        <span className="text-gray-900 font-medium">{a.subject}</span>
                        <span className="text-gray-400 ml-auto whitespace-nowrap">{a.rel}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[12px] text-gray-400">
                    ... and more assignments based on all team relationships
                  </p>
                </div>
              </Card>
            </StepCard>

            <StepCard
              step={4}
              title="Activate & Send Invitations"
              description="When you activate the cycle, each reviewer receives a unique evaluation link via email. No accounts needed — they verify via OTP."
            >
              <InfoBox>
                Reviewers don&apos;t need a Perform360 account. They receive a secure link,
                verify their identity with a one-time code sent to their email, and complete
                the evaluation form directly.
              </InfoBox>
            </StepCard>
          </div>
        </Card>

        {/* Common Patterns */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50">
                <Lightbulb size={20} strokeWidth={1.5} className="text-blue-500" />
              </div>
              <div>
                <CardTitle>Common Organizational Patterns</CardTitle>
                <CardDescription>
                  How different company structures map to Perform360 teams
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="mt-4 space-y-4">
            {/* Pattern 1 */}
            <div className="p-4 border border-gray-100 rounded-xl">
              <h4 className="text-headline text-gray-900 mb-1">Flat Organization</h4>
              <p className="text-callout text-gray-500 mb-3">
                Small startups with minimal hierarchy. One founder/CEO manages everyone.
              </p>
              <div className="font-mono text-[13px] text-gray-600 bg-gray-50 rounded-lg p-4 leading-relaxed whitespace-pre">{`CEO / Founder
├── Engineer 1      (Direct Report)
├── Engineer 2      (Direct Report)
├── Designer        (Direct Report)
└── Marketing Lead  (Direct Report)`}</div>
              <p className="text-caption mt-3">
                Create a single team. CEO is Manager, everyone else is Direct Report.
              </p>
            </div>

            {/* Pattern 2 */}
            <div className="p-4 border border-gray-100 rounded-xl">
              <h4 className="text-headline text-gray-900 mb-1">Matrix Organization</h4>
              <p className="text-callout text-gray-500 mb-3">
                Employees report to both a functional manager and a project lead.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="font-mono text-[13px] text-gray-600 bg-gray-50 rounded-lg p-4 leading-relaxed whitespace-pre">{`Team: "Project Alpha"
├── Project Lead  (Manager)
├── Engineer A    (Direct Report)
├── Designer B    (Direct Report)
└── QA Tester C   (Direct Report)`}</div>
                <div className="font-mono text-[13px] text-gray-600 bg-gray-50 rounded-lg p-4 leading-relaxed whitespace-pre">{`Team: "Engineering Dept"
├── VP Engineering (Manager)
├── Engineer A     (Direct Report)
├── Engineer C     (Direct Report)
└── Engineer D     (Direct Report)`}</div>
              </div>
              <p className="text-caption mt-3">
                Create separate teams for each reporting line. Engineer A appears in both teams
                with different managers, getting feedback from both perspectives.
              </p>
            </div>

            {/* Pattern 3 */}
            <div className="p-4 border border-gray-100 rounded-xl">
              <h4 className="text-headline text-gray-900 mb-1">Co-Managed Team</h4>
              <p className="text-callout text-gray-500 mb-3">
                Two managers share responsibility for the same team (common in agencies and large enterprises).
              </p>
              <div className="font-mono text-[13px] text-gray-600 bg-gray-50 rounded-lg p-4 leading-relaxed whitespace-pre">{`Team: "Design Studio"
├── Creative Director   (Manager)
├── Art Director        (Manager)
├── Senior Designer 1   (Direct Report)
├── Senior Designer 2   (Direct Report)
├── Junior Designer 1   (Direct Report)
└── Junior Designer 2   (Direct Report)`}</div>
              <p className="text-caption mt-3">
                Perform360 supports multiple managers per team. Both managers evaluate all direct reports,
                and reports show aggregated scores from each manager.
              </p>
            </div>

            {/* Pattern 4 */}
            <div className="p-4 border border-gray-100 rounded-xl">
              <h4 className="text-headline text-gray-900 mb-1">Cross-Functional Squad</h4>
              <p className="text-callout text-gray-500 mb-3">
                Members from different departments working on the same product. Use Peer roles for lateral feedback.
              </p>
              <div className="font-mono text-[13px] text-gray-600 bg-gray-50 rounded-lg p-4 leading-relaxed whitespace-pre">{`Team: "Growth Squad"
├── Product Manager     (Manager)
├── Backend Engineer    (Peer)
├── Frontend Engineer   (Peer)
├── Designer            (Peer)
├── Data Analyst        (Peer)
└── Marketing Specialist(Peer)`}</div>
              <p className="text-caption mt-3">
                Use Peer roles when team members don&apos;t have a direct reporting relationship
                but collaborate closely and should provide feedback to each other.
              </p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
