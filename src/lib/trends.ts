import { prisma } from "@/lib/prisma";
import {
  decryptResponse,
  extractRatingScores,
  type TemplateSection,
  type TemplateQuestion,
} from "@/lib/reports";
import type {
  TrendsReport,
  CycleTrendPoint,
  KpiSummary,
  KpiMetric,
} from "@/types/trends";
import type { CycleStatus } from "@prisma/client";

// ─── Types ───

interface CycleRow {
  id: string;
  name: string;
  status: CycleStatus;
  startDate: Date;
}

// ─── Per-Cycle Aggregation ───

/**
 * Build a single CycleTrendPoint for a scored (non-draft) cycle.
 * Decrypts all responses and computes aggregate-level metrics only.
 */
async function buildScoredCyclePoint(
  cycle: CycleRow,
  companyId: string,
  dataKey: Buffer
): Promise<CycleTrendPoint> {
  // 1 & 2. Fetch assignments and cycle teams in parallel
  const [assignments, cycleTeams] = await Promise.all([
    prisma.evaluationAssignment.findMany({
      where: { cycleId: cycle.id },
      select: { status: true, subjectId: true },
    }),
    prisma.cycleTeam.findMany({
      where: { cycleId: cycle.id },
      select: {
        teamId: true,
        templateId: true,
        team: {
          select: {
            id: true,
            name: true,
            members: { select: { userId: true } },
          },
        },
      },
    }),
  ]);

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((a) => a.status === "SUBMITTED").length;
  const completionRate =
    totalAssignments > 0
      ? parseFloat(((completedAssignments / totalAssignments) * 100).toFixed(1))
      : 0;

  const teamsEvaluated = cycleTeams.length;
  const templateIds = Array.from(
    new Set(cycleTeams.map((ct) => ct.templateId).filter((id): id is string => id !== null))
  );

  // Default return for cycles with no templates or no completed assignments
  const emptyPoint: CycleTrendPoint = {
    cycleId: cycle.id,
    cycleName: cycle.name,
    startDate: cycle.startDate.toISOString(),
    status: cycle.status,
    isDraft: false,
    avgScore: null,
    completionRate,
    totalAssignments,
    completedAssignments,
    teamsEvaluated,
    relationshipScores: { manager: null, peer: null, directReport: null, self: null, external: null },
    teamScores: [],
    topPerformer: null,
  };

  if (completedAssignments === 0 || templateIds.length === 0) {
    return emptyPoint;
  }

  // 3 & 4. Fetch templates and responses in parallel
  const [templates, allResponses] = await Promise.all([
    prisma.evaluationTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { sections: true },
    }),
    prisma.evaluationResponse.findMany({
      where: { assignment: { cycleId: cycle.id } },
      select: {
        subjectId: true,
        answersEncrypted: true,
        answersIv: true,
        answersTag: true,
        assignment: { select: { relationship: true } },
      },
    }),
  ]);

  const allSections = templates.flatMap((t) => t.sections as unknown as TemplateSection[]);
  const ratingQuestions = allSections
    .flatMap((s) => s.questions)
    .filter((q: TemplateQuestion) => q.type === "rating_scale");
  const ratingQuestionIds = new Set(ratingQuestions.map((q) => q.id));

  if (ratingQuestionIds.size === 0) {
    return emptyPoint;
  }

  // 5. Build subject-to-team mapping
  const subjectTeamMap = new Map<string, string[]>();
  for (const ct of cycleTeams) {
    for (const m of ct.team.members) {
      const existing = subjectTeamMap.get(m.userId) ?? [];
      existing.push(ct.team.id);
      subjectTeamMap.set(m.userId, existing);
    }
  }

  // Team name lookup
  const teamNameMap = new Map(cycleTeams.map((ct) => [ct.team.id, ct.team.name]));

  // 6. Aggregate scores
  const subjectScores = new Map<string, { total: number; count: number }>();
  const relationshipGroups: Record<string, number[]> = {
    manager: [],
    peer: [],
    direct_report: [],
    self: [],
    external: [],
  };
  const teamScoreAccum = new Map<string, { total: number; count: number }>();

  for (const resp of allResponses) {
    try {
      const answers = decryptResponse(
        resp.answersEncrypted,
        resp.answersIv,
        resp.answersTag,
        dataKey
      );

      const scores = extractRatingScores(answers, ratingQuestions);
      if (scores.length === 0) continue;

      const respAvg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

      // Per-subject accumulation
      const accum = subjectScores.get(resp.subjectId) ?? { total: 0, count: 0 };
      accum.total += respAvg;
      accum.count++;
      subjectScores.set(resp.subjectId, accum);

      // Per-relationship accumulation
      const rel = resp.assignment.relationship;
      if (relationshipGroups[rel]) {
        relationshipGroups[rel].push(respAvg);
      }

      // Per-team accumulation (via subject's team membership)
      const subjectTeams = subjectTeamMap.get(resp.subjectId) ?? [];
      for (const teamId of subjectTeams) {
        const teamAccum = teamScoreAccum.get(teamId) ?? { total: 0, count: 0 };
        teamAccum.total += respAvg;
        teamAccum.count++;
        teamScoreAccum.set(teamId, teamAccum);
      }
    } catch {
      // Skip responses that fail to decrypt
    }
  }

  // 7. Compute averages
  const avg = (arr: number[]): number | null =>
    arr.length > 0
      ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2))
      : null;

  // Overall avg score across all subjects
  let totalScore = 0;
  let totalCount = 0;
  for (const [, scores] of subjectScores) {
    if (scores.count > 0) {
      totalScore += scores.total / scores.count;
      totalCount++;
    }
  }
  const avgScore = totalCount > 0 ? parseFloat((totalScore / totalCount).toFixed(2)) : null;

  // Relationship scores
  const relationshipScores = {
    manager: avg(relationshipGroups.manager),
    peer: avg(relationshipGroups.peer),
    directReport: avg(relationshipGroups.direct_report),
    self: avg(relationshipGroups.self),
    external: avg(relationshipGroups.external),
  };

  // Team scores
  const teamScores: CycleTrendPoint["teamScores"] = [];
  for (const [teamId, accum] of teamScoreAccum) {
    if (accum.count > 0) {
      teamScores.push({
        teamId,
        teamName: teamNameMap.get(teamId) ?? "Unknown",
        avgScore: parseFloat((accum.total / accum.count).toFixed(2)),
      });
    }
  }

  // Top performer (highest avg score among subjects)
  let topPerformer: CycleTrendPoint["topPerformer"] = null;
  let topScore = -1;
  let topSubjectId = "";
  for (const [subjectId, scores] of subjectScores) {
    if (scores.count > 0) {
      const subjectAvg = scores.total / scores.count;
      if (subjectAvg > topScore) {
        topScore = subjectAvg;
        topSubjectId = subjectId;
      }
    }
  }

  if (topSubjectId) {
    const topUser = await prisma.user.findUnique({
      where: { id: topSubjectId },
      select: { name: true },
    });
    topPerformer = {
      subjectId: topSubjectId,
      subjectName: topUser?.name ?? "Unknown",
      score: parseFloat(topScore.toFixed(2)),
    };
  }

  return {
    cycleId: cycle.id,
    cycleName: cycle.name,
    startDate: cycle.startDate.toISOString(),
    status: cycle.status,
    isDraft: false,
    avgScore,
    completionRate,
    totalAssignments,
    completedAssignments,
    teamsEvaluated,
    relationshipScores,
    teamScores,
    topPerformer,
  };
}

