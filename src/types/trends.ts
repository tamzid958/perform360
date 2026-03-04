// ─────────────────────────────────────────────────────────
// Cross-Cycle Trends Report Types
// ─────────────────────────────────────────────────────────

import type { CycleStatus } from "@prisma/client";

/** Per-cycle data point — one entry per cycle in the trends array */
export interface CycleTrendPoint {
  cycleId: string;
  cycleName: string;
  startDate: string; // ISO date
  status: CycleStatus;
  isDraft: boolean;

  // Core KPIs (null for DRAFT cycles with no submitted data)
  avgScore: number | null;
  completionRate: number | null; // 0–100
  totalAssignments: number;
  completedAssignments: number;
  teamsEvaluated: number;

  // Relationship breakdown scores
  relationshipScores: {
    manager: number | null;
    peer: number | null;
    directReport: number | null;
    self: number | null;
    external: number | null;
  };

  // Per-team avg scores (for team overlay chart)
  teamScores: {
    teamId: string;
    teamName: string;
    avgScore: number;
  }[];

  // Top performer in this cycle
  topPerformer: {
    subjectId: string;
    subjectName: string;
    score: number;
  } | null;
}

/** Single KPI metric with current value, rolling average, and delta */
export interface KpiMetric {
  current: number | null;
  rollingAvg: number | null;
  delta: number | null; // current - rollingAvg
}

/** KPI summary comparing latest cycle vs rolling average of all prior */
export interface KpiSummary {
  avgScore: KpiMetric;
  completionRate: KpiMetric;
  assignments: KpiMetric;
  teamsEvaluated: KpiMetric;
  relationshipSplit: {
    manager: number | null;
    peer: number | null;
    directReport: number | null;
    self: number | null;
    external: number | null;
  };
  topPerformerDelta: {
    current: number | null;
    previous: number | null;
    delta: number | null;
    currentName: string | null;
  };
}

/** Full API response shape for GET /api/cycles/trends */
export interface TrendsReport {
  cycles: CycleTrendPoint[]; // ordered by startDate ASC
  kpiSummary: KpiSummary;
  allTeams: { teamId: string; teamName: string }[]; // union across all cycles
}
