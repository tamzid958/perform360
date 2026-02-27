import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import type {
  IndividualReport,
  IndividualSummary,
  CategoryScore,
  RelationshipScores,
  RelationshipWeights,
  QuestionDetail,
  TextFeedbackGroup,
  CycleReport,
  TeamCompletionRate,
  TeamScore,
  ParticipationStats,
  SubmissionTrendPoint,
  SubjectContext,
  ResponseRate,
  ReviewerBreakdownItem,
  SelfVsOthersItem,
} from "@/types/report";

// ─── Types ───

export interface TemplateQuestion {
  id: string;
  text: string;
  type: "rating_scale" | "text" | "multiple_choice";
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
}

export interface TemplateSection {
  title: string;
  description?: string;
  questions: TemplateQuestion[];
}

export type DecryptedAnswers = Record<string, string | number | boolean>;

interface DecryptedResponse {
  reviewerId: string;
  subjectId: string;
  relationship: string;
  templateId: string;
  answers: DecryptedAnswers;
  submittedAt: Date | null;
}

// ─── Decryption ───

/**
 * Decrypt a single evaluation response's answers.
 */
export function decryptResponse(
  encrypted: string,
  iv: string,
  tag: string,
  dataKey: Buffer
): DecryptedAnswers {
  const json = decrypt(encrypted, iv, tag, dataKey);
  return JSON.parse(json) as DecryptedAnswers;
}

/**
 * Fetch and decrypt all evaluation responses for a subject in a cycle.
 * The caller must provide the pre-derived data key (from session cookie).
 */
export async function getDecryptedResponsesForSubject(
  cycleId: string,
  subjectId: string,
  dataKey: Buffer
): Promise<DecryptedResponse[]> {
  const responses = await prisma.evaluationResponse.findMany({
    where: {
      subjectId,
      assignment: { cycleId },
    },
    select: {
      reviewerId: true,
      subjectId: true,
      answersEncrypted: true,
      answersIv: true,
      answersTag: true,
      submittedAt: true,
      assignment: { select: { relationship: true, templateId: true } },
    },
  });

  const results: DecryptedResponse[] = [];
  for (const r of responses) {
    try {
      results.push({
        reviewerId: r.reviewerId,
        subjectId: r.subjectId,
        relationship: r.assignment.relationship,
        templateId: r.assignment.templateId,
        answers: decryptResponse(r.answersEncrypted, r.answersIv, r.answersTag, dataKey),
        submittedAt: r.submittedAt,
      });
    } catch {
      // Skip responses that can't be decrypted (e.g. encrypted with a previous key)
    }
  }
  return results;
}

// ─── Aggregation Helpers ───

/**
 * Extract all rating-type scores from decrypted answers using the template.
 */
export function extractRatingScores(
  answers: DecryptedAnswers,
  questions: TemplateQuestion[]
): { questionId: string; score: number }[] {
  const results: { questionId: string; score: number }[] = [];
  for (const q of questions) {
    if (q.type === "rating_scale") {
      const value = answers[q.id];
      if (typeof value === "number") {
        results.push({ questionId: q.id, score: value });
      }
    }
  }
  return results;
}

/**
 * Build category (section) scores from responses.
 */
export function buildCategoryScores(
  responses: DecryptedResponse[],
  sections: TemplateSection[]
): CategoryScore[] {
  return sections
    .filter((section) =>
      section.questions.some((q) => q.type === "rating_scale")
    )
    .map((section) => {
      const ratingQuestions = section.questions.filter(
        (q) => q.type === "rating_scale"
      );

      let totalScore = 0;
      let totalCount = 0;
      const maxScale = ratingQuestions[0]?.scaleMax ?? 5;

      for (const resp of responses) {
        for (const q of ratingQuestions) {
          const value = resp.answers[q.id];
          if (typeof value === "number") {
            totalScore += value;
            totalCount++;
          }
        }
      }

      return {
        category: section.title,
        score: totalCount > 0 ? parseFloat((totalScore / totalCount).toFixed(2)) : 0,
        maxScore: maxScale,
      };
    });
}

/**
 * Build scores grouped by evaluator relationship.
 */
export function buildRelationshipScores(
  responses: DecryptedResponse[],
  sections: TemplateSection[]
): RelationshipScores {
  const allQuestions = sections.flatMap((s) => s.questions);
  const ratingQuestions = allQuestions.filter(
    (q) => q.type === "rating_scale"
  );

  const groups: Record<string, number[]> = {
    manager: [],
    peer: [],
    direct_report: [],
    self: [],
    external: [],
  };

  for (const resp of responses) {
    const scores = extractRatingScores(resp.answers, ratingQuestions);
    const avgForResponse =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
        : null;

    if (avgForResponse !== null && groups[resp.relationship]) {
      groups[resp.relationship].push(avgForResponse);
    }
  }

  const avg = (arr: number[]): number | null =>
    arr.length > 0
      ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2))
      : null;

  return {
    manager: avg(groups.manager),
    peer: avg(groups.peer),
    directReport: avg(groups.direct_report),
    self: avg(groups.self),
    external: avg(groups.external),
  };
}

