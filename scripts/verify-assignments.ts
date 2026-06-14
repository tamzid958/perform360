import { PrismaClient } from "@prisma/client";
import { generateAssignmentsFromTeams, type TeamTemplatesPair } from "../src/lib/assignments";
import { type TemplateMeta } from "../src/lib/template-routing";

const prisma = new PrismaClient();

async function main() {
  const cycle = await prisma.evaluationCycle.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  if (!cycle) {
    console.error("No ACTIVE cycle found.");
    process.exit(1);
  }

  console.log(`\n=== Assignment Verification Report ===`);
  console.log(`Cycle: ${cycle.name}`);
  console.log(`Status: ${cycle.status}\n`);

  // Fetch cycle teams with their templates
  const cycleTeams = await prisma.cycleTeam.findMany({
    where: { cycleId: cycle.id },
    include: {
      team: {
        select: { id: true, name: true },
      },
      templates: {
        include: {
          template: {
            select: { id: true, name: true, levelIds: true, sections: true },
          },
        },
      },
    },
  });

  if (cycleTeams.length === 0) {
    console.log("No teams assigned to this cycle.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Teams: ${cycleTeams.map((ct) => ct.team.name).join(", ")}`);

  // Build teamTemplatesMap for generateAssignmentsFromTeams
  const teamIds = cycleTeams.map((ct) => ct.team.id);
  const teamTemplatesPairs: TeamTemplatesPair[] = cycleTeams.map((ct) => ({
    teamId: ct.team.id,
    templates: ct.templates.map((ctt) => ({
      id: ctt.template.id,
      levelIds: ctt.template.levelIds,
      sections: (typeof ctt.template.sections === "string"
        ? JSON.parse(ctt.template.sections)
        : ctt.template.sections) as TemplateMeta["sections"],
    })),
  }));

  const teamTemplatesMap = new Map<string, TemplateMeta[]>();
  for (const pair of teamTemplatesPairs) {
    teamTemplatesMap.set(pair.teamId, pair.templates);
  }

  // Fetch teams with their members (same shape as createAssignmentsForCycle)
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    include: {
      members: {
        select: {
          userId: true,
          role: true,
          levelId: true,
          impersonatorDirections: true,
        },
      },
    },
  });

  if (teams.length === 0) {
    console.log("No teams found.");
    await prisma.$disconnect();
    return;
  }

  // Generate expected assignments
  const expected = generateAssignmentsFromTeams(cycle.id, teams, teamTemplatesMap);

  // Fetch actual assignments
  const actual = await prisma.evaluationAssignment.findMany({
    where: { cycleId: cycle.id },
    select: { id: true, subjectId: true, reviewerId: true, direction: true, templateId: true },
  });

  // Fetch user names
  const userIds = new Set<string>();
  for (const a of expected) {
    userIds.add(a.subjectId);
    userIds.add(a.reviewerId);
  }
  for (const a of actual) {
    userIds.add(a.subjectId);
    userIds.add(a.reviewerId);
  }
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  // Fetch team name per member for richer reporting
  const teamMemberRows = await prisma.teamMember.findMany({
    where: { teamId: { in: teamIds } },
    include: { team: { select: { name: true } } },
  });
  const userTeamMap = new Map<string, string>();
  for (const tm of teamMemberRows) {
    userTeamMap.set(tm.userId, tm.team.name);
  }

  // Fetch template names
  const allTemplateIds = [...new Set([...expected.map((a) => a.templateId), ...actual.map((a) => a.templateId)])];
  const templateRows = await prisma.evaluationTemplate.findMany({
    where: { id: { in: allTemplateIds } },
    select: { id: true, name: true },
  });
  const templateNameMap = new Map(templateRows.map((t) => [t.id, t.name]));

  // Build expected set: key = "subjectId:reviewerId:direction"
  const expectedSet = new Map<string, typeof expected[0]>();
  for (const a of expected) {
    const key = `${a.subjectId}:${a.reviewerId}:${a.direction}`;
    if (!expectedSet.has(key)) expectedSet.set(key, a);
  }

  // Build actual set
  const actualMap = new Map<string, typeof actual[0]>();
  for (const a of actual) {
    const key = `${a.subjectId}:${a.reviewerId}:${a.direction}`;
    if (!actualMap.has(key)) actualMap.set(key, a);
  }

  // Compare
  const missing: string[] = [];
  const unexpected: string[] = [];
  const wrongTemplate: string[] = [];

  for (const [key, exp] of expectedSet) {
    const act = actualMap.get(key);
    const teamName = userTeamMap.get(exp.subjectId) ?? "?";
    const reviewerName = userMap.get(exp.reviewerId) ?? "?";
    const subjectName = userMap.get(exp.subjectId) ?? "?";
    if (!act) {
      missing.push(
        `${teamName.padEnd(10)} | ${reviewerName.padEnd(14)} → ${subjectName.padEnd(14)} | ${exp.direction.padEnd(9)} | ${templateNameMap.get(exp.templateId) ?? "?"}`
      );
    } else if (act.templateId !== exp.templateId) {
      wrongTemplate.push(
        `${teamName.padEnd(10)} | ${reviewerName.padEnd(14)} → ${subjectName.padEnd(14)} | ${exp.direction.padEnd(9)} | expected: ${templateNameMap.get(exp.templateId) ?? "?"}  actual: ${templateNameMap.get(act.templateId) ?? "?"}`
      );
    }
  }

  for (const [key, act] of actualMap) {
    if (!expectedSet.has(key)) {
      const teamName = userTeamMap.get(act.subjectId) ?? "?";
      const reviewerName = userMap.get(act.reviewerId) ?? "?";
      const subjectName = userMap.get(act.subjectId) ?? "?";
      unexpected.push(
        `${teamName.padEnd(10)} | ${reviewerName.padEnd(14)} → ${subjectName.padEnd(14)} | ${act.direction.padEnd(9)} | ${templateNameMap.get(act.templateId) ?? "?"}`
      );
    }
  }

  // Summary
  const totalExpected = expected.length;
  const totalActual = actual.length;
  const totalMismatches = missing.length + unexpected.length + wrongTemplate.length;

  console.log(`\nExpected: ${totalExpected} assignments`);
  console.log(`Actual:   ${totalActual} assignments`);
  console.log(`Status:   ${totalMismatches === 0 ? "✅ ALL CHECKS PASSED" : `❌ ${totalMismatches} MISMATCHES`}\n`);

  if (missing.length > 0) {
    console.log(`MISSING (${missing.length}):`);
    console.log("  Team     | Reviewer → Subject          | Direction | Template");
    console.log("  " + "─".repeat(70));
    for (const line of missing) {
      console.log(`  ${line}`);
    }
    console.log();
  }

  if (unexpected.length > 0) {
    console.log(`UNEXPECTED (${unexpected.length}):`);
    for (const line of unexpected) {
      console.log(`  ${line}`);
    }
    console.log();
  }

  if (wrongTemplate.length > 0) {
    console.log(`WRONG TEMPLATE (${wrongTemplate.length}):`);
    for (const line of wrongTemplate) {
      console.log(`  ${line}`);
    }
    console.log();
  }

  if (totalMismatches === 0) {
    console.log("Every assignment matches the expected state.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