/**
 * Build a CycleTrendPoint for a draft cycle (no score data).
 */
async function buildDraftCyclePoint(cycle: CycleRow): Promise<CycleTrendPoint> {
  const [assignmentCount, teamCount] = await Promise.all([
    prisma.evaluationAssignment.count({ where: { cycleId: cycle.id } }),
    prisma.cycleTeam.count({ where: { cycleId: cycle.id } }),
  ]);

  return {
    cycleId: cycle.id,
    cycleName: cycle.name,
    startDate: cycle.startDate.toISOString(),
    status: cycle.status,
    isDraft: true,
    avgScore: null,
    completionRate: null,
    totalAssignments: assignmentCount,
    completedAssignments: 0,
    teamsEvaluated: teamCount,
    relationshipScores: { manager: null, peer: null, directReport: null, self: null, external: null },
    teamScores: [],
    topPerformer: null,
  };
}

// ─── KPI Summary ───

function buildKpiMetric(values: (number | null)[]): KpiMetric {
  const nonNull = values.filter((v): v is number => v !== null);
  if (nonNull.length === 0) {
    return { current: null, rollingAvg: null, delta: null };
  }

  const current = nonNull[nonNull.length - 1];

  if (nonNull.length < 2) {
    return { current, rollingAvg: null, delta: null };
  }

  const previous = nonNull.slice(0, -1);
  const rollingAvg = parseFloat(
    (previous.reduce((a, b) => a + b, 0) / previous.length).toFixed(2)
  );

  return {
    current,
    rollingAvg,
    delta: parseFloat((current - rollingAvg).toFixed(2)),
  };
}