/**
 * Build per-question detail with distribution and average.
 */
export function buildQuestionDetails(
  responses: DecryptedResponse[],
  sections: TemplateSection[]
): QuestionDetail[] {
  const allQuestions = sections.flatMap((s) => s.questions);

  return allQuestions
    .filter((q) => q.type === "rating_scale" || q.type === "multiple_choice")
    .map((q) => {
      const distribution: Record<string, number> = {};
      let totalScore = 0;
      let count = 0;

      for (const resp of responses) {
        const value = resp.answers[q.id];
        if (value !== undefined && value !== "") {
          const key = String(value);
          distribution[key] = (distribution[key] ?? 0) + 1;

          if (typeof value === "number") {
            totalScore += value;
            count++;
          }
        }
      }

      return {
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        averageScore: count > 0 ? parseFloat((totalScore / count).toFixed(2)) : null,
        distribution,
        responseCount: responses.filter((r) => r.answers[q.id] !== undefined).length,
      };
    });
}

/**
 * Group open-text feedback by relationship type (anonymized).
 */
export function buildTextFeedback(
  responses: DecryptedResponse[],
  sections: TemplateSection[]
): TextFeedbackGroup[] {
  const allQuestions = sections.flatMap((s) => s.questions);
  const textQuestions = allQuestions.filter((q) => q.type === "text");

  const groups: TextFeedbackGroup[] = [];

  for (const q of textQuestions) {
    const byRelationship: Record<string, string[]> = {};

    for (const resp of responses) {
      const value = resp.answers[q.id];
      if (typeof value === "string" && value.trim().length > 0) {
        const rel = resp.relationship;
        if (!byRelationship[rel]) byRelationship[rel] = [];
        byRelationship[rel].push(value.trim());
      }
    }

    for (const [relationship, feedbackItems] of Object.entries(byRelationship)) {
      groups.push({
        questionId: q.id,
        questionText: q.text,
        relationship,
        responses: feedbackItems,
      });
    }
  }

  return groups;
}

/**
 * Calculate the overall score across all rating responses.
 */
export function calculateOverallScore(
  responses: DecryptedResponse[],
  sections: TemplateSection[]
): number {
  const allQuestions = sections.flatMap((s) => s.questions);
  const ratingQuestions = allQuestions.filter(
    (q) => q.type === "rating_scale"
  );

  let total = 0;
  let count = 0;

  for (const resp of responses) {
    for (const q of ratingQuestions) {
      const value = resp.answers[q.id];
      if (typeof value === "number") {
        total += value;
        count++;
      }
    }
  }

  return count > 0 ? parseFloat((total / count).toFixed(2)) : 0;
}

// ─── Weighted Scoring ───

/**
 * Resolve which weight profile to use for a subject.
 * If manager-subject weights exist and the subject is a MANAGER in this team,
 * use the manager profile. Otherwise fall back to the member profile.
 * Legacy mode (managerWeights=null) → single weight set for all roles.
 */
export function resolveWeightsForSubject(
  memberWeights: WeightConfig | null,
  managerWeights: WeightConfig | null,
  subjectTeamRole: string | null,
): WeightConfig | null {
  if (!managerWeights) return memberWeights;
  if (subjectTeamRole === "MANAGER") return managerWeights;
  return memberWeights;
}

export interface WeightConfig {
  manager: number;
  peer: number;
  directReport: number;
  self: number;
  external: number;
}

const WEIGHT_REL_KEYS: [keyof WeightConfig, string][] = [
  ["manager", "manager"],
  ["peer", "peer"],
  ["directReport", "direct_report"],
  ["self", "self"],
  ["external", "external"],
];

/**
 * Apply percentage weights to per-relationship average scores.
 * Redistributes weight from relationship types that have no data
 * proportionally among types that do.
 */
export function applyWeightsToRelationshipAverages(
  relGroups: Record<string, number[]>,
  weights: WeightConfig | null
): { score: number; appliedWeights: RelationshipWeights } | null {
  if (!weights) return null;

  const avg = (arr: number[]): number | null =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const averages: Record<string, number | null> = {
    manager: avg(relGroups.manager ?? []),
    peer: avg(relGroups.peer ?? []),
    directReport: avg(relGroups.direct_report ?? []),
    self: avg(relGroups.self ?? []),
    external: avg(relGroups.external ?? []),
  };

  const presentKeys = WEIGHT_REL_KEYS.filter(([wk]) => averages[wk] !== null);
  const absentWeightSum = WEIGHT_REL_KEYS
    .filter(([wk]) => averages[wk] === null)
    .reduce((sum, [wk]) => sum + weights[wk], 0);

  if (presentKeys.length === 0) {
    return {
      score: 0,
      appliedWeights: { manager: 0, peer: 0, directReport: 0, self: 0, external: 0 },
    };
  }

  const presentWeightSum = presentKeys.reduce((sum, [wk]) => sum + weights[wk], 0);

  const appliedWeights: Record<string, number> = {};
  let weightedScore = 0;

  for (const [wk] of WEIGHT_REL_KEYS) {
    if (averages[wk] === null) {
      appliedWeights[wk] = 0;
    } else {
      const adjusted = presentWeightSum > 0
        ? weights[wk] + (weights[wk] / presentWeightSum) * absentWeightSum
        : 1 / presentKeys.length;
      appliedWeights[wk] = adjusted;
      weightedScore += (averages[wk] as number) * adjusted;
    }
  }

  return {
    score: parseFloat(weightedScore.toFixed(2)),
    appliedWeights: appliedWeights as unknown as RelationshipWeights,
  };
}

