import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";

interface GeneratedAssignment {
  cycleId: string;
  subjectId: string;
  reviewerId: string;
  relationship: "manager" | "direct_report" | "peer" | "self";
  token: string;
}

/**
 * Generate evaluation assignments from team structure for a cycle.
 *
 * Rules:
 *  - Manager evaluates each Direct Report (relationship: "manager")
 *  - Each Direct Report evaluates their Manager(s) (relationship: "direct_report")
 *  - All non-manager, non-direct-report members (MEMBER role) evaluate each other as peers
 *  - Peers also evaluate managers and direct reports, and vice versa
 *  - Self-evaluation for every unique member
 *  - Deduplication across teams (same reviewer+subject pair only once)
 */
export function generateAssignmentsFromTeams(
  cycleId: string,
  teams: TeamWithMembers[]
): GeneratedAssignment[] {
  // Use a Set to deduplicate by "subjectId:reviewerId" key
  const seen = new Set<string>();
  const assignments: GeneratedAssignment[] = [];

  function addAssignment(
    subjectId: string,
    reviewerId: string,
    relationship: GeneratedAssignment["relationship"]
  ) {
    const key = `${subjectId}:${reviewerId}`;
    if (seen.has(key)) return;
    seen.add(key);

    assignments.push({
      cycleId,
      subjectId,
      reviewerId,
      relationship,
      token: generateToken(),
    });
  }

  // Collect all unique user IDs across teams for self-evaluations
  const allUserIds = new Set<string>();

  for (const team of teams) {
    const managers = team.members.filter((m) => m.role === "MANAGER");
    const directReports = team.members.filter((m) => m.role === "DIRECT_REPORT");

    // Track all users
    for (const m of team.members) {
      allUserIds.add(m.userId);
    }

    // Manager evaluates each Direct Report
    for (const mgr of managers) {
      for (const dr of directReports) {
        addAssignment(dr.userId, mgr.userId, "manager");
      }
    }

    // Direct Report evaluates each Manager
    for (const dr of directReports) {
      for (const mgr of managers) {
        addAssignment(mgr.userId, dr.userId, "direct_report");
      }
    }

    // Peer evaluations: all members within the team evaluate each other
    // (peers evaluate peers, peers evaluate managers/DRs, managers evaluate managers, etc.)
    const allMembers = team.members;
    for (const reviewer of allMembers) {
      for (const subject of allMembers) {
        if (reviewer.userId === subject.userId) continue;
        // Skip if already covered by a manager/direct_report relationship
        const key = `${subject.userId}:${reviewer.userId}`;
        if (seen.has(key)) continue;

        addAssignment(subject.userId, reviewer.userId, "peer");
      }
    }
  }

  // Self-evaluations for every unique member
  allUserIds.forEach((userId) => {
    addAssignment(userId, userId, "self");
  });

  return assignments;
}

interface TeamMemberData {
  userId: string;
  role: "MANAGER" | "DIRECT_REPORT" | "MEMBER";
}

interface TeamWithMembers {
  id: string;
  members: TeamMemberData[];
}

/**
 * Fetch all teams with members for a given company, then generate
 * and persist assignments in a transaction.
 *
 * Returns the count of created assignments.
 */
export async function createAssignmentsForCycle(
  cycleId: string,
  companyId: string
): Promise<{ count: number; reviewerEmails: ReviewerInfo[] }> {
  // Fetch all company teams with members
  const teams = await prisma.team.findMany({
    where: { companyId },
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

  const assignments = generateAssignmentsFromTeams(cycleId, teams);

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
