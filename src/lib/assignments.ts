import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";

/** Sentinel key for level-only entries (relationship=NULL in DB) */
const LEVEL_ONLY_KEY = "__level_only__";

interface GeneratedAssignment {
  cycleId: string;
  templateId: string;
  subjectId: string;
  reviewerId: string;
  relationship: "manager" | "direct_report" | "peer" | "self" | "external";
  token: string;
}

// levelId → relationship → templateId
type LevelRelationshipTemplateMap = Map<string, Map<string, string>>;
// teamId → LevelRelationshipTemplateMap
type TeamLevelTemplateMap = Map<string, LevelRelationshipTemplateMap>;
// teamId → relationship → templateId (no level dimension)
type TeamRelationshipTemplateMap = Map<string, Map<string, string>>;

/**
 * Resolve template for an assignment.
 * Priority: level+relationship > level-only > relationship-only > team default > null (skip).
 */
function resolveTemplate(
  teamId: string,
  subjectLevelId: string | null,
  relationship: string,
  teamTemplateMap: Map<string, string | null>,
  teamLevelTemplateMap: TeamLevelTemplateMap,
  teamRelationshipTemplateMap: TeamRelationshipTemplateMap = new Map()
): string | null {
  if (subjectLevelId) {
    const levelMap = teamLevelTemplateMap.get(teamId);
    if (levelMap) {
      const relMap = levelMap.get(subjectLevelId);
      if (relMap) {
        // 1. Try level + relationship
        const templateId = relMap.get(relationship);
        if (templateId) return templateId;
        // 2. Try level-only (applies to all relationships for this level)
        const levelOnly = relMap.get(LEVEL_ONLY_KEY);
        if (levelOnly) return levelOnly;
      }
    }
  }

  // 3. Try relationship-only template (no level required)
  const relMap = teamRelationshipTemplateMap.get(teamId);
  if (relMap) {
    const templateId = relMap.get(relationship);
    if (templateId) return templateId;
  }

  // 4. Fallback to team default template
  return teamTemplateMap.get(teamId) ?? null;
}

