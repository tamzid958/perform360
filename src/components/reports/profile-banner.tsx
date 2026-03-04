"use client";

import { Badge } from "@/components/ui/badge";
import { Layers, Users, Shield, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { RELATIONSHIP_LABELS } from "@/lib/constants";
import type { SubjectContext, ResponseRate, ReviewerBreakdownItem } from "@/types/report";

interface ProfileBannerProps {
  subjectName: string;
  cycleName: string;
  context: SubjectContext;
  responseRate: ResponseRate;
  reviewerBreakdown: ReviewerBreakdownItem[];
}

function confidenceLevel(rate: number): { label: string; color: string; icon: React.ReactNode } {
  if (rate >= 80) return { label: "High confidence", color: "#34c759", icon: <CheckCircle2 size={12} strokeWidth={2} /> };
  if (rate >= 50) return { label: "Moderate confidence", color: "#ff9f0a", icon: <Clock size={12} strokeWidth={2} /> };
  return { label: "Low confidence", color: "#ff3b30", icon: <AlertCircle size={12} strokeWidth={2} /> };
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  HR: "HR",
  EMPLOYEE: "Employee",
  EXTERNAL: "External",
};

export function ProfileBanner({
  subjectName,
  cycleName,
  context,
  responseRate,
  reviewerBreakdown,
}: ProfileBannerProps) {
  const confidence = confidenceLevel(responseRate.rate);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-5 mb-6">
      {/* Top: Name + Context */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
            {subjectName}
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">{cycleName}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge variant="outline" className="text-[11px]">
              <Shield size={10} strokeWidth={1.5} className="mr-1" />
              {ROLE_LABELS[context.role] ?? context.role}
            </Badge>
            {context.level && (
              <Badge variant="outline" className="text-[11px] text-violet-600 border-violet-200 bg-violet-50">
                <Layers size={10} strokeWidth={1.5} className="mr-1" />
                {context.level}
              </Badge>
            )}
            {context.teams.map((t) => (
              <Badge key={t.id} variant="outline" className="text-[11px] text-blue-600 border-blue-200 bg-blue-50">
                <Users size={10} strokeWidth={1.5} className="mr-1" />
                {t.name}
                {t.level && t.level !== context.level && (
                  <span className="ml-1 text-violet-500">({t.level})</span>
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Response Rate Donut */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke="var(--gray-200)"
                strokeWidth="3"
              />
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke={confidence.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${responseRate.rate * 0.9738} 97.38`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[13px] font-bold text-gray-900">
                {Math.round(responseRate.rate)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-[12px] font-medium text-gray-700">
              {responseRate.completed}/{responseRate.total} responded
            </p>
            <div className="flex items-center gap-1 mt-0.5" style={{ color: confidence.color }}>
              {confidence.icon}
              <span className="text-[11px] font-medium">{confidence.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviewer Breakdown Chips */}
      {reviewerBreakdown.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
          <span className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">
            Reviewers
          </span>
          {reviewerBreakdown.map((rb) => (
            <div
              key={rb.relationship}
              className="flex items-center gap-1.5 text-[12px] text-gray-600 bg-white rounded-lg px-2.5 py-1 border border-gray-100"
            >
              <span className="font-medium">
                {RELATIONSHIP_LABELS[rb.relationship] ?? rb.relationship}
              </span>
              <span className="text-gray-400">
                {rb.completed}/{rb.total}
              </span>
              {rb.completed === rb.total ? (
                <CheckCircle2 size={11} strokeWidth={2} className="text-green-500" />
              ) : (
                <Clock size={11} strokeWidth={2} className="text-gray-300" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
