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
  Radar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Section definitions ───

const sections = [
  { id: "how-360-works", label: "How 360° Works", icon: Radar },
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
          { title: "Sarah Chen", role: "Engineering Manager", badge: { label: "Member", variant: "info" } },
          { title: "Robert Hayes", role: "Finance Director", badge: { label: "Member", variant: "info" } },
          { title: "Emily Tran", role: "Accounts Lead", badge: { label: "Member", variant: "info" } },
          { title: "Maria Santos", role: "HR Director", badge: { label: "Member", variant: "info" } },
          { title: "David Liu", role: "Office Manager", badge: { label: "Member", variant: "info" } },
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
              { title: "Alex Rivera", role: "Solution Architect — Platform", badge: { label: "Member", variant: "info" } },
              { title: "Priya Sharma", role: "Solution Architect — Frontend", badge: { label: "Member", variant: "info" } },
              { title: "Dan Kim", role: "Solution Architect - DevOps", badge: { label: "Member", variant: "info" } },
            ],
          },
          {
            title: "Platform Team",
            role: "Lead: Alex Rivera",
            badge: { label: "Team", variant: "success" },
            children: [
              { title: "Alex Rivera", role: "Solution Architect", badge: { label: "Manager", variant: "warning" } },
              { title: "Jordan Lee", role: "Senior Engineer", badge: { label: "Member", variant: "info" } },
              { title: "Maya Patel", role: "Engineer", badge: { label: "Member", variant: "info" } },
              { title: "Chris Wu", role: "Junior Engineer", badge: { label: "Member", variant: "info" } },
            ],
          },
          {
            title: "Frontend Team",
            role: "Lead: Priya Sharma",
            badge: { label: "Team", variant: "success" },
            children: [
              { title: "Priya Sharma", role: "Solution Architect", badge: { label: "Manager", variant: "warning" } },
              { title: "Tom Zhang", role: "Senior Engineer", badge: { label: "Member", variant: "info" } },
              { title: "Nina Costa", role: "Engineer", badge: { label: "Member", variant: "info" } },
            ],
          },
          {
            title: "DevOps Team",
            role: "Lead: Dan Kim",
            badge: { label: "Team", variant: "success" },
            children: [
              { title: "Dan Kim", role: "Solution Architect", badge: { label: "Manager", variant: "warning" } },
              { title: "Sam Ali", role: "DevOps Engineer", badge: { label: "Member", variant: "info" } },
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
              { title: "Lisa Park", role: "Financial Analyst", badge: { label: "Member", variant: "info" } },
              { title: "Mark Jensen", role: "Budget Analyst", badge: { label: "Member", variant: "info" } },
            ],
          },
          {
            title: "Accounts Team",
            role: "Lead: Emily Tran",
            badge: { label: "Team", variant: "success" },
            children: [
              { title: "Emily Tran", role: "Accounts Lead", badge: { label: "Manager", variant: "warning" } },
              { title: "James Wong", role: "Accountant", badge: { label: "Member", variant: "info" } },
              { title: "Aisha Khan", role: "Accounts Payable", badge: { label: "Member", variant: "info" } },
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
              { title: "Kevin Brown", role: "HR Specialist", badge: { label: "Member", variant: "info" } },
              { title: "Rachel Adams", role: "Recruiter", badge: { label: "Member", variant: "info" } },
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
              { title: "Sophie Martin", role: "Executive Assistant", badge: { label: "Member", variant: "info" } },
              { title: "Omar Farooq", role: "Facilities Coordinator", badge: { label: "Member", variant: "info" } },
            ],
          },
        ],
      },
    ],
  },
];

// ─── Section Content Components ───

// ─── How 360° Works Section ───

