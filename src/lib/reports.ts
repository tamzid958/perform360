import { prisma } from "@/lib/prisma";
import { decrypt, deriveKey, decryptDataKey } from "@/lib/encryption";
import type {
  IndividualReport,
  IndividualSummary,
  CategoryScore,
  RelationshipScores,
  QuestionDetail,
  TextFeedbackGroup,
  CycleReport,
  TeamCompletionRate,
  ParticipationStats,
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
 * Decrypt the company data key using the server-side passphrase.
 * In the full E2EE flow, this would use the admin's session-cached passphrase.
 */
export function getDataKey(
  encryptionKeyEncrypted: string,
  encryptionSalt: string
): Buffer {
  const passphrase = process.env.ENCRYPTION_PASSPHRASE;
  if (!passphrase) {
    throw new Error("Server encryption configuration error");
  }
  const salt = Buffer.from(encryptionSalt, "base64");
  const masterKey = deriveKey(passphrase, salt);
  return decryptDataKey(encryptionKeyEncrypted, masterKey);
}

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
 */
export async function getDecryptedResponsesForSubject(
  cycleId: string,
  subjectId: string,
  companyId: string
): Promise<DecryptedResponse[]> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      encryptionKeyEncrypted: true,
      encryptionSalt: true,
    },
  });

  if (!company?.encryptionSalt) {
    throw new Error("Company encryption not configured");
  }

  const dataKey = getDataKey(company.encryptionKeyEncrypted, company.encryptionSalt);

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
  companyId: string
): Promise<IndividualReport> {
  const [cycle, subject, template] = await Promise.all([
    prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
      select: { name: true, templateId: true },
    }),
    prisma.user.findUnique({
      where: { id: subjectId },
      select: { name: true },
    }),
    prisma.evaluationCycle
      .findUnique({ where: { id: cycleId }, select: { templateId: true } })
      .then((c) =>
        c
          ? prisma.evaluationTemplate.findUnique({
              where: { id: c.templateId },
              select: { sections: true },
            })
          : null
      ),
  ]);

  if (!cycle || !subject || !template) {
    throw new Error("Cycle, subject, or template not found");
  }

  const sections = template.sections as unknown as TemplateSection[];
  const responses = await getDecryptedResponsesForSubject(cycleId, subjectId, companyId);

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
  companyId: string
): Promise<CycleReport> {
  const cycle = await prisma.evaluationCycle.findUnique({
    where: { id: cycleId },
    select: { name: true, templateId: true },
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
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { encryptionKeyEncrypted: true, encryptionSalt: true },
  });

  const scoreDistribution: number[] = [0, 0, 0, 0, 0]; // Buckets: 1, 2, 3, 4, 5
  const individualSummaries: IndividualSummary[] = [];

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

  if (company?.encryptionSalt && completedAssignments > 0) {
    const dataKey = getDataKey(company.encryptionKeyEncrypted, company.encryptionSalt);

    const template = await prisma.evaluationTemplate.findUnique({
      where: { id: cycle.templateId },
      select: { sections: true },
    });

    if (template) {
      const sections = template.sections as unknown as TemplateSection[];
      const ratingQuestionIds = new Set(
        sections
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
        },
      });

      // Per-subject score accumulation
      const subjectScores = new Map<string, { total: number; count: number }>();

      for (const resp of allResponses) {
        try {
          const answers = decryptResponse(
            resp.answersEncrypted,
            resp.answersIv,
            resp.answersTag,
            dataKey
          );

          const accum = subjectScores.get(resp.subjectId) ?? { total: 0, count: 0 };

          for (const [key, value] of Object.entries(answers)) {
            if (ratingQuestionIds.has(key) && typeof value === "number") {
              const bucket = Math.min(Math.max(Math.round(value), 1), 5) - 1;
              scoreDistribution[bucket]++;
              accum.total += value;
              accum.count++;
            }
          }

          subjectScores.set(resp.subjectId, accum);
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
    }
  } else {
    // No encryption or no completed assignments — just return counts without scores
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
  };
}