/**
 * Calculate weighted overall score using relationship-type weights.
 * Returns null when weights are null (backward-compatible fallback).
 */
export function calculateWeightedOverallScore(
  responses: DecryptedResponse[],
  sections: TemplateSection[],
  weights: WeightConfig | null
): { score: number; appliedWeights: RelationshipWeights } | null {
  if (!weights) return null;

  const allQuestions = sections.flatMap((s) => s.questions);
  const ratingQuestions = allQuestions.filter((q) => q.type === "rating_scale");

  const groups: Record<string, number[]> = {
    manager: [], peer: [], direct_report: [], self: [], external: [],
  };

  for (const resp of responses) {
    const scores = extractRatingScores(resp.answers, ratingQuestions);
    if (scores.length > 0) {
      const respAvg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
      if (groups[resp.relationship]) {
        groups[resp.relationship].push(respAvg);
      }
    }
  }

  return applyWeightsToRelationshipAverages(groups, weights);
}

/**
 * Build weighted category scores using relationship-type weights.
 * Returns null when weights are null.
 */
export function buildWeightedCategoryScores(
  responses: DecryptedResponse[],
  sections: TemplateSection[],
  weights: WeightConfig | null
): CategoryScore[] | null {
  if (!weights) return null;

  return sections
    .filter((section) =>
      section.questions.some((q) => q.type === "rating_scale")
    )
    .map((section) => {
      const ratingQuestions = section.questions.filter((q) => q.type === "rating_scale");
      const maxScale = ratingQuestions[0]?.scaleMax ?? 5;

      const relGroups: Record<string, number[]> = {
        manager: [], peer: [], direct_report: [], self: [], external: [],
      };

      for (const resp of responses) {
        let total = 0;
        let count = 0;
        for (const q of ratingQuestions) {
          const v = resp.answers[q.id];
          if (typeof v === "number") { total += v; count++; }
        }
        if (count > 0 && relGroups[resp.relationship]) {
          relGroups[resp.relationship].push(total / count);
        }
      }

      const result = applyWeightsToRelationshipAverages(relGroups, weights);
      return {
        category: section.title,
        score: result?.score ?? 0,
        maxScore: maxScale,
      };
    });
}

// ─── Self vs Others ───

/**
 * Build per-category self vs others comparison.
 * This is the core unique value of 360 feedback.
 */
export function buildSelfVsOthers(
  responses: DecryptedResponse[],
  sections: TemplateSection[]
): SelfVsOthersItem[] {
  const GAP_THRESHOLD = 0.75;

  return sections
    .filter((section) => section.questions.some((q) => q.type === "rating_scale"))
    .map((section) => {
      const ratingQuestions = section.questions.filter((q) => q.type === "rating_scale");

      const selfScores: number[] = [];
      const othersScores: number[] = [];

      for (const resp of responses) {
        let total = 0;
        let count = 0;
        for (const q of ratingQuestions) {
          const v = resp.answers[q.id];
          if (typeof v === "number") { total += v; count++; }
        }
        if (count > 0) {
          const avg = total / count;
          if (resp.relationship === "self") {
            selfScores.push(avg);
          } else {
            othersScores.push(avg);
          }
        }
      }

      const selfScore = selfScores.length > 0
        ? parseFloat((selfScores.reduce((a, b) => a + b, 0) / selfScores.length).toFixed(2))
        : null;
      const othersScore = othersScores.length > 0
        ? parseFloat((othersScores.reduce((a, b) => a + b, 0) / othersScores.length).toFixed(2))
        : null;

      const gap = selfScore !== null && othersScore !== null
        ? parseFloat((selfScore - othersScore).toFixed(2))
        : null;

      let insight: SelfVsOthersItem["insight"] = null;
      if (gap !== null) {
        if (gap > GAP_THRESHOLD) insight = "blind_spot";
        else if (gap < -GAP_THRESHOLD) insight = "hidden_strength";
        else insight = "aligned";
      }

      return { category: section.title, selfScore, othersScore, gap, insight };
    });
}

// ─── Full Report Builders ───

/**
 * Build a complete individual report for a subject in a cycle.
 */