/**
 * Generate evaluation assignments from team structure for a cycle.
 *
 * Each team has a default templateId (optional). Level-specific templates
 * override the default per (levelId, relationship) pair.
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
  teamTemplateMap: Map<string, string | null>,
  teamLevelTemplateMap: TeamLevelTemplateMap = new Map(),
  teamRelationshipTemplateMap: TeamRelationshipTemplateMap = new Map()
): GeneratedAssignment[] {
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

  // Track self-evaluations: (userId, templateId) pairs
  const selfEvalPairs = new Set<string>();

  for (const team of teams) {
    const managers = team.members.filter((m) => m.role === "MANAGER");
    const members = team.members.filter((m) => m.role === "MEMBER");
    const externals = team.members.filter((m) => m.role === "EXTERNAL");
    const impersonators = team.members.filter((m) => m.role === "IMPERSONATOR");

    // Collect all relationships handled by impersonators in this team
    // "self" is never delegated — impersonators cannot create valid self-evaluations
    const handledRelationships = new Set<string>();
    for (const imp of impersonators) {
      for (const rel of imp.impersonatorRelationships ?? []) {
        if (rel === "self") continue;
        handledRelationships.add(rel);
      }
    }

    // All evaluable subjects: managers + members (impersonators are NOT subjects)
    const evaluableSubjects = [...managers, ...members];

    // ── Impersonator assignments ──
    // Each relationship type targets specific subjects:
    //   manager → members (downward review)
    //   direct_report → managers (upward review)
    //   peer → members (lateral review)
    //   self → all managers + members
    //   external → all managers + members
    for (const imp of impersonators) {
      for (const rel of imp.impersonatorRelationships ?? []) {
        if (rel === "self") continue; // impersonators cannot create valid self-evaluations
        let subjects: typeof evaluableSubjects;
        switch (rel) {
          case "manager":
            subjects = members;
            break;
          case "peer":
            subjects = [...members, ...managers];
            break;
          case "direct_report":
            subjects = managers;
            break;
          default: // "external"
            subjects = evaluableSubjects;
            break;
        }
        for (const subject of subjects) {
          const tpl = resolveTemplate(team.id, subject.levelId, rel, teamTemplateMap, teamLevelTemplateMap, teamRelationshipTemplateMap);
          if (tpl) addAssignment(subject.userId, imp.userId, rel as GeneratedAssignment["relationship"], tpl);
        }
      }
    }

    // ── Normal assignments (skip relationships handled by impersonators) ──

    // Track non-external, non-impersonator users for self-evaluations
    if (!handledRelationships.has("self")) {
      for (const m of team.members) {
        if (m.role === "EXTERNAL" || m.role === "IMPERSONATOR") continue;
        const tpl = resolveTemplate(team.id, m.levelId, "self", teamTemplateMap, teamLevelTemplateMap, teamRelationshipTemplateMap);
        if (tpl) selfEvalPairs.add(`${m.userId}:${tpl}`);
      }
    }

    // Manager evaluates each Member (downward) — template based on subject's level
    if (!handledRelationships.has("manager")) {
      for (const mgr of managers) {
        for (const member of members) {
          const tpl = resolveTemplate(team.id, member.levelId, "manager", teamTemplateMap, teamLevelTemplateMap, teamRelationshipTemplateMap);
          if (tpl) addAssignment(member.userId, mgr.userId, "manager", tpl);
        }
      }
    }

    // Member evaluates each Manager (upward) — template based on subject's (manager's) level
    if (!handledRelationships.has("direct_report")) {
      for (const member of members) {
        for (const mgr of managers) {
          const tpl = resolveTemplate(team.id, mgr.levelId, "direct_report", teamTemplateMap, teamLevelTemplateMap, teamRelationshipTemplateMap);
          if (tpl) addAssignment(mgr.userId, member.userId, "direct_report", tpl);
        }
      }
    }

    // Peer evaluations — template based on subject's level
    if (!handledRelationships.has("peer")) {
      // Member-to-member peers
      for (const reviewer of members) {
        for (const subject of members) {
          if (reviewer.userId === subject.userId) continue;
          const tpl = resolveTemplate(team.id, subject.levelId, "peer", teamTemplateMap, teamLevelTemplateMap, teamRelationshipTemplateMap);
          if (tpl) addAssignment(subject.userId, reviewer.userId, "peer", tpl);
        }
      }
      // Manager-to-manager peers
      for (const reviewer of managers) {
        for (const subject of managers) {
          if (reviewer.userId === subject.userId) continue;
          const tpl = resolveTemplate(team.id, subject.levelId, "peer", teamTemplateMap, teamLevelTemplateMap, teamRelationshipTemplateMap);
          if (tpl) addAssignment(subject.userId, reviewer.userId, "peer", tpl);
        }
      }
    }

    // External evaluates Members and Managers — template based on subject's level
    if (!handledRelationships.has("external")) {
      for (const ext of externals) {
        for (const member of members) {
          const tpl = resolveTemplate(team.id, member.levelId, "external", teamTemplateMap, teamLevelTemplateMap, teamRelationshipTemplateMap);
          if (tpl) addAssignment(member.userId, ext.userId, "external", tpl);
        }
        for (const mgr of managers) {
          const tpl = resolveTemplate(team.id, mgr.levelId, "external", teamTemplateMap, teamLevelTemplateMap, teamRelationshipTemplateMap);
          if (tpl) addAssignment(mgr.userId, ext.userId, "external", tpl);
        }
      }
    }
  }

  // Self-evaluations
  selfEvalPairs.forEach((pair) => {
    const [userId, templateId] = pair.split(":");
    addAssignment(userId, userId, "self", templateId);
  });

  return assignments;
}

interface TeamMemberData {
  userId: string;
  role: "MANAGER" | "MEMBER" | "EXTERNAL" | "IMPERSONATOR";
  levelId: string | null;
  impersonatorRelationships?: string[];
}

interface TeamWithMembers {
  id: string;
  members: TeamMemberData[];
}

export interface TeamTemplatePair {
  teamId: string;
  templateId?: string | null;
  levelTemplates?: {
    levelId: string;
    relationship: string | null;
    templateId: string;
  }[];
  relationshipTemplates?: {
    relationship: string;
    templateId: string;
  }[];
}

/**
 * Fetch selected teams with members, then generate
 * and persist assignments in a transaction.
 */
