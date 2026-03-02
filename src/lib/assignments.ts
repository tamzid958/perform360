import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";

interface GeneratedAssignment {
  cycleId: string;
  templateId: string;
  subjectId: string;
  reviewerId: string;
  relationship: "manager" | "direct_report" | "peer" | "self" | "external";
  token: string;
}

/**
 * Generate evaluation assignments from team structure for a cycle.
 *
 * Each team has its own templateId. Assignments inherit the template
 * from their team. Same reviewer+subject pair can appear multiple times
 * if they share teams with different templates.
 *
 * Rules:
 *  - Manager evaluates each Member (relationship: "manager")
 *  - Each Member evaluates their Manager(s) (relationship: "direct_report")
 *  - Members evaluate each other as peers (relationship: "peer")
 *  - External evaluates all Members and Managers (relationship: "external", one-way)
 *  - Self-evaluation for every non-external member (one per template)
 *  - Deduplication across teams by (subjectId, reviewerId, templateId) key
 */
export function generateAssignmentsFromTeams(
  cycleId: string,
  teams: TeamWithMembers[],
  teamTemplateMap: Map<string, string>
): GeneratedAssignment[] {
  // Deduplicate by "subjectId:reviewerId:templateId" key
  const seen = new Set<string>();
  const assignments: GeneratedAssignment[] = [];

  function addAssignment(
    subjectId: string,
    reviewerId: string,
    relationship: GeneratedAssignment["relationship"],
    templateId: string
  ) {
    const key = `${subjectId}:${reviewerId}:${templateId}`;
    if (seen.has(key)) return;
    seen.add(key);

    assignments.push({
      cycleId,
      templateId,
      subjectId,
      reviewerId,
      relationship,
      token: generateToken(),
    });
  }

  // Track unique (userId, templateId) pairs for self-evaluations
  const selfEvalPairs = new Set<string>();

  for (const team of teams) {
    const templateId = teamTemplateMap.get(team.id);
    if (!templateId) continue;

    const managers = team.members.filter((m) => m.role === "MANAGER");
    const members = team.members.filter((m) => m.role === "MEMBER");
    const externals = team.members.filter((m) => m.role === "EXTERNAL");

    // Track non-external users for self-evaluations (externals don't self-evaluate)
    for (const m of team.members) {
      if (m.role !== "EXTERNAL") {
        selfEvalPairs.add(`${m.userId}:${templateId}`);
      }
    }

    // Manager evaluates each Member (downward)
    for (const mgr of managers) {
      for (const member of members) {
        addAssignment(member.userId, mgr.userId, "manager", templateId);
      }
    }

    // Member evaluates each Manager (upward)
    for (const member of members) {
      for (const mgr of managers) {
        addAssignment(mgr.userId, member.userId, "direct_report", templateId);
      }
    }

    // Peer evaluations: Members evaluate each other
    for (const reviewer of members) {
      for (const subject of members) {
        if (reviewer.userId === subject.userId) continue;
        addAssignment(subject.userId, reviewer.userId, "peer", templateId);
      }
    }

    // External evaluates each Member and Manager (one-way, no incoming evaluations)
    for (const ext of externals) {
      for (const member of members) {
        addAssignment(member.userId, ext.userId, "external", templateId);
      }
      for (const mgr of managers) {
        addAssignment(mgr.userId, ext.userId, "external", templateId);
      }
    }
  }

  // Self-evaluations for every unique (user, template) pair
  selfEvalPairs.forEach((pair) => {
    const [userId, templateId] = pair.split(":");
    addAssignment(userId, userId, "self", templateId);
  });

  return assignments;
}

interface TeamMemberData {
  userId: string;
  role: "MANAGER" | "MEMBER" | "EXTERNAL";
}

interface TeamWithMembers {
  id: string;
  members: TeamMemberData[];
}

export interface TeamTemplatePair {
  teamId: string;
  templateId: string;
}

/**
 * Fetch selected teams with members, then generate
 * and persist assignments in a transaction.
 *
 * Returns the count of created assignments.
 */
export async function createAssignmentsForCycle(
  cycleId: string,
  companyId: string,
  teamTemplatePairs: TeamTemplatePair[]
): Promise<{ count: number; reviewerEmails: ReviewerInfo[] }> {
  const teamIds = teamTemplatePairs.map((p) => p.teamId);

  // Fetch only the selected teams with members
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds }, companyId },
    include: {
      members: {
        select: {
          userId: true,
          role: true,
        },
      },
    },
  });

  if (teams.length === 0) {
    return { count: 0, reviewerEmails: [] };
  }

  // Build teamId → templateId map
  const teamTemplateMap = new Map(
    teamTemplatePairs.map((p) => [p.teamId, p.templateId])
  );

  const assignments = generateAssignmentsFromTeams(cycleId, teams, teamTemplateMap);

  if (assignments.length === 0) {
    return { count: 0, reviewerEmails: [] };
  }

  // Bulk insert assignments
  const created = await prisma.evaluationAssignment.createMany({
    data: assignments,
    skipDuplicates: true,
  });

  // Fetch reviewer info for email sending
  const reviewerIds = Array.from(new Set(assignments.map((a) => a.reviewerId)));
  const users = await prisma.user.findMany({
    where: { id: { in: reviewerIds } },
    select: { id: true, email: true, name: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Build reviewer info with their assignments
  const reviewerInfoMap = new Map<string, ReviewerInfo>();

  for (const assignment of assignments) {
    const reviewer = userMap.get(assignment.reviewerId);
    if (!reviewer) continue;

    if (!reviewerInfoMap.has(reviewer.id)) {
      reviewerInfoMap.set(reviewer.id, {
        reviewerId: reviewer.id,
        email: reviewer.email,
        name: reviewer.name,
        assignments: [],
      });
    }

    const subjectUser = userMap.get(assignment.subjectId);
    reviewerInfoMap.get(reviewer.id)!.assignments.push({
      token: assignment.token,
      subjectName: subjectUser?.name ?? "Unknown",
      relationship: assignment.relationship,
    });
  }

  return {
    count: created.count,
    reviewerEmails: Array.from(reviewerInfoMap.values()),
  };
}

export interface ReviewerInfo {
  reviewerId: string;
  email: string;
  name: string;
  assignments: {
    token: string;
    subjectName: string;
    relationship: string;
  }[];
}