export async function buildIndividualReport(
  cycleId: string,
  subjectId: string,
  companyId: string,
  dataKey: Buffer
): Promise<IndividualReport> {
  const [cycle, subject] = await Promise.all([
    prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
      select: { name: true },
    }),
    prisma.user.findUnique({
      where: { id: subjectId },
      select: {
        name: true,
        role: true,
        teamMemberships: {
          include: {
            team: { select: { id: true, name: true } },
            level: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  if (!cycle || !subject) {
    throw new Error("Cycle or subject not found");
  }

  // Build subject context (role, level, teams)
  const subjectContext: SubjectContext = {
    role: subject.role,
    level: subject.teamMemberships[0]?.level?.name ?? null,
    teams: subject.teamMemberships.map((tm) => ({
      id: tm.team.id,
      name: tm.team.name,
      level: tm.level?.name ?? null,
    })),
  };

  // Subject's TeamMember role per team (MANAGER vs MEMBER) — for per-role weight resolution
  const subjectTeamRoleMap = new Map<string, string>(
    subject.teamMemberships.map((tm: any) => [tm.team.id, tm.role])
  );

  // Get all assignments for this subject in this cycle (for response rate + reviewer breakdown)
  const allSubjectAssignments = await prisma.evaluationAssignment.findMany({
    where: { cycleId, subjectId },
    select: { templateId: true, relationship: true, status: true },
  });

  // Response rate
  const totalAssigned = allSubjectAssignments.length;
  const totalCompleted = allSubjectAssignments.filter((a) => a.status === "SUBMITTED").length;
  const responseRate: ResponseRate = {
    total: totalAssigned,
    completed: totalCompleted,
    rate: totalAssigned > 0 ? parseFloat(((totalCompleted / totalAssigned) * 100).toFixed(1)) : 0,
  };

  // Reviewer breakdown by relationship
  const relBreakdownMap = new Map<string, { total: number; completed: number }>();
  for (const a of allSubjectAssignments) {
    const existing = relBreakdownMap.get(a.relationship) ?? { total: 0, completed: 0 };
    existing.total++;
    if (a.status === "SUBMITTED") existing.completed++;
    relBreakdownMap.set(a.relationship, existing);
  }
  const reviewerBreakdown: ReviewerBreakdownItem[] = Array.from(relBreakdownMap.entries()).map(
    ([relationship, counts]) => ({ relationship, ...counts })
  );

  const templateIds = Array.from(new Set(allSubjectAssignments.map((a) => a.templateId)));

  const [templates, cycleTeams] = await Promise.all([
    prisma.evaluationTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, sections: true },
    }),
    prisma.cycleTeam.findMany({
      where: { cycleId },
      select: {
        templateId: true,
        teamId: true,
        weightManager: true,
        weightPeer: true,
        weightDirectReport: true,
        weightSelf: true,
        weightExternal: true,
        mgrWeightManager: true,
        mgrWeightPeer: true,
        mgrWeightDirectReport: true,
        mgrWeightSelf: true,
        mgrWeightExternal: true,
        calibrationOffset: true,
        calibrationJustification: true,
        team: { select: { id: true, name: true } },
      },
    }),
  ]);

  if (templates.length === 0) {
    throw new Error("No templates found for subject's assignments");
  }

  // Build lookup maps for team resolution
  const templateTeamMap = new Map(
    cycleTeams.map((ct) => [ct.templateId, { teamId: ct.team.id, teamName: ct.team.name }])
  );
  const templateSectionsMap = new Map(
    templates.map((t) => [t.id, t.sections as unknown as TemplateSection[]])
  );

  // Merge sections from all templates the subject was evaluated with
  const sections = templates.flatMap(
    (t) => t.sections as unknown as TemplateSection[]
  );

  // Parallel: decrypt responses + fetch calibration overrides
  const [responses, memberCalibrations] = await Promise.all([
    getDecryptedResponsesForSubject(cycleId, subjectId, dataKey),
    prisma.calibrationAdjustment.findMany({
      where: { cycleId, subjectId },
      include: { adjuster: { select: { name: true } } },
    }),
  ]);
  const memberCalibByTeam = new Map(
    memberCalibrations.map((c) => [c.teamId, c])
  );

  // Build per-team breakdowns
  const responsesByTeam = new Map<string, { teamId: string; teamName: string; responses: DecryptedResponse[] }>();
  for (const resp of responses) {
    const team = templateTeamMap.get(resp.templateId);
    if (!team) continue;
    const existing = responsesByTeam.get(team.teamId);
    if (existing) {
      existing.responses.push(resp);
    } else {
      responsesByTeam.set(team.teamId, { ...team, responses: [resp] });
    }
  }

  // Build weight lookup per team — both member and manager profiles
  const teamWeightPairMap = new Map<string, { member: WeightConfig | null; manager: WeightConfig | null }>(
    cycleTeams.map((ct) => [
      ct.team.id,
      {
        member: ct.weightManager !== null
          ? { manager: ct.weightManager, peer: ct.weightPeer!, directReport: ct.weightDirectReport!, self: ct.weightSelf!, external: ct.weightExternal! }
          : null,
        manager: (ct as any).mgrWeightManager !== null
          ? { manager: (ct as any).mgrWeightManager, peer: (ct as any).mgrWeightPeer!, directReport: (ct as any).mgrWeightDirectReport!, self: (ct as any).mgrWeightSelf!, external: (ct as any).mgrWeightExternal! }
          : null,
      },
    ])
  );

  const teamBreakdowns = Array.from(responsesByTeam.values()).map(({ teamId, teamName, responses: teamResponses }) => {
    // Find which templateId this team uses in this cycle
    const teamCycleTeam = cycleTeams.find((ct) => ct.team.id === teamId);
    const teamSections = teamCycleTeam
      ? (teamCycleTeam.templateId ? (templateSectionsMap.get(teamCycleTeam.templateId) ?? sections) : sections)
      : sections;

    const subjectRole = subjectTeamRoleMap.get(teamId) ?? null;
    const pair = teamWeightPairMap.get(teamId);
    const teamWeights = pair ? resolveWeightsForSubject(pair.member, pair.manager, subjectRole) : null;
    const weightedResult = calculateWeightedOverallScore(teamResponses, teamSections, teamWeights);
    const rawScore = calculateOverallScore(teamResponses, teamSections);

    // Calibration: member override takes priority, then team offset
    const memberCalib = memberCalibByTeam.get(teamId);
    const teamOffset = teamCycleTeam?.calibrationOffset ?? null;

    let calibratedScore: number | null = null;
    let calibrationJustification: string | null = null;
    if (memberCalib) {
      calibratedScore = memberCalib.calibratedScore;
      calibrationJustification = memberCalib.justification;
    } else if (teamOffset !== null) {
      calibratedScore = parseFloat(Math.min(5, Math.max(0, rawScore + teamOffset)).toFixed(2));
      calibrationJustification = teamCycleTeam?.calibrationJustification ?? null;
    }

    return {
      teamId,
      teamName,
      overallScore: rawScore,
      weightedOverallScore: weightedResult?.score ?? null,
      appliedWeights: weightedResult?.appliedWeights ?? null,
      categoryScores: buildCategoryScores(teamResponses, teamSections),
      weightedCategoryScores: buildWeightedCategoryScores(teamResponses, teamSections, teamWeights),
      scoresByRelationship: buildRelationshipScores(teamResponses, teamSections),
      questionDetails: buildQuestionDetails(teamResponses, teamSections),
      textFeedback: buildTextFeedback(teamResponses, teamSections),
      calibrationOffset: teamOffset,
      calibratedScore,
      calibrationJustification,
    };
  });

  // Cross-team weighted overall score (average of per-team weighted scores)
  const teamsWithWeights = teamBreakdowns.filter((tb) => tb.weightedOverallScore !== null);
  const weightedOverallScore = teamsWithWeights.length > 0
    ? parseFloat(
        (teamsWithWeights.reduce((sum, tb) => sum + tb.weightedOverallScore!, 0) / teamsWithWeights.length)
          .toFixed(2)
      )
    : null;

  // Overall calibrated score: average of per-team calibrated scores (if any exist)
  const teamsWithCalibration = teamBreakdowns.filter((tb) => tb.calibratedScore !== null);
  const calibratedScore = teamsWithCalibration.length > 0
    ? parseFloat(
        (teamsWithCalibration.reduce((sum, tb) => sum + tb.calibratedScore!, 0) / teamsWithCalibration.length)
          .toFixed(2)
      )
    : null;

  // Find who performed the most recent calibration adjustment
  const latestCalib = memberCalibrations.length > 0
    ? memberCalibrations.reduce((latest, c) => c.updatedAt > latest.updatedAt ? c : latest)
    : null;

  return {
    subjectId,
    subjectName: subject.name,
    cycleId,
    cycleName: cycle.name,
    overallScore: calculateOverallScore(responses, sections),
    weightedOverallScore,
    categoryScores: buildCategoryScores(responses, sections),
    scoresByRelationship: buildRelationshipScores(responses, sections),
    questionDetails: buildQuestionDetails(responses, sections),
    textFeedback: buildTextFeedback(responses, sections),
    teamBreakdowns,
    calibratedScore,
    calibrationJustification: latestCalib?.justification ?? null,
    calibrationAdjustedBy: latestCalib?.adjuster.name ?? null,
    subjectContext,
    responseRate,
    reviewerBreakdown,
    selfVsOthers: buildSelfVsOthers(responses, sections),
  };
}

/**
 * Build a cycle-level aggregate report.
 */
export async function buildCycleReport(
  cycleId: string,
  companyId: string,
  dataKey: Buffer
): Promise<CycleReport> {
  // Parallel: cycle name, assignments, cycleTeam links, calibrations
  const [cycle, assignments, cycleTeamLinks, allCalibrations] = await Promise.all([
    prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
      select: { name: true },
    }),
    prisma.evaluationAssignment.findMany({
      where: { cycleId },
      select: { status: true, subjectId: true, reviewerId: true },
    }),
    prisma.cycleTeam.findMany({
      where: { cycleId },
      select: { teamId: true, calibrationOffset: true },
    }),
    prisma.calibrationAdjustment.findMany({
      where: { cycleId },
      select: {
        subjectId: true,
        teamId: true,
        rawScore: true,
        calibratedScore: true,
        justification: true,
      },
    }),
  ]);

  if (!cycle) throw new Error("Cycle not found");

  // Participation stats
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((a) => a.status === "SUBMITTED").length;
  const pendingAssignments = assignments.filter((a) => a.status === "PENDING").length;
  const inProgressAssignments = assignments.filter((a) => a.status === "IN_PROGRESS").length;
  const completionRate = totalAssignments > 0
    ? parseFloat(((completedAssignments / totalAssignments) * 100).toFixed(1))
    : 0;

  const participationStats: ParticipationStats = {
    totalAssignments,
    completedAssignments,
    pendingAssignments,
    inProgressAssignments,
  };

  // Team completion rates — only teams assigned to this cycle
  const cycleTeamIds = cycleTeamLinks.map((ct) => ct.teamId);
  const calibBySubjectTeam = new Map(
    allCalibrations.map((c) => [`${c.subjectId}:${c.teamId}`, c])
  );
  const teamOffsetMap = new Map(
    cycleTeamLinks.map((ct) => [ct.teamId, ct.calibrationOffset])
  );
  const hasAnyCalibration = allCalibrations.length > 0
    || cycleTeamLinks.some((ct) => ct.calibrationOffset !== null);

  // Build per-subject assignment counts
  const subjectIds = Array.from(new Set(assignments.map((a) => a.subjectId)));
  const subjectAssignmentCounts = new Map<string, { total: number; completed: number }>();
  for (const a of assignments) {
    const existing = subjectAssignmentCounts.get(a.subjectId) ?? { total: 0, completed: 0 };
    existing.total++;
    if (a.status === "SUBMITTED") existing.completed++;
    subjectAssignmentCounts.set(a.subjectId, existing);
  }

  // Parallel: teams, subject names, and cycle teams with weights
  const [teams, subjectUsers, cycleTeams] = await Promise.all([
    prisma.team.findMany({
      where: { id: { in: cycleTeamIds } },
      select: {
        id: true,
        name: true,
        members: { select: { userId: true, role: true } },
      },
    }),
    prisma.user.findMany({
      where: { id: { in: subjectIds }, companyId },
      select: { id: true, name: true },
    }),
    completedAssignments > 0
      ? prisma.cycleTeam.findMany({
          where: { cycleId },
          select: {
            teamId: true,
            templateId: true,
            weightManager: true,
            weightPeer: true,
            weightDirectReport: true,
            weightSelf: true,
            weightExternal: true,
            mgrWeightManager: true,
            mgrWeightPeer: true,
            mgrWeightDirectReport: true,
            mgrWeightSelf: true,
            mgrWeightExternal: true,
          },
        })
      : Promise.resolve([] as Awaited<ReturnType<typeof prisma.cycleTeam.findMany>>),
  ]);
  const subjectNameMap = new Map(subjectUsers.map((u) => [u.id, u.name]));

  const teamCompletionRates: TeamCompletionRate[] = teams.map((team) => {
    const memberIds = new Set(team.members.map((m) => m.userId));
    const teamAssignments = assignments.filter(
      (a) => memberIds.has(a.subjectId) || memberIds.has(a.reviewerId)
    );
    const teamCompleted = teamAssignments.filter((a) => a.status === "SUBMITTED").length;
    const teamTotal = teamAssignments.length;

    return {
      teamId: team.id,
      teamName: team.name,
      total: teamTotal,
      completed: teamCompleted,
      rate: teamTotal > 0 ? parseFloat(((teamCompleted / teamTotal) * 100).toFixed(1)) : 0,
    };
  });

  // Score distribution + individual summaries — decrypt all submitted responses
  const scoreDistribution: number[] = [0, 0, 0, 0, 0]; // Buckets: 1, 2, 3, 4, 5
  const individualSummaries: IndividualSummary[] = [];
  const avgScoreByTeam: TeamScore[] = [];
  let avgScoreByRelationship: RelationshipScores = {
    manager: null,
    peer: null,
    directReport: null,
    self: null,
    external: null,
  };
  const submissionTrend: SubmissionTrendPoint[] = [];

  if (completedAssignments > 0) {
    const templateIds = Array.from(new Set(cycleTeams.map((ct) => ct.templateId).filter((id): id is string => id !== null)));

    const templates = await prisma.evaluationTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { sections: true },
    });

    if (templates.length > 0) {
      const allSections = templates.flatMap(
        (t) => t.sections as unknown as TemplateSection[]
      );
      const ratingQuestionIds = new Set(
        allSections
          .flatMap((s) => s.questions)
          .filter((q) => q.type === "rating_scale")
          .map((q) => q.id)
      );

      const allResponses = await prisma.evaluationResponse.findMany({
        where: { assignment: { cycleId } },
        select: {
          subjectId: true,
          answersEncrypted: true,
          answersIv: true,
          answersTag: true,
          submittedAt: true,
          assignment: { select: { relationship: true } },
        },
      });

      // Build team weight lookup (both member and manager profiles) and subject mappings
      const cycleTeamWeightMap = new Map<string, { member: WeightConfig | null; manager: WeightConfig | null }>(
        cycleTeams.map((ct) => [
          ct.teamId,
          {
            member: ct.weightManager !== null
              ? { manager: ct.weightManager, peer: ct.weightPeer!, directReport: ct.weightDirectReport!, self: ct.weightSelf!, external: ct.weightExternal! }
              : null,
            manager: ct.mgrWeightManager !== null
              ? { manager: ct.mgrWeightManager, peer: ct.mgrWeightPeer!, directReport: ct.mgrWeightDirectReport!, self: ct.mgrWeightSelf!, external: ct.mgrWeightExternal! }
              : null,
          },
        ])
      );

      // Map subjects to their team(s) and role within each team
      const subjectTeamMap = new Map<string, string[]>();
      const subjectTeamRoleMap = new Map<string, Map<string, string>>();
      for (const team of teams) {
        for (const m of team.members) {
          const existing = subjectTeamMap.get(m.userId) ?? [];
          existing.push(team.id);
          subjectTeamMap.set(m.userId, existing);
          if (!subjectTeamRoleMap.has(m.userId)) subjectTeamRoleMap.set(m.userId, new Map());
          subjectTeamRoleMap.get(m.userId)!.set(team.id, m.role);
        }
      }

      // Per-subject score accumulation
      const subjectScores = new Map<string, { total: number; count: number }>();
      // Per-subject per-relationship score accumulation (for weighted scoring)
      const subjectRelScores = new Map<string, Record<string, number[]>>();
      // Per-relationship score accumulation
      const relationshipScoreGroups: Record<string, number[]> = {
        manager: [],
        peer: [],
        direct_report: [],
        self: [],
        external: [],
      };
      // Submission date tracking
      const dailySubmissions = new Map<string, number>();

      for (const resp of allResponses) {
        try {
          const answers = decryptResponse(
            resp.answersEncrypted,
            resp.answersIv,
            resp.answersTag,
            dataKey
          );

          const accum = subjectScores.get(resp.subjectId) ?? { total: 0, count: 0 };
          let respTotal = 0;
          let respCount = 0;

          for (const [key, value] of Object.entries(answers)) {
            if (ratingQuestionIds.has(key) && typeof value === "number") {
              const bucket = Math.min(Math.max(Math.round(value), 1), 5) - 1;
              scoreDistribution[bucket]++;
              accum.total += value;
              accum.count++;
              respTotal += value;
              respCount++;
            }
          }

          subjectScores.set(resp.subjectId, accum);

          // Per-subject per-relationship tracking
          if (respCount > 0) {
            const rel = resp.assignment.relationship;
            if (!subjectRelScores.has(resp.subjectId)) {
              subjectRelScores.set(resp.subjectId, {
                manager: [], peer: [], direct_report: [], self: [], external: [],
              });
            }
            const relMap = subjectRelScores.get(resp.subjectId)!;
            if (relMap[rel]) {
              relMap[rel].push(respTotal / respCount);
            }
          }

          // Relationship scores
          if (respCount > 0) {
            const rel = resp.assignment.relationship;
            if (relationshipScoreGroups[rel]) {
              relationshipScoreGroups[rel].push(respTotal / respCount);
            }
          }

          // Submission trend
          if (resp.submittedAt) {
            const dateKey = new Date(resp.submittedAt).toISOString().split("T")[0];
            dailySubmissions.set(dateKey, (dailySubmissions.get(dateKey) ?? 0) + 1);
          }
        } catch {
          // Skip responses that fail to decrypt (mismatched key version)
        }
      }

      // Build individual summaries with weighted scores
      for (const subjectId of subjectIds) {
        const scores = subjectScores.get(subjectId);
        const counts = subjectAssignmentCounts.get(subjectId) ?? { total: 0, completed: 0 };
        const overallScore = scores && scores.count > 0
          ? parseFloat((scores.total / scores.count).toFixed(2))
          : 0;

        // Compute weighted score using the subject's team weights (role-aware)
        let weightedOverallScore: number | null = null;
        const subjectTeamIds = subjectTeamMap.get(subjectId) ?? [];
        const relScores = subjectRelScores.get(subjectId);
        if (relScores && subjectTeamIds.length > 0) {
          const weightedScores: number[] = [];
          for (const teamId of subjectTeamIds) {
            const pair = cycleTeamWeightMap.get(teamId);
            if (pair) {
              const role = subjectTeamRoleMap.get(subjectId)?.get(teamId) ?? null;
              const weights = resolveWeightsForSubject(pair.member, pair.manager, role);
              if (weights) {
                const result = applyWeightsToRelationshipAverages(relScores, weights);
                if (result) weightedScores.push(result.score);
              }
            }
          }
          if (weightedScores.length > 0) {
            weightedOverallScore = parseFloat(
              (weightedScores.reduce((a, b) => a + b, 0) / weightedScores.length).toFixed(2)
            );
          }
        }

        // Compute calibrated score: member override > team offset > null
        let calibratedScore: number | null = null;
        const sTeamIds = subjectTeamMap.get(subjectId) ?? [];
        const calibScores: number[] = [];
        for (const tid of sTeamIds) {
          const memberCalib = calibBySubjectTeam.get(`${subjectId}:${tid}`);
          const teamOffset = teamOffsetMap.get(tid) ?? null;
          if (memberCalib) {
            calibScores.push(memberCalib.calibratedScore);
          } else if (teamOffset !== null) {
            calibScores.push(parseFloat(Math.min(5, Math.max(0, overallScore + teamOffset)).toFixed(2)));
          }
        }
        if (calibScores.length > 0) {
          calibratedScore = parseFloat(
            (calibScores.reduce((a, b) => a + b, 0) / calibScores.length).toFixed(2)
          );
        }

        individualSummaries.push({
          subjectId,
          subjectName: subjectNameMap.get(subjectId) ?? "Unknown",
          overallScore,
          weightedOverallScore,
          reviewCount: counts.total,
          completedCount: counts.completed,
          calibratedScore,
        });
      }

      // Avg score by relationship
      const avgArr = (arr: number[]): number | null =>
        arr.length > 0
          ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2))
          : null;

      avgScoreByRelationship = {
        manager: avgArr(relationshipScoreGroups.manager),
        peer: avgArr(relationshipScoreGroups.peer),
        directReport: avgArr(relationshipScoreGroups.direct_report),
        self: avgArr(relationshipScoreGroups.self),
        external: avgArr(relationshipScoreGroups.external),
      };

      // Avg score by team (unweighted + weighted, role-aware)
      for (const team of teams) {
        const memberIds = new Set(team.members.map((m) => m.userId));
        let teamTotal = 0;
        let teamCount = 0;
        const teamWeightedScores: number[] = [];
        const teamWeightPair = cycleTeamWeightMap.get(team.id);

        for (const [sid, scores] of Array.from(subjectScores.entries())) {
          if (memberIds.has(sid) && scores.count > 0) {
            teamTotal += scores.total / scores.count;
            teamCount++;

            if (teamWeightPair) {
              const relScores = subjectRelScores.get(sid);
              if (relScores) {
                const role = subjectTeamRoleMap.get(sid)?.get(team.id) ?? null;
                const weights = resolveWeightsForSubject(teamWeightPair.member, teamWeightPair.manager, role);
                if (weights) {
                  const result = applyWeightsToRelationshipAverages(relScores, weights);
                  if (result) teamWeightedScores.push(result.score);
                }
              }
            }
          }
        }
        if (teamCount > 0) {
          const rawAvg = parseFloat((teamTotal / teamCount).toFixed(2));
          const teamOffset = teamOffsetMap.get(team.id) ?? null;

          // Calibrated team avg: use member overrides where available, else apply team offset
          const calibScores: number[] = [];
          for (const [sid, scores] of Array.from(subjectScores.entries())) {
            if (memberIds.has(sid) && scores.count > 0) {
              const memberRaw = scores.total / scores.count;
              const memberCalib = calibBySubjectTeam.get(`${sid}:${team.id}`);
              if (memberCalib) {
                calibScores.push(memberCalib.calibratedScore);
              } else if (teamOffset !== null) {
                calibScores.push(parseFloat(Math.min(5, Math.max(0, memberRaw + teamOffset)).toFixed(2)));
              }
            }
          }

          avgScoreByTeam.push({
            teamId: team.id,
            teamName: team.name,
            avgScore: rawAvg,
            weightedAvgScore: teamWeightedScores.length > 0
              ? parseFloat(
                  (teamWeightedScores.reduce((a, b) => a + b, 0) / teamWeightedScores.length).toFixed(2)
                )
              : null,
            calibratedAvgScore: calibScores.length > 0
              ? parseFloat((calibScores.reduce((a, b) => a + b, 0) / calibScores.length).toFixed(2))
              : null,
          });
        }
      }

      // Build submission trend (sorted by date)
      const sortedDates = Array.from(dailySubmissions.keys()).sort();
      let cumulative = 0;
      for (const date of sortedDates) {
        const count = dailySubmissions.get(date) ?? 0;
        cumulative += count;
        const formatted = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        submissionTrend.push({ date: formatted, count, cumulative });
      }
    }
  } else {
    // No completed assignments — just return counts without scores
    for (const subjectId of subjectIds) {
      const counts = subjectAssignmentCounts.get(subjectId) ?? { total: 0, completed: 0 };
      individualSummaries.push({
        subjectId,
        subjectName: subjectNameMap.get(subjectId) ?? "Unknown",
        overallScore: 0,
        weightedOverallScore: null,
        reviewCount: counts.total,
        completedCount: counts.completed,
        calibratedScore: null,
      });
    }
  }

  return {
    cycleId,
    cycleName: cycle.name,
    completionRate,
    teamCompletionRates,
    scoreDistribution,
    participationStats,
    individualSummaries,
    avgScoreByTeam,
    avgScoreByRelationship,
    submissionTrend,
    isCalibrated: hasAnyCalibration,
  };
}
