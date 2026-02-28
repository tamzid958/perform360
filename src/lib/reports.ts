import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import type {
  IndividualReport,
  IndividualSummary,
  CategoryScore,
  RelationshipScores,
  QuestionDetail,
  TextFeedbackGroup,
  CycleReport,
  TeamCompletionRate,
  TeamScore,
  ParticipationStats,
  SubmissionTrendPoint,
} from "@/types/report";

// ─── Types ───

interface TemplateQuestion {
  id: string;
  text: string;
  type: "rating_scale" | "text" | "multiple_choice" | "yes_no" | "competency_matrix";
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
}

interface TemplateSection {
  title: string;
  description?: string;
  questions: TemplateQuestion[];
}

type DecryptedAnswers = Record<string, string | number | boolean>;

interface DecryptedResponse {
  reviewerId: string;
  subjectId: string;
  relationship: string;
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
    include: {
      assignment: { select: { relationship: true } },
    },
  });

  return responses.map((r) => ({
    reviewerId: r.reviewerId,
    subjectId: r.subjectId,
    relationship: r.assignment.relationship,
    answers: decryptResponse(r.answersEncrypted, r.answersIv, r.answersTag, dataKey),
    submittedAt: r.submittedAt,
  }));
}

// ─── Aggregation Helpers ───

/**
 * Extract all rating-type scores from decrypted answers using the template.
 */
function extractRatingScores(
  answers: DecryptedAnswers,
  questions: TemplateQuestion[]
): { questionId: string; score: number }[] {
  const results: { questionId: string; score: number }[] = [];
  for (const q of questions) {
    if (q.type === "rating_scale" || q.type === "competency_matrix") {
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
  return sections.map((section) => {
    const ratingQuestions = section.questions.filter(
      (q) => q.type === "rating_scale" || q.type === "competency_matrix"
    );

    if (ratingQuestions.length === 0) {
      return { category: section.title, score: 0, maxScore: 5 };
    }

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
    (q) => q.type === "rating_scale" || q.type === "competency_matrix"
  );

  const groups: Record<string, number[]> = {
    manager: [],
    peer: [],
    direct_report: [],
    self: [],
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
    .filter((q) => q.type === "rating_scale" || q.type === "competency_matrix" || q.type === "multiple_choice" || q.type === "yes_no")
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
    (q) => q.type === "rating_scale" || q.type === "competency_matrix"
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
      select: { name: true },
    }),
  ]);

  if (!cycle || !subject) {
    throw new Error("Cycle or subject not found");
  }

  // Get templates from the subject's assignments in this cycle
  const subjectAssignments = await prisma.evaluationAssignment.findMany({
    where: { cycleId, subjectId },
    select: { templateId: true },
  });
  const templateIds = Array.from(new Set(subjectAssignments.map((a) => a.templateId)));

  const templates = await prisma.evaluationTemplate.findMany({
    where: { id: { in: templateIds } },
    select: { sections: true },
  });

  if (templates.length === 0) {
    throw new Error("No templates found for subject's assignments");
  }

  // Merge sections from all templates the subject was evaluated with
  const sections = templates.flatMap(
    (t) => t.sections as unknown as TemplateSection[]
  );

  const responses = await getDecryptedResponsesForSubject(cycleId, subjectId, dataKey);

  return {
    subjectId,
    subjectName: subject.name,
    cycleId,
    cycleName: cycle.name,
    overallScore: calculateOverallScore(responses, sections),
    categoryScores: buildCategoryScores(responses, sections),
    scoresByRelationship: buildRelationshipScores(responses, sections),
    questionDetails: buildQuestionDetails(responses, sections),
    textFeedback: buildTextFeedback(responses, sections),
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
  const cycle = await prisma.evaluationCycle.findUnique({
    where: { id: cycleId },
    select: { name: true },
  });

  if (!cycle) throw new Error("Cycle not found");

  // Participation stats
  const assignments = await prisma.evaluationAssignment.findMany({
    where: { cycleId },
    select: { status: true, subjectId: true, reviewerId: true },
  });

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

  // Team completion rates
  const teams = await prisma.team.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      members: { select: { userId: true } },
    },
  });

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
  };
  const submissionTrend: SubmissionTrendPoint[] = [];

  // Build per-subject assignment counts
  const subjectIds = Array.from(new Set(assignments.map((a) => a.subjectId)));
  const subjectAssignmentCounts = new Map<string, { total: number; completed: number }>();
  for (const a of assignments) {
    const existing = subjectAssignmentCounts.get(a.subjectId) ?? { total: 0, completed: 0 };
    existing.total++;
    if (a.status === "SUBMITTED") existing.completed++;
    subjectAssignmentCounts.set(a.subjectId, existing);
  }

  // Fetch subject names
  const subjectUsers = await prisma.user.findMany({
    where: { id: { in: subjectIds }, companyId },
    select: { id: true, name: true },
  });
  const subjectNameMap = new Map(subjectUsers.map((u) => [u.id, u.name]));

  if (completedAssignments > 0) {
    // Fetch all templates used in this cycle via CycleTeam
    const cycleTeams = await prisma.cycleTeam.findMany({
      where: { cycleId },
      select: { templateId: true },
    });
    const templateIds = Array.from(new Set(cycleTeams.map((ct) => ct.templateId)));

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
          .filter((q) => q.type === "rating_scale" || q.type === "competency_matrix")
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

      // Per-subject score accumulation
      const subjectScores = new Map<string, { total: number; count: number }>();
      // Per-relationship score accumulation
      const relationshipScoreGroups: Record<string, number[]> = {
        manager: [],
        peer: [],
        direct_report: [],
        self: [],
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

      // Build individual summaries
      for (const subjectId of subjectIds) {
        const scores = subjectScores.get(subjectId);
        const counts = subjectAssignmentCounts.get(subjectId) ?? { total: 0, completed: 0 };
        individualSummaries.push({
          subjectId,
          subjectName: subjectNameMap.get(subjectId) ?? "Unknown",
          overallScore: scores && scores.count > 0
            ? parseFloat((scores.total / scores.count).toFixed(2))
            : 0,
          reviewCount: counts.total,
          completedCount: counts.completed,
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
      };

      // Avg score by team
      for (const team of teams) {
        const memberIds = new Set(team.members.map((m) => m.userId));
        let teamTotal = 0;
        let teamCount = 0;
        for (const [sid, scores] of Array.from(subjectScores.entries())) {
          if (memberIds.has(sid) && scores.count > 0) {
            teamTotal += scores.total / scores.count;
            teamCount++;
          }
        }
        if (teamCount > 0) {
          avgScoreByTeam.push({
            teamId: team.id,
            teamName: team.name,
            avgScore: parseFloat((teamTotal / teamCount).toFixed(2)),
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
        reviewCount: counts.total,
        completedCount: counts.completed,
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
  };
}