function buildKpiSummary(scoredCycles: CycleTrendPoint[]): KpiSummary {
  const avgScoreMetric = buildKpiMetric(scoredCycles.map((c) => c.avgScore));
  const completionMetric = buildKpiMetric(scoredCycles.map((c) => c.completionRate));
  const assignmentMetric = buildKpiMetric(scoredCycles.map((c) => c.totalAssignments));
  const teamsMetric = buildKpiMetric(scoredCycles.map((c) => c.teamsEvaluated));

  // Relationship split from latest scored cycle
  const latest = scoredCycles[scoredCycles.length - 1];
  const relationshipSplit = latest?.relationshipScores ?? {
    manager: null,
    peer: null,
    directReport: null,
    self: null,
    external: null,
  };

  // Top performer delta: latest vs previous cycle
  const topScores = scoredCycles.map((c) => c.topPerformer?.score ?? null);
  const nonNullTopScores = topScores.filter((v): v is number => v !== null);
  const currentTop = nonNullTopScores.length > 0 ? nonNullTopScores[nonNullTopScores.length - 1] : null;
  const previousTop = nonNullTopScores.length > 1 ? nonNullTopScores[nonNullTopScores.length - 2] : null;

  return {
    avgScore: avgScoreMetric,
    completionRate: completionMetric,
    assignments: assignmentMetric,
    teamsEvaluated: teamsMetric,
    relationshipSplit,
    topPerformerDelta: {
      current: currentTop,
      previous: previousTop,
      delta: currentTop !== null && previousTop !== null
        ? parseFloat((currentTop - previousTop).toFixed(2))
        : null,
      currentName: latest?.topPerformer?.subjectName ?? null,
    },
  };
}

// ─── Main Export ───

/**
 * Build a cross-cycle trends report for a company.
 * Requires the decryption data key to compute scores.
 */
export async function buildTrendsReport(
  companyId: string,
  dataKey: Buffer
): Promise<TrendsReport> {
  // 1. Fetch all cycles ordered chronologically
  const cycles = await prisma.evaluationCycle.findMany({
    where: { companyId },
    orderBy: { startDate: "asc" },
    select: { id: true, name: true, status: true, startDate: true },
  });

  // 2. Partition into draft vs scored
  const draftCycles = cycles.filter((c) => c.status === "DRAFT");
  const scoredCycles = cycles.filter((c) => c.status !== "DRAFT");

  // 3. Process all cycles in parallel
  const [draftPoints, scoredPoints] = await Promise.all([
    Promise.all(draftCycles.map(buildDraftCyclePoint)),
    Promise.all(scoredCycles.map((c) => buildScoredCyclePoint(c, companyId, dataKey))),
  ]);

  // 4. Merge and sort by startDate
  const allPoints = [...draftPoints, ...scoredPoints].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // 5. Compute KPI summary from scored cycles only
  const sortedScoredPoints = scoredPoints.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  const kpiSummary = buildKpiSummary(sortedScoredPoints);

  // 6. Collect all teams across all cycles
  const teamMap = new Map<string, string>();
  for (const point of allPoints) {
    for (const ts of point.teamScores) {
      teamMap.set(ts.teamId, ts.teamName);
    }
  }
  const allTeams = Array.from(teamMap.entries()).map(([teamId, teamName]) => ({
    teamId,
    teamName,
  }));

  return { cycles: allPoints, kpiSummary, allTeams };
}
