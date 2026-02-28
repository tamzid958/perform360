"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
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
  BarChart3,
  FileText,
  Mail,
  Star,
  MessageSquare,
  Shield,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Section definitions ───

const sections = [
  { id: "roles", label: "Team Roles", icon: Users },
  { id: "example-org", label: "Example Org", icon: GitBranch },
  { id: "creating-teams", label: "Creating Teams", icon: CheckCircle2 },
  { id: "running-cycles", label: "Running Cycles", icon: RefreshCcw },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "org-patterns", label: "Org Patterns", icon: Lightbulb },
] as const;

type SectionId = (typeof sections)[number]["id"];

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

// ─── Section Content Components ───

function RolesSection() {
  return (
    <div className="space-y-6">
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
    </div>
  );
}

function ExampleOrgSection() {
  return (
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
  );
}

function CreatingTeamsSection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-50">
            <CheckCircle2 size={20} strokeWidth={1.5} className="text-green-500" />
          </div>
          <div>
            <CardTitle>Creating Teams</CardTitle>
            <CardDescription>
              Identify your working groups and assign roles to each member
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
      </div>
    </Card>
  );
}

function RunningCyclesSection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50">
            <RefreshCcw size={20} strokeWidth={1.5} className="text-blue-500" />
          </div>
          <div>
            <CardTitle>Running Evaluation Cycles</CardTitle>
            <CardDescription>
              Create a cycle, activate it, and let reviewers complete their evaluations
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <div className="mt-4">
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
                  { reviewer: "Alex Rivera", subject: "Jordan Lee", rel: "Manager \u2192 Direct Report" },
                  { reviewer: "Alex Rivera", subject: "Maya Patel", rel: "Manager \u2192 Direct Report" },
                  { reviewer: "Alex Rivera", subject: "Chris Wu", rel: "Manager \u2192 Direct Report" },
                  { reviewer: "Jordan Lee", subject: "Alex Rivera", rel: "Direct Report \u2192 Manager" },
                  { reviewer: "Maya Patel", subject: "Alex Rivera", rel: "Direct Report \u2192 Manager" },
                  { reviewer: "Jordan Lee", subject: "Maya Patel", rel: "Peer \u2192 Peer" },
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

        <StepCard
          step={5}
          title="Each Reviewer Completes Their Evaluations"
          description="Every team member receives email invitations for each person they need to evaluate. Here's what it looks like for the Platform Team:"
        >
          <Card padding="sm" className="bg-gray-50/50 border-gray-100">
            <div className="text-[14px] text-gray-600 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={14} strokeWidth={1.5} className="text-brand-500" />
                  <p className="font-medium text-gray-900">Alex Rivera (Manager) receives 3 evaluation links:</p>
                </div>
                <div className="space-y-1.5 ml-5">
                  {[
                    { subject: "Jordan Lee", note: "Evaluates as their Manager" },
                    { subject: "Maya Patel", note: "Evaluates as their Manager" },
                    { subject: "Chris Wu", note: "Evaluates as their Manager" },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-white rounded-lg text-[13px]">
                      <span className="text-gray-500">Evaluate</span>
                      <span className="text-gray-900 font-medium">{a.subject}</span>
                      <span className="text-gray-400 ml-auto text-[12px]">{a.note}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={14} strokeWidth={1.5} className="text-brand-500" />
                  <p className="font-medium text-gray-900">Jordan Lee (Direct Report) receives 3 evaluation links:</p>
                </div>
                <div className="space-y-1.5 ml-5">
                  {[
                    { subject: "Alex Rivera", note: "Evaluates as their Direct Report (upward feedback)" },
                    { subject: "Maya Patel", note: "Evaluates as a Peer" },
                    { subject: "Chris Wu", note: "Evaluates as a Peer" },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-white rounded-lg text-[13px]">
                      <span className="text-gray-500">Evaluate</span>
                      <span className="text-gray-900 font-medium">{a.subject}</span>
                      <span className="text-gray-400 ml-auto text-[12px]">{a.note}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={14} strokeWidth={1.5} className="text-brand-500" />
                  <p className="font-medium text-gray-900">Maya Patel & Chris Wu each receive similar links for their peers and manager.</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-3">
            <TipBox>
              Each evaluation link is <strong>unique and secure</strong>. The reviewer opens the link,
              verifies with a one-time code, and fills out the evaluation form. They can only see
              their own form — never anyone else&apos;s responses.
            </TipBox>
          </div>
        </StepCard>
      </div>
    </Card>
  );
}

function ReportsSection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-50">
            <BarChart3 size={20} strokeWidth={1.5} className="text-green-500" />
          </div>
          <div>
            <CardTitle>Reports & Results</CardTitle>
            <CardDescription>
              How feedback is collected and turned into actionable reports
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <div className="mt-4">
        <StepCard
          step={6}
          title="Responses Collected from All Directions"
          description="As reviewers submit their forms, the system collects feedback from every direction — manager, peers, and direct reports. Let's see what this looks like for one employee:"
        >
          <Card padding="sm" className="bg-gray-50/50 border-gray-100">
            <div className="text-[14px] text-gray-600 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <UserCircle size={16} strokeWidth={1.5} className="text-brand-500" />
                <p className="font-semibold text-gray-900 text-[15px]">
                  Report for: Alex Rivera (Solution Architect)
                </p>
              </div>
              <p className="text-[13px] text-gray-500 -mt-2 ml-6">
                The system gathers all evaluations where Alex is the <strong>subject</strong>:
              </p>

              {/* Manager feedback */}
              <div className="border border-amber-100 bg-amber-50/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={14} strokeWidth={1.5} className="text-amber-600" />
                  <span className="font-medium text-amber-900 text-[13px]">Manager Feedback</span>
                  <span className="text-[12px] text-amber-600/60 ml-auto">from Engineering Management team</span>
                </div>
                <div className="py-1.5 px-3 bg-white rounded-lg text-[13px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium">Sarah Chen</span>
                    <ArrowRight size={12} strokeWidth={1.5} className="text-gray-400" />
                    <span className="text-gray-500">evaluated Alex</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} strokeWidth={1.5} className="text-amber-400 fill-amber-400" />
                    <span className="text-gray-600 font-medium">4.5 / 5</span>
                  </div>
                </div>
              </div>

              {/* Direct Report feedback */}
              <div className="border border-purple-100 bg-purple-50/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle size={14} strokeWidth={1.5} className="text-purple-600" />
                  <span className="font-medium text-purple-900 text-[13px]">Direct Report Feedback</span>
                  <span className="text-[12px] text-purple-600/60 ml-auto">from Platform Team</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { name: "Jordan Lee", score: "4.3" },
                    { name: "Maya Patel", score: "4.1" },
                    { name: "Chris Wu", score: "4.6" },
                  ].map((p, i) => (
                    <div key={i} className="py-1.5 px-3 bg-white rounded-lg text-[13px] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-medium">{p.name}</span>
                        <ArrowRight size={12} strokeWidth={1.5} className="text-gray-400" />
                        <span className="text-gray-500">evaluated Alex</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} strokeWidth={1.5} className="text-purple-400 fill-purple-400" />
                        <span className="text-gray-600 font-medium">{p.score} / 5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peer feedback */}
              <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={14} strokeWidth={1.5} className="text-blue-600" />
                  <span className="font-medium text-blue-900 text-[13px]">Peer Feedback</span>
                  <span className="text-[12px] text-blue-600/60 ml-auto">from Engineering Management team</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { name: "Priya Sharma", score: "4.0" },
                    { name: "Dan Kim", score: "4.2" },
                  ].map((p, i) => (
                    <div key={i} className="py-1.5 px-3 bg-white rounded-lg text-[13px] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-medium">{p.name}</span>
                        <ArrowRight size={12} strokeWidth={1.5} className="text-gray-400" />
                        <span className="text-gray-500">evaluated Alex</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} strokeWidth={1.5} className="text-blue-400 fill-blue-400" />
                        <span className="text-gray-600 font-medium">{p.score} / 5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border border-green-100 bg-green-50/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={14} strokeWidth={1.5} className="text-green-600" />
                  <span className="font-medium text-green-900 text-[13px]">Alex&apos;s Report Summary</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center py-2 px-2 bg-white rounded-lg">
                    <p className="text-[11px] text-gray-400 mb-0.5">Manager Avg</p>
                    <p className="text-[16px] font-semibold text-amber-600">4.5</p>
                  </div>
                  <div className="text-center py-2 px-2 bg-white rounded-lg">
                    <p className="text-[11px] text-gray-400 mb-0.5">Direct Report Avg</p>
                    <p className="text-[16px] font-semibold text-purple-600">4.3</p>
                  </div>
                  <div className="text-center py-2 px-2 bg-white rounded-lg">
                    <p className="text-[11px] text-gray-400 mb-0.5">Peer Avg</p>
                    <p className="text-[16px] font-semibold text-blue-600">4.1</p>
                  </div>
                  <div className="text-center py-2 px-2 bg-white rounded-lg">
                    <p className="text-[11px] text-gray-400 mb-0.5">Overall</p>
                    <p className="text-[16px] font-semibold text-green-600">4.3</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-3">
            <InfoBox>
              Each employee gets a comprehensive report showing scores from <strong>every direction</strong> —
              manager feedback, peer feedback, and (if applicable) direct report feedback. Open-text
              comments are grouped by relationship type and kept <strong>anonymous</strong> so reviewers
              can be candid.
            </InfoBox>
          </div>
        </StepCard>

        <StepCard
          step={7}
          title="Admin / HR Reviews & Shares Reports"
          description="Once the cycle closes, Admin or HR can view individual reports for every employee, export them as PDFs, and share findings."
        >
          <Card padding="sm" className="bg-gray-50/50 border-gray-100">
            <div className="text-[14px] text-gray-600 space-y-4">
              <p className="font-medium text-gray-900">What the individual report includes:</p>
              <div className="space-y-2">
                {[
                  { icon: BarChart3, label: "Radar chart", desc: "Visual breakdown across all competency areas (communication, technical skills, leadership, etc.)" },
                  { icon: Star, label: "Score breakdown by relationship", desc: "See how managers, peers, and direct reports scored the employee separately" },
                  { icon: MessageSquare, label: "Anonymized comments", desc: "Open-text feedback grouped by relationship type — reviewers stay anonymous" },
                  { icon: FileText, label: "Per-question detail", desc: "Score distribution for every question in the evaluation template" },
                  { icon: BarChart3, label: "Trend comparison", desc: "Compare against previous cycles to track growth over time" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 px-3 bg-white rounded-lg">
                    <item.icon size={16} strokeWidth={1.5} className="text-brand-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-900">{item.label}</span>
                      <span className="text-gray-400"> — </span>
                      <span className="text-gray-500">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="mt-3 space-y-3">
            <Card padding="sm" className="bg-gray-50/50 border-gray-100">
              <div className="text-[14px] text-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} strokeWidth={1.5} className="text-purple-500" />
                  <p className="font-medium text-gray-900">Who can see what?</p>
                </div>
                <div className="space-y-1.5">
                  {[
                    { role: "Admin / HR", access: "Full access to all individual and cycle reports", variant: "success" as const },
                    { role: "Managers", access: "Cannot view reports — only Admin/HR can access and share", variant: "warning" as const },
                    { role: "Employees", access: "Cannot view their own report — Admin/HR decides what to share", variant: "info" as const },
                    { role: "Platform Owner", access: "Zero access to evaluation data — encrypted at rest", variant: "default" as const },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg text-[13px]">
                      <div className="flex items-center gap-2">
                        <Badge variant={r.variant}>{r.role}</Badge>
                        <span className="text-gray-500">{r.access}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <TipBox>
              Reports can be exported as <strong>PDFs</strong> for sharing during one-on-one reviews.
              Admin/HR controls exactly who sees what — the platform never automatically shares reports
              with the employee or their manager.
            </TipBox>
          </div>
        </StepCard>
      </div>
    </Card>
  );
}

function OrgPatternsSection() {
  return (
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
  );
}

// ─── Section Content Map ───

const sectionComponents: Record<SectionId, () => React.JSX.Element> = {
  "roles": RolesSection,
  "example-org": ExampleOrgSection,
  "creating-teams": CreatingTeamsSection,
  "running-cycles": RunningCyclesSection,
  "reports": ReportsSection,
  "org-patterns": OrgPatternsSection,
};

// ─── Page ───

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<SectionId>("roles");

  const ActiveContent = sectionComponents[activeSection];

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* Mobile Tab Bar */}
      <div className="md:hidden sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 py-2">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all duration-200",
                  activeSection === section.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon size={14} strokeWidth={1.5} />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="flex gap-8 items-start">
          {/* Sidebar — desktop only */}
          <nav className="hidden md:block w-48 shrink-0 pt-28">
            <div className="sticky top-24 space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 text-left",
                      activeSection === section.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    {section.label}
                  </button>
                );
              })}

              <div className="border-t border-gray-100 mt-4 pt-4">
                <Button variant="primary" size="sm" className="w-full" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Hero Header */}
            <div className="pt-28 pb-8">
              <h1 className="text-title-large text-gray-900">Setup Guide</h1>
              <p className="text-body text-gray-500 mt-3 max-w-2xl">
                Learn how to structure your organization and set up teams for 360° evaluations.
                Follow along with our TechCorp example to see exactly how it works.
              </p>
            </div>

            <ActiveContent />
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