export async function createAssignmentsForCycle(
  cycleId: string,
  companyId: string,
  teamTemplatePairs: TeamTemplatePair[]
): Promise<{ count: number; reviewerEmails: ReviewerInfo[] }> {
  const teamIds = teamTemplatePairs.map((p) => p.teamId);

  // Fetch teams with members (now including levelId)
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds }, companyId },
    include: {
      members: {
        select: {
          userId: true,
          role: true,
          levelId: true,
          impersonatorRelationships: true,
        },
      },
    },
  });

  if (teams.length === 0) {
    return { count: 0, reviewerEmails: [] };
  }

  // Build teamId → default templateId map
  const teamTemplateMap = new Map<string, string | null>(
    teamTemplatePairs.map((p) => [p.teamId, p.templateId ?? null])
  );

  // Build teamId → levelId → relationship → templateId map
  const teamLevelTemplateMap: TeamLevelTemplateMap = new Map();
  for (const pair of teamTemplatePairs) {
    if (!pair.levelTemplates?.length) continue;
    const levelMap: LevelRelationshipTemplateMap = new Map();
    for (const lt of pair.levelTemplates) {
      if (!levelMap.has(lt.levelId)) {
        levelMap.set(lt.levelId, new Map());
      }
      const relKey = lt.relationship ?? LEVEL_ONLY_KEY;
      levelMap.get(lt.levelId)!.set(relKey, lt.templateId);
    }
    teamLevelTemplateMap.set(pair.teamId, levelMap);
  }

  // Build teamId → relationship → templateId map (no level dimension)
  const teamRelationshipTemplateMap: TeamRelationshipTemplateMap = new Map();
  for (const pair of teamTemplatePairs) {
    if (!pair.relationshipTemplates?.length) continue;
    const relMap = new Map<string, string>();
    for (const rt of pair.relationshipTemplates) {
      relMap.set(rt.relationship, rt.templateId);
    }
    teamRelationshipTemplateMap.set(pair.teamId, relMap);
  }

  // Also load persisted CycleTeamLevelTemplate records (for existing cycles)
  const cycleTeams = await prisma.cycleTeam.findMany({
    where: { cycleId, teamId: { in: teamIds } },
    include: { levelTemplates: true },
  });

  // Merge DB entries into maps — input entries take precedence, DB fills gaps
  for (const ct of cycleTeams) {
    if (ct.levelTemplates.length === 0) continue;

    // Separate: level-specific (levelId != null) vs relationship-only (levelId == null)
    const levelEntries = ct.levelTemplates.filter((lt) => lt.levelId !== null);
    const relEntries = ct.levelTemplates.filter((lt) => lt.levelId === null);

    if (levelEntries.length > 0) {
      if (!teamLevelTemplateMap.has(ct.teamId)) {
        teamLevelTemplateMap.set(ct.teamId, new Map());
      }
      const levelMap = teamLevelTemplateMap.get(ct.teamId)!;
      for (const lt of levelEntries) {
        if (!levelMap.has(lt.levelId!)) levelMap.set(lt.levelId!, new Map());
        const relKey = lt.relationship ?? LEVEL_ONLY_KEY;
        // Input takes precedence — only fill from DB if not already set
        if (!levelMap.get(lt.levelId!)!.has(relKey)) {
          levelMap.get(lt.levelId!)!.set(relKey, lt.templateId);
        }
      }
    }

    if (relEntries.length > 0) {
      if (!teamRelationshipTemplateMap.has(ct.teamId)) {
        teamRelationshipTemplateMap.set(ct.teamId, new Map());
      }
      const relMap = teamRelationshipTemplateMap.get(ct.teamId)!;
      for (const rt of relEntries) {
        if (!relMap.has(rt.relationship!)) {
          relMap.set(rt.relationship!, rt.templateId);
        }
      }
    }
  }

  const assignments = generateAssignmentsFromTeams(
    cycleId,
    teams,
    teamTemplateMap,
    teamLevelTemplateMap,
    teamRelationshipTemplateMap
  );

  if (assignments.length === 0) {
    return { count: 0, reviewerEmails: [] };
  }

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