function How360WorksSection() {
  return (
    <div className="space-y-6">
      {/* Concept overview */}
      <Card>
        <div className="flex gap-4">
          <div className="p-3 rounded-xl bg-brand-50 h-fit">
            <Radar size={24} strokeWidth={1.5} className="text-brand-500" />
          </div>
          <div>
            <h2 className="text-title-small text-gray-900">What is 360° Feedback?</h2>
            <p className="text-body text-gray-500 mt-2 leading-relaxed">
              Traditional reviews are top-down &mdash; a manager evaluates their team. <strong>360° feedback</strong> collects
              input from <em>every direction</em>: managers, members, peers, and even a self-assessment. This gives a complete,
              well-rounded picture of each employee&apos;s performance, strengths, and growth areas.
            </p>
          </div>
        </div>
      </Card>

      {/* Three directions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-[16px]">
              &darr;
            </div>
            <h3 className="text-headline text-gray-900">Downward</h3>
          </div>
          <p className="text-callout text-gray-500">
            <strong>Manager &rarr; Member.</strong> The traditional review &mdash;
            managers evaluate the people they supervise.
          </p>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-[16px]">
              &uarr;
            </div>
            <h3 className="text-headline text-gray-900">Upward</h3>
          </div>
          <p className="text-callout text-gray-500">
            <strong>Member &rarr; Manager.</strong> Team members give feedback
            on their manager&apos;s leadership, communication, and support.
          </p>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[16px]">
              &harr;
            </div>
            <h3 className="text-headline text-gray-900">Lateral</h3>
          </div>
          <p className="text-callout text-gray-500">
            <strong>Member &rarr; Member.</strong> Colleagues at the same level evaluate
            each other on collaboration, reliability, and teamwork.
          </p>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-[16px]">
              &#8635;
            </div>
            <h3 className="text-headline text-gray-900">Self</h3>
          </div>
          <p className="text-callout text-gray-500">
            <strong>Self-assessment.</strong> Each person evaluates their own performance,
            providing insight into self-awareness and personal growth areas.
          </p>
        </Card>
      </div>

      {/* TechCorp Platform Team — full assignment matrix */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-50">
              <Users size={20} strokeWidth={1.5} className="text-green-500" />
            </div>
            <div>
              <CardTitle>Example: TechCorp&apos;s Platform Team</CardTitle>
              <CardDescription>
                Every evaluation assignment generated for a single team of 4 people
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Team roster */}
        <div className="mt-4 mb-5">
          <p className="text-callout text-gray-500 mb-3 font-medium">Team members:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: "Alex Rivera", title: "Solution Architect", role: "Manager" as const },
              { name: "Jordan Lee", title: "Senior Engineer", role: "Member" as const },
              { name: "Maya Patel", title: "Engineer", role: "Member" as const },
              { name: "Chris Wu", title: "Junior Engineer", role: "Member" as const },
            ].map((m) => (
              <div key={m.name} className="py-2.5 px-3 bg-gray-50 rounded-xl text-center">
                <p className="text-[13px] font-medium text-gray-900">{m.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{m.title}</p>
                <Badge variant={m.role === "Manager" ? "warning" : "info"} className="mt-1.5">
                  {m.role}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Downward evaluations */}
        <div className="space-y-4">
          <div className="border border-amber-100 bg-amber-50/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase size={14} strokeWidth={1.5} className="text-amber-600" />
              <span className="font-medium text-amber-900 text-[13px]">Downward Feedback</span>
              <span className="text-[12px] text-amber-600/60 ml-auto">Manager evaluates Members</span>
            </div>
            <div className="space-y-1.5">
              {[
                { reviewer: "Alex Rivera", subject: "Jordan Lee" },
                { reviewer: "Alex Rivera", subject: "Maya Patel" },
                { reviewer: "Alex Rivera", subject: "Chris Wu" },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-white rounded-lg text-[13px]">
                  <span className="text-gray-900 font-medium">{a.reviewer}</span>
                  <ArrowRight size={12} strokeWidth={1.5} className="text-amber-400 shrink-0" />
                  <span className="text-gray-900 font-medium">{a.subject}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upward evaluations */}
          <div className="border border-purple-100 bg-purple-50/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserCircle size={14} strokeWidth={1.5} className="text-purple-600" />
              <span className="font-medium text-purple-900 text-[13px]">Upward Feedback</span>
              <span className="text-[12px] text-purple-600/60 ml-auto">Members evaluate Manager</span>
            </div>
            <div className="space-y-1.5">
              {[
                { reviewer: "Jordan Lee", subject: "Alex Rivera" },
                { reviewer: "Maya Patel", subject: "Alex Rivera" },
                { reviewer: "Chris Wu", subject: "Alex Rivera" },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-white rounded-lg text-[13px]">
                  <span className="text-gray-900 font-medium">{a.reviewer}</span>
                  <ArrowRight size={12} strokeWidth={1.5} className="text-purple-400 shrink-0" />
                  <span className="text-gray-900 font-medium">{a.subject}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Peer evaluations */}
          <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} strokeWidth={1.5} className="text-blue-600" />
              <span className="font-medium text-blue-900 text-[13px]">Lateral / Peer Feedback</span>
              <span className="text-[12px] text-blue-600/60 ml-auto">Members evaluate each other</span>
            </div>
            <div className="space-y-1.5">
              {[
                { reviewer: "Jordan Lee", subject: "Maya Patel" },
                { reviewer: "Jordan Lee", subject: "Chris Wu" },
                { reviewer: "Maya Patel", subject: "Jordan Lee" },
                { reviewer: "Maya Patel", subject: "Chris Wu" },
                { reviewer: "Chris Wu", subject: "Jordan Lee" },
                { reviewer: "Chris Wu", subject: "Maya Patel" },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-white rounded-lg text-[13px]">
                  <span className="text-gray-900 font-medium">{a.reviewer}</span>
                  <ArrowRight size={12} strokeWidth={1.5} className="text-blue-400 shrink-0" />
                  <span className="text-gray-900 font-medium">{a.subject}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Self evaluations */}
          <div className="border border-green-100 bg-green-50/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserCircle size={14} strokeWidth={1.5} className="text-green-600" />
              <span className="font-medium text-green-900 text-[13px]">Self-Assessment</span>
              <span className="text-[12px] text-green-600/60 ml-auto">Everyone evaluates themselves</span>
            </div>
            <div className="space-y-1.5">
              {[
                "Alex Rivera",
                "Jordan Lee",
                "Maya Patel",
                "Chris Wu",
              ].map((name, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-white rounded-lg text-[13px]">
                  <span className="text-gray-900 font-medium">{name}</span>
                  <ArrowRight size={12} strokeWidth={1.5} className="text-green-400 shrink-0" />
                  <span className="text-gray-900 font-medium">{name}</span>
                  <span className="text-gray-400 ml-auto text-[11px]">Self</span>
                </div>
              ))}
            </div>
          </div>

          <InfoBox>
            That&apos;s <strong>16 evaluations</strong> automatically generated from just <strong>4 people</strong>:
            3 downward, 3 upward, 6 peer, and 4 self-assessments.
            Every team member both gives and receives feedback from multiple directions &mdash; that&apos;s the power of 360°.
          </InfoBox>
        </div>
      </Card>

      {/* Cross-team: Full picture for Alex Rivera */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50">
              <UserCircle size={20} strokeWidth={1.5} className="text-brand-500" />
            </div>
            <div>
              <CardTitle>The Full 360°: Alex Rivera Across Teams</CardTitle>
              <CardDescription>
                Most people belong to multiple teams. Here&apos;s how feedback aggregates across all of Alex&apos;s teams.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="mt-4 space-y-4">
          <p className="text-callout text-gray-500">
            Alex Rivera is a <strong>Manager</strong> of the Platform Team, but also a <strong>Member</strong> in
            the Engineering Management team (reporting to Sarah Chen). The 360° review combines feedback from both teams:
          </p>

          {/* What Alex receives */}
          <div className="border border-green-100 bg-green-50/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} strokeWidth={1.5} className="text-green-600" />
              <span className="font-medium text-green-900 text-[14px]">Feedback Alex receives (7 evaluations)</span>
            </div>
            <div className="space-y-1.5">
              {[
                { name: "Sarah Chen", rel: "Manager", team: "Engineering Management", color: "text-amber-600", bg: "bg-amber-50" },
                { name: "Priya Sharma", rel: "Peer", team: "Engineering Management", color: "text-blue-600", bg: "bg-blue-50" },
                { name: "Dan Kim", rel: "Peer", team: "Engineering Management", color: "text-blue-600", bg: "bg-blue-50" },
                { name: "Jordan Lee", rel: "Member", team: "Platform Team", color: "text-purple-600", bg: "bg-purple-50" },
                { name: "Maya Patel", rel: "Member", team: "Platform Team", color: "text-purple-600", bg: "bg-purple-50" },
                { name: "Chris Wu", rel: "Member", team: "Platform Team", color: "text-purple-600", bg: "bg-purple-50" },
                { name: "Alex Rivera", rel: "Self", team: "Self-assessment", color: "text-green-600", bg: "bg-green-50" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 py-2 px-3 bg-white rounded-lg text-[13px]">
                  <span className="text-gray-900 font-medium min-w-[110px]">{f.name}</span>
                  <ArrowRight size={12} strokeWidth={1.5} className="text-gray-300 shrink-0" />
                  <span className="text-gray-500">Alex</span>
                  <span className="ml-auto flex items-center gap-2">
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", f.bg, f.color)}>{f.rel}</span>
                    <span className="text-[11px] text-gray-400">{f.team}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* What Alex gives */}
          <div className="border border-gray-100 bg-gray-50/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} strokeWidth={1.5} className="text-gray-600" />
              <span className="font-medium text-gray-900 text-[14px]">Evaluations Alex gives (7 evaluations)</span>
            </div>
            <div className="space-y-1.5">
              {[
                { name: "Sarah Chen", rel: "Upward", team: "Engineering Management", note: "Evaluates their Manager" },
                { name: "Priya Sharma", rel: "Peer", team: "Engineering Management", note: "Evaluates a Peer" },
                { name: "Dan Kim", rel: "Peer", team: "Engineering Management", note: "Evaluates a Peer" },
                { name: "Jordan Lee", rel: "Downward", team: "Platform Team", note: "Evaluates a Member" },
                { name: "Maya Patel", rel: "Downward", team: "Platform Team", note: "Evaluates a Member" },
                { name: "Chris Wu", rel: "Downward", team: "Platform Team", note: "Evaluates a Member" },
                { name: "Alex Rivera", rel: "Self", team: "Self-assessment", note: "Self-assessment" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 py-2 px-3 bg-white rounded-lg text-[13px]">
                  <span className="text-gray-500">Alex</span>
                  <ArrowRight size={12} strokeWidth={1.5} className="text-gray-300 shrink-0" />
                  <span className="text-gray-900 font-medium min-w-[110px]">{f.name}</span>
                  <span className="text-gray-400 ml-auto text-[11px]">{f.note}</span>
                </div>
              ))}
            </div>
          </div>

          <TipBox>
            Alex&apos;s final report will show scores broken down by relationship type &mdash;{" "}
            <strong>1 manager</strong>, <strong>2 peers</strong>, <strong>3 members</strong> (upward feedback),
            and <strong>1 self-assessment</strong>.
            This multi-perspective view reveals blind spots that a single manager review would miss.
            For example, Alex might rate their own communication highly, while members flag
            that status updates could be more frequent.
          </TipBox>
        </div>
      </Card>

      {/* Why 360° matters */}
      <Card padding="sm">
        <div className="p-2">
          <h3 className="text-headline text-gray-900 mb-3">Why 360° feedback matters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "Reduces bias", desc: "One manager's opinion is just one data point. 360° feedback balances multiple perspectives." },
              { title: "Surfaces blind spots", desc: "Peers and members see behaviors that managers don't. Upward feedback improves leadership." },
              { title: "Builds accountability", desc: "When feedback comes from all directions, everyone is accountable to everyone they work with." },
              { title: "Drives growth", desc: "Employees get specific, actionable feedback from the people who interact with them daily." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <CheckCircle2 size={16} strokeWidth={1.5} className="text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-medium text-gray-900">{item.title}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

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
              In Performs360, <strong>teams</strong> are the building blocks of your evaluation cycles.
              Each team represents a functional group within your organization. Team members are assigned
              one of two roles &mdash; <strong>Manager</strong> or <strong>Member</strong> &mdash;
              which determines the evaluation relationships during review cycles. Peer feedback is
              automatically derived &mdash; all Members in the same team evaluate each other as peers.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Briefcase size={18} strokeWidth={1.5} className="text-amber-500" />
            </div>
            <h3 className="text-headline text-gray-900">Manager</h3>
          </div>
          <p className="text-callout text-gray-500">
            Team leads, engineering managers, directors. They evaluate their members (downward)
            and receive upward feedback from them.
          </p>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <UserCircle size={18} strokeWidth={1.5} className="text-blue-500" />
            </div>
            <h3 className="text-headline text-gray-900">Member</h3>
          </div>
          <p className="text-callout text-gray-500">
            Team members who report to a manager. They receive evaluations from their manager,
            give upward feedback, and automatically evaluate each other as peers.
          </p>
        </Card>
      </div>

      <InfoBox>
        Only two roles to pick from when adding someone to a team: <strong>Manager</strong> or <strong>Member</strong>.
        The system automatically generates all four feedback directions (downward, upward, lateral, and self) from these two roles.
      </InfoBox>
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
                  <Badge variant="info">Member</Badge>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg">
                  <span>Maya Patel (Engineer)</span>
                  <Badge variant="info">Member</Badge>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg">
                  <span>Chris Wu (Junior Engineer)</span>
                  <Badge variant="info">Member</Badge>
                </div>
              </div>
            </div>
          </Card>
          <div className="mt-3">
            <TipBox>
              A person can be a <strong>Manager</strong> in one team and a <strong>Member</strong> in
              another. For example, Sarah Chen is a Member in the Leadership Team (evaluated by the CTO),
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
                  { reviewer: "Alex Rivera", subject: "Jordan Lee", rel: "Manager \u2192 Member" },
                  { reviewer: "Alex Rivera", subject: "Maya Patel", rel: "Manager \u2192 Member" },
                  { reviewer: "Alex Rivera", subject: "Chris Wu", rel: "Manager \u2192 Member" },
                  { reviewer: "Jordan Lee", subject: "Alex Rivera", rel: "Member \u2192 Manager" },
                  { reviewer: "Maya Patel", subject: "Alex Rivera", rel: "Member \u2192 Manager" },
                  { reviewer: "Jordan Lee", subject: "Maya Patel", rel: "Member \u2192 Member (Peer)" },
                  { reviewer: "Alex Rivera", subject: "Alex Rivera", rel: "Self-assessment" },
                  { reviewer: "Jordan Lee", subject: "Jordan Lee", rel: "Self-assessment" },
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
            Reviewers don&apos;t need a Performs360 account. They receive a secure link,
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
                  <p className="font-medium text-gray-900">Alex Rivera (Manager) receives 4 evaluation links:</p>
                </div>
                <div className="space-y-1.5 ml-5">
                  {[
                    { subject: "Jordan Lee", note: "Evaluates as their Manager" },
                    { subject: "Maya Patel", note: "Evaluates as their Manager" },
                    { subject: "Chris Wu", note: "Evaluates as their Manager" },
                    { subject: "Alex Rivera", note: "Self-assessment" },
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
                  <p className="font-medium text-gray-900">Jordan Lee (Member) receives 4 evaluation links:</p>
                </div>
                <div className="space-y-1.5 ml-5">
                  {[
                    { subject: "Alex Rivera", note: "Evaluates their Manager (upward feedback)" },
                    { subject: "Maya Patel", note: "Evaluates a fellow Member (peer feedback)" },
                    { subject: "Chris Wu", note: "Evaluates a fellow Member (peer feedback)" },
                    { subject: "Jordan Lee", note: "Self-assessment" },
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
          description="As reviewers submit their forms, the system collects feedback from every direction — manager, peers, and members. Here's what this looks like for one employee:"
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

              {/* Upward feedback from members */}
              <div className="border border-purple-100 bg-purple-50/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle size={14} strokeWidth={1.5} className="text-purple-600" />
                  <span className="font-medium text-purple-900 text-[13px]">Upward Feedback (from Members)</span>
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
                <div className="grid grid-cols-5 gap-2">
                  <div className="text-center py-2 px-2 bg-white rounded-lg">
                    <p className="text-[11px] text-gray-400 mb-0.5">Manager Avg</p>
                    <p className="text-[16px] font-semibold text-amber-600">4.5</p>
                  </div>
                  <div className="text-center py-2 px-2 bg-white rounded-lg">
                    <p className="text-[11px] text-gray-400 mb-0.5">Member Avg</p>
                    <p className="text-[16px] font-semibold text-purple-600">4.3</p>
                  </div>
                  <div className="text-center py-2 px-2 bg-white rounded-lg">
                    <p className="text-[11px] text-gray-400 mb-0.5">Peer Avg</p>
                    <p className="text-[16px] font-semibold text-blue-600">4.1</p>
                  </div>
                  <div className="text-center py-2 px-2 bg-white rounded-lg">
                    <p className="text-[11px] text-gray-400 mb-0.5">Self</p>
                    <p className="text-[16px] font-semibold text-green-600">4.0</p>
                  </div>
                  <div className="text-center py-2 px-2 bg-white rounded-lg">
                    <p className="text-[11px] text-gray-400 mb-0.5">Overall</p>
                    <p className="text-[16px] font-semibold text-gray-900">4.3</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-3">
            <InfoBox>
              Each employee gets a comprehensive report showing scores from <strong>every direction</strong> —
              manager feedback, peer feedback, upward feedback from members, and their own self-assessment. Open-text
              comments are grouped by relationship type and kept <strong>anonymous</strong> so reviewers
              can be candid. Self-assessment scores are shown separately to highlight self-awareness gaps.
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
                  { icon: Star, label: "Score breakdown by relationship", desc: "See how managers, peers, and members scored the employee separately" },
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
              How different company structures map to Performs360 teams
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
├── Engineer 1      (Member)
├── Engineer 2      (Member)
├── Designer        (Member)
└── Marketing Lead  (Member)`}</div>
          <p className="text-caption mt-3">
            Create a single team. CEO is Manager, everyone else is Member.
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
├── Engineer A    (Member)
├── Designer B    (Member)
└── QA Tester C   (Member)`}</div>
            <div className="font-mono text-[13px] text-gray-600 bg-gray-50 rounded-lg p-4 leading-relaxed whitespace-pre">{`Team: "Engineering Dept"
├── VP Engineering (Manager)
├── Engineer A     (Member)
├── Engineer C     (Member)
└── Engineer D     (Member)`}</div>
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
├── Senior Designer 1   (Member)
├── Senior Designer 2   (Member)
├── Junior Designer 1   (Member)
└── Junior Designer 2   (Member)`}</div>
          <p className="text-caption mt-3">
            Performs360 supports multiple managers per team. Both managers evaluate all members,
            and reports show aggregated scores from each manager.
          </p>
        </div>

        <div className="p-4 border border-gray-100 rounded-xl">
          <h4 className="text-headline text-gray-900 mb-1">Cross-Functional Squad</h4>
          <p className="text-callout text-gray-500 mb-3">
            Members from different departments working on the same product. All non-managers are Members and automatically evaluate each other as peers.
          </p>
          <div className="font-mono text-[13px] text-gray-600 bg-gray-50 rounded-lg p-4 leading-relaxed whitespace-pre">{`Team: "Growth Squad"
├── Product Manager     (Manager)
├── Backend Engineer    (Member)
├── Frontend Engineer   (Member)
├── Designer            (Member)
├── Data Analyst        (Member)
└── Marketing Specialist(Member)`}</div>
          <p className="text-caption mt-3">
            All Members automatically evaluate each other as peers. The Product Manager evaluates
            everyone (downward), and everyone evaluates the Product Manager (upward).
          </p>
        </div>
      </div>
    </Card>
  );
}

// ─── Section Content Map ───

const sectionComponents: Record<SectionId, () => React.JSX.Element> = {
  "how-360-works": How360WorksSection,
  "roles": RolesSection,
  "example-org": ExampleOrgSection,
  "creating-teams": CreatingTeamsSection,
  "running-cycles": RunningCyclesSection,
  "reports": ReportsSection,
  "org-patterns": OrgPatternsSection,
};

// ─── Page ───

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<SectionId>("how-360-works");

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
