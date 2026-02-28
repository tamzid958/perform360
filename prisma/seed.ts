import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import {
  deriveKey,
  generateDataKey,
  encryptDataKey,
  encrypt,
  generateSalt,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "../src/lib/encryption";
import { generateToken } from "../src/lib/tokens";

const prisma = new PrismaClient();

// ─── Dev Passphrases (printed at end for local testing) ───
const ACME_PASSPHRASE = "acme-seed-passphrase-2026";
const GLOBEX_PASSPHRASE = "globex-seed-passphrase-2026";

// ─── Helpers ───

function setupEncryption(passphrase: string) {
  const salt = generateSalt();
  const saltBuffer = Buffer.from(salt, "base64");
  const masterKey = deriveKey(passphrase, saltBuffer);
  const dataKey = generateDataKey();
  const encryptedDataKey = encryptDataKey(dataKey, masterKey);
  return { salt, masterKey, dataKey, encryptedDataKey };
}

function encryptAnswers(answers: Record<string, unknown>, dataKey: Buffer, keyVersion: number) {
  const { encrypted, iv, tag } = encrypt(JSON.stringify(answers), dataKey);
  return {
    answersEncrypted: encrypted,
    answersIv: iv,
    answersTag: tag,
    keyVersion,
  };
}

// ─── Template Section Data ───

const globalTemplateSections = [
  {
    title: "Leadership Competencies",
    description: "Rate the individual on key leadership traits.",
    questions: [
      {
        id: "lc-1",
        text: "How effectively does this person communicate vision and strategy?",
        type: "rating_scale",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Needs Improvement", "Below Expectations", "Meets Expectations", "Exceeds Expectations", "Exceptional"],
      },
      {
        id: "lc-2",
        text: "How well does this person empower and develop team members?",
        type: "rating_scale",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Needs Improvement", "Below Expectations", "Meets Expectations", "Exceeds Expectations", "Exceptional"],
      },
      {
        id: "lc-3",
        text: "How effectively does this person handle conflict and difficult conversations?",
        type: "rating_scale",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Needs Improvement", "Below Expectations", "Meets Expectations", "Exceeds Expectations", "Exceptional"],
      },
    ],
  },
  {
    title: "Open Feedback",
    description: "Share your written feedback.",
    questions: [
      {
        id: "of-1",
        text: "What are this person's greatest strengths as a leader?",
        type: "text",
        required: true,
      },
      {
        id: "of-2",
        text: "What is one area where this person could improve?",
        type: "text",
        required: false,
      },
    ],
  },
];

const acmeTemplateSections = [
  {
    title: "Core Competencies",
    description: "Rate performance in key areas.",
    questions: [
      {
        id: "cc-1",
        text: "Quality of work output",
        type: "rating_scale",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Poor", "Below Average", "Average", "Good", "Excellent"],
      },
      {
        id: "cc-2",
        text: "Collaboration and teamwork",
        type: "rating_scale",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Poor", "Below Average", "Average", "Good", "Excellent"],
      },
      {
        id: "cc-3",
        text: "Initiative and problem-solving",
        type: "rating_scale",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Poor", "Below Average", "Average", "Good", "Excellent"],
      },
    ],
  },
  {
    title: "Goals & Growth",
    description: "Assess goal achievement and development.",
    questions: [
      {
        id: "gg-1",
        text: "Describe how this person has progressed toward their goals this quarter.",
        type: "text",
        required: true,
      },
      {
        id: "gg-2",
        text: "Which area should this person focus on next quarter?",
        type: "multiple_choice",
        required: true,
        options: ["Technical Skills", "Communication", "Leadership", "Time Management", "Domain Knowledge"],
      },
    ],
  },
];

const globexTemplateSections = [
  {
    title: "Collaboration",
    description: "Evaluate peer collaboration skills.",
    questions: [
      {
        id: "co-1",
        text: "How responsive is this person to requests and communication?",
        type: "rating_scale",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Very Unresponsive", "Somewhat Unresponsive", "Neutral", "Responsive", "Highly Responsive"],
      },
      {
        id: "co-2",
        text: "How well does this person share knowledge with the team?",
        type: "rating_scale",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: ["Rarely", "Occasionally", "Sometimes", "Often", "Always"],
      },
      {
        id: "co-3",
        text: "Any additional feedback on collaboration?",
        type: "text",
        required: false,
      },
    ],
  },
];

// ─── Sample Answers (for encrypted responses) ───

function acmeAnswers(variant: number): Record<string, unknown> {
  const variants = [
    {
      "cc-1": 4, "cc-2": 5, "cc-3": 4,
      "gg-1": "Made great progress on the API redesign project, consistently delivered ahead of schedule.",
      "gg-2": "Leadership",
    },
    {
      "cc-1": 3, "cc-2": 4, "cc-3": 3,
      "gg-1": "Showed improvement in cross-team collaboration and took on mentoring responsibilities.",
      "gg-2": "Technical Skills",
    },
    {
      "cc-1": 5, "cc-2": 4, "cc-3": 5,
      "gg-1": "Exceeded all quarterly targets and introduced a new testing framework.",
      "gg-2": "Communication",
    },
    {
      "cc-1": 4, "cc-2": 3, "cc-3": 4,
      "gg-1": "Solid performer with room to grow in stakeholder management.",
      "gg-2": "Time Management",
    },
    {
      "cc-1": 3, "cc-2": 5, "cc-3": 3,
      "gg-1": "Team player who actively supports others, but could take on more individual ownership.",
      "gg-2": "Domain Knowledge",
    },
    {
      "cc-1": 4, "cc-2": 4, "cc-3": 4,
      "gg-1": "Consistent performer, effectively balances multiple priorities.",
      "gg-2": "Leadership",
    },
  ];
  return variants[variant % variants.length];
}

function globalAnswers(variant: number): Record<string, unknown> {
  const variants = [
    {
      "lc-1": 4, "lc-2": 5, "lc-3": 3,
      "of-1": "Excellent communicator, always keeps the team aligned on priorities.",
      "of-2": "Could be more decisive in high-pressure situations.",
    },
    {
      "lc-1": 3, "lc-2": 4, "lc-3": 4,
      "of-1": "Strong mentor who invests time in developing junior team members.",
      "of-2": "Sometimes over-delegates without enough context.",
    },
  ];
  return variants[variant % variants.length];
}

// ─── Main Seed Function ───

async function main() {
  console.log("Cleaning database...");

  // Delete in reverse dependency order
  await prisma.otpSession.deleteMany();
  await prisma.evaluationResponse.deleteMany();
  await prisma.evaluationAssignment.deleteMany();
  await prisma.evaluationCycle.deleteMany();
  await prisma.evaluationTemplate.deleteMany();
  await prisma.recoveryCode.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.superAdmin.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.authUser.deleteMany();
  await prisma.verificationToken.deleteMany();

  console.log("Database cleaned.");

  // ─── 1. SuperAdmin ───
  console.log("Creating SuperAdmin...");
  const superAdmin = await prisma.superAdmin.create({
    data: {
      email: "platform@perform360.com",
      name: "Platform Admin",
    },
  });

  // ─── 2. Companies (with encryption) ───
  console.log("Creating Companies...");
  const acmeEncryption = setupEncryption(ACME_PASSPHRASE);
  const globexEncryption = setupEncryption(GLOBEX_PASSPHRASE);

  const acme = await prisma.company.create({
    data: {
      name: "Acme Corp",
      slug: "acme",
      settings: { timezone: "America/New_York", allowSelfEvaluation: true },
      encryptionKeyEncrypted: acmeEncryption.encryptedDataKey,
      encryptionSalt: acmeEncryption.salt,
      encryptionSetupAt: new Date(),
      keyVersion: 1,
    },
  });

  const globex = await prisma.company.create({
    data: {
      name: "Globex Inc",
      slug: "globex",
      settings: { timezone: "America/Chicago", allowSelfEvaluation: false },
      encryptionKeyEncrypted: globexEncryption.encryptedDataKey,
      encryptionSalt: globexEncryption.salt,
      encryptionSetupAt: new Date(),
      keyVersion: 1,
    },
  });

  // ─── 3. AuthUsers (for NextAuth magic link login) ───
  console.log("Creating AuthUsers...");
  const authUserData = [
    { email: "sarah@acme.com", name: "Sarah Chen" },
    { email: "mike@acme.com", name: "Mike Johnson" },
    { email: "emily@acme.com", name: "Emily Davis" },
    { email: "james@acme.com", name: "James Wilson" },
    { email: "lisa@acme.com", name: "Lisa Park" },
    { email: "tom@globex.com", name: "Tom Brown" },
    { email: "anna@globex.com", name: "Anna White" },
  ];

  const authUsers = await Promise.all(
    authUserData.map((data) =>
      prisma.authUser.create({
        data: { email: data.email, name: data.name, emailVerified: new Date() },
      })
    )
  );

  // ─── 4. Users ───
  console.log("Creating Users...");
  const sarah = await prisma.user.create({
    data: { email: "sarah@acme.com", name: "Sarah Chen", role: "ADMIN", companyId: acme.id },
  });
  const mike = await prisma.user.create({
    data: { email: "mike@acme.com", name: "Mike Johnson", role: "HR", companyId: acme.id },
  });
  const emily = await prisma.user.create({
    data: { email: "emily@acme.com", name: "Emily Davis", role: "MANAGER", companyId: acme.id },
  });
  const james = await prisma.user.create({
    data: { email: "james@acme.com", name: "James Wilson", role: "MEMBER", companyId: acme.id },
  });
  const lisa = await prisma.user.create({
    data: { email: "lisa@acme.com", name: "Lisa Park", role: "MEMBER", companyId: acme.id },
  });
  const tom = await prisma.user.create({
    data: { email: "tom@globex.com", name: "Tom Brown", role: "ADMIN", companyId: globex.id },
  });
  const anna = await prisma.user.create({
    data: { email: "anna@globex.com", name: "Anna White", role: "MEMBER", companyId: globex.id },
  });

  // ─── 5. Teams + TeamMembers ───
  console.log("Creating Teams...");
  const engineering = await prisma.team.create({
    data: {
      name: "Engineering",
      description: "Core engineering team building the platform",
      companyId: acme.id,
      members: {
        create: [
          { userId: emily.id, role: "MANAGER" },
          { userId: james.id, role: "DIRECT_REPORT" },
          { userId: lisa.id, role: "MEMBER" },
        ],
      },
    },
  });

  const product = await prisma.team.create({
    data: {
      name: "Product",
      description: "Product strategy and management",
      companyId: acme.id,
      members: {
        create: [
          { userId: sarah.id, role: "MANAGER" },
          { userId: mike.id, role: "MEMBER" },
        ],
      },
    },
  });

  const operations = await prisma.team.create({
    data: {
      name: "Operations",
      description: "Day-to-day operations and logistics",
      companyId: globex.id,
      members: {
        create: [
          { userId: tom.id, role: "MANAGER" },
          { userId: anna.id, role: "DIRECT_REPORT" },
        ],
      },
    },
  });

  // ─── 6. EvaluationTemplates ───
  console.log("Creating Templates...");
  const globalTemplate = await prisma.evaluationTemplate.create({
    data: {
      name: "360 Leadership Review",
      description: "Comprehensive 360-degree leadership evaluation template for all organizations.",
      sections: globalTemplateSections,
      isGlobal: true,
      companyId: null,
      createdBy: superAdmin.id,
    },
  });

  const acmeTemplate = await prisma.evaluationTemplate.create({
    data: {
      name: "Quarterly Performance Review",
      description: "Acme Corp standard quarterly performance evaluation.",
      sections: acmeTemplateSections,
      isGlobal: false,
      companyId: acme.id,
      createdBy: sarah.id,
    },
  });

  const globexTemplate = await prisma.evaluationTemplate.create({
    data: {
      name: "Peer Feedback Survey",
      description: "Globex peer-to-peer collaboration feedback.",
      sections: globexTemplateSections,
      isGlobal: false,
      companyId: globex.id,
      createdBy: tom.id,
    },
  });

  // ─── 7. EvaluationCycles ───
  console.log("Creating Cycles...");
  const acmeQ4Cycle = await prisma.evaluationCycle.create({
    data: {
      name: "Q4 2025 Performance Review",
      companyId: acme.id,
      status: "CLOSED",
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-12-31"),
    },
  });

  const acmeQ1Cycle = await prisma.evaluationCycle.create({
    data: {
      name: "Q1 2026 Leadership Review",
      companyId: acme.id,
      status: "ACTIVE",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-03-31"),
    },
  });

  const globexH1Cycle = await prisma.evaluationCycle.create({
    data: {
      name: "H1 2026 Peer Feedback",
      companyId: globex.id,
      status: "DRAFT",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
    },
  });

  // ─── 7b. CycleTeam (team-template pairs) ───
  console.log("Creating CycleTeam pairs...");
  await prisma.cycleTeam.createMany({
    data: [
      // Acme Q4: Engineering uses acmeTemplate, Product uses globalTemplate
      { cycleId: acmeQ4Cycle.id, teamId: engineering.id, templateId: acmeTemplate.id },
      { cycleId: acmeQ4Cycle.id, teamId: product.id, templateId: globalTemplate.id },
      // Acme Q1: Both teams use globalTemplate
      { cycleId: acmeQ1Cycle.id, teamId: engineering.id, templateId: globalTemplate.id },
      { cycleId: acmeQ1Cycle.id, teamId: product.id, templateId: globalTemplate.id },
      // Globex H1: Operations uses globexTemplate
      { cycleId: globexH1Cycle.id, teamId: operations.id, templateId: globexTemplate.id },
    ],
  });

  // ─── 8. EvaluationAssignments ───
  console.log("Creating Assignments...");

  // Acme Q4 (CLOSED) — all SUBMITTED
  const q4Assignments = [
    { subjectId: james.id, reviewerId: emily.id, relationship: "manager" },
    { subjectId: emily.id, reviewerId: james.id, relationship: "direct_report" },
    { subjectId: james.id, reviewerId: lisa.id, relationship: "peer" },
    { subjectId: emily.id, reviewerId: lisa.id, relationship: "peer" },
    { subjectId: james.id, reviewerId: james.id, relationship: "self" },
    { subjectId: emily.id, reviewerId: emily.id, relationship: "self" },
  ];

  const createdQ4Assignments = await Promise.all(
    q4Assignments.map((a) =>
      prisma.evaluationAssignment.create({
        data: {
          cycleId: acmeQ4Cycle.id,
          templateId: acmeTemplate.id,
          subjectId: a.subjectId,
          reviewerId: a.reviewerId,
          relationship: a.relationship,
          status: "SUBMITTED",
          token: generateToken(),
        },
      })
    )
  );

  // Acme Q1 (ACTIVE) — mixed statuses
  const q1Assignments = [
    { subjectId: james.id, reviewerId: emily.id, relationship: "manager", status: "SUBMITTED" as const },
    { subjectId: emily.id, reviewerId: james.id, relationship: "direct_report", status: "IN_PROGRESS" as const },
    { subjectId: james.id, reviewerId: lisa.id, relationship: "peer", status: "PENDING" as const },
    { subjectId: emily.id, reviewerId: lisa.id, relationship: "peer", status: "PENDING" as const },
    { subjectId: james.id, reviewerId: james.id, relationship: "self", status: "PENDING" as const },
    { subjectId: emily.id, reviewerId: emily.id, relationship: "self", status: "SUBMITTED" as const },
  ];

  const createdQ1Assignments = await Promise.all(
    q1Assignments.map((a) =>
      prisma.evaluationAssignment.create({
        data: {
          cycleId: acmeQ1Cycle.id,
          templateId: globalTemplate.id,
          subjectId: a.subjectId,
          reviewerId: a.reviewerId,
          relationship: a.relationship,
          status: a.status,
          token: generateToken(),
        },
      })
    )
  );

  // Globex H1 (DRAFT) — all PENDING
  const globexAssignments = [
    { subjectId: anna.id, reviewerId: tom.id, relationship: "manager" },
    { subjectId: tom.id, reviewerId: anna.id, relationship: "direct_report" },
  ];

  const createdGlobexAssignments = await Promise.all(
    globexAssignments.map((a) =>
      prisma.evaluationAssignment.create({
        data: {
          cycleId: globexH1Cycle.id,
          templateId: globexTemplate.id,
          subjectId: a.subjectId,
          reviewerId: a.reviewerId,
          relationship: a.relationship,
          status: "PENDING",
          token: generateToken(),
        },
      })
    )
  );

  // ─── 9. EvaluationResponses (encrypted) ───
  console.log("Creating Responses (encrypted)...");

  // All Q4 assignments get responses (CLOSED cycle, all SUBMITTED)
  await Promise.all(
    createdQ4Assignments.map((assignment, i) =>
      prisma.evaluationResponse.create({
        data: {
          assignmentId: assignment.id,
          reviewerId: q4Assignments[i].reviewerId,
          subjectId: q4Assignments[i].subjectId,
          ...encryptAnswers(acmeAnswers(i), acmeEncryption.dataKey, 1),
          submittedAt: new Date("2025-12-20"),
        },
      })
    )
  );

  // Q1 SUBMITTED assignments get responses
  const q1SubmittedIndices = q1Assignments
    .map((a, i) => (a.status === "SUBMITTED" ? i : -1))
    .filter((i) => i !== -1);

  await Promise.all(
    q1SubmittedIndices.map((i) =>
      prisma.evaluationResponse.create({
        data: {
          assignmentId: createdQ1Assignments[i].id,
          reviewerId: q1Assignments[i].reviewerId,
          subjectId: q1Assignments[i].subjectId,
          ...encryptAnswers(globalAnswers(i), acmeEncryption.dataKey, 1),
          submittedAt: new Date("2026-02-15"),
        },
      })
    )
  );

  // ─── 10. OtpSessions ───
  console.log("Creating OTP Sessions...");
  const otpHash = await hash("123456", 10);

  // Verified session (for the IN_PROGRESS Q1 assignment)
  const inProgressAssignment = createdQ1Assignments[1]; // james reviewing emily
  await prisma.otpSession.create({
    data: {
      assignmentId: inProgressAssignment.id,
      email: "james@acme.com",
      otpHash,
      attempts: 1,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
      verifiedAt: new Date(),
      sessionToken: generateToken(),
      sessionExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    },
  });

  // Expired session (for testing expiry)
  await prisma.otpSession.create({
    data: {
      assignmentId: createdQ1Assignments[2].id, // lisa reviewing james (PENDING)
      email: "lisa@acme.com",
      otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() - 60 * 60 * 1000), // expired 1 hour ago
      verifiedAt: null,
      sessionToken: null,
      sessionExpiry: null,
    },
  });

  // ─── 11. RecoveryCodes ───
  console.log("Creating Recovery Codes...");

  for (const { company, encryption } of [
    { company: acme, encryption: acmeEncryption },
    { company: globex, encryption: globexEncryption },
  ]) {
    const codes = generateRecoveryCodes(8);
    await Promise.all(
      codes.map(async (code) => {
        const codeHash = await hashRecoveryCode(code);
        // Re-encrypt data key with a key derived from the recovery code
        const codeSalt = Buffer.from(encryption.salt, "base64");
        const codeKey = deriveKey(code.replace(/-/g, ""), codeSalt);
        const encryptedDataKey = encryptDataKey(encryption.dataKey, codeKey);

        return prisma.recoveryCode.create({
          data: {
            companyId: company.id,
            codeHash,
            encryptedDataKey,
          },
        });
      })
    );
  }

  // ─── Summary ───
  const counts = {
    superAdmins: await prisma.superAdmin.count(),
    companies: await prisma.company.count(),
    authUsers: await prisma.authUser.count(),
    users: await prisma.user.count(),
    teams: await prisma.team.count(),
    teamMembers: await prisma.teamMember.count(),
    templates: await prisma.evaluationTemplate.count(),
    cycles: await prisma.evaluationCycle.count(),
    assignments: await prisma.evaluationAssignment.count(),
    responses: await prisma.evaluationResponse.count(),
    otpSessions: await prisma.otpSession.count(),
    recoveryCodes: await prisma.recoveryCode.count(),
  };

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║       Perform360 Seed Complete           ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  SuperAdmins:     ${String(counts.superAdmins).padStart(3)}                  ║`);
  console.log(`║  Companies:       ${String(counts.companies).padStart(3)}                  ║`);
  console.log(`║  AuthUsers:       ${String(counts.authUsers).padStart(3)}                  ║`);
  console.log(`║  Users:           ${String(counts.users).padStart(3)}                  ║`);
  console.log(`║  Teams:           ${String(counts.teams).padStart(3)}                  ║`);
  console.log(`║  TeamMembers:     ${String(counts.teamMembers).padStart(3)}                  ║`);
  console.log(`║  Templates:       ${String(counts.templates).padStart(3)}                  ║`);
  console.log(`║  Cycles:          ${String(counts.cycles).padStart(3)}                  ║`);
  console.log(`║  Assignments:     ${String(counts.assignments).padStart(3)}                  ║`);
  console.log(`║  Responses:       ${String(counts.responses).padStart(3)}                  ║`);
  console.log(`║  OTP Sessions:    ${String(counts.otpSessions).padStart(3)}                  ║`);
  console.log(`║  Recovery Codes:  ${String(counts.recoveryCodes).padStart(3)}                  ║`);
  console.log("╠══════════════════════════════════════════╣");
  console.log("║  Dev Credentials:                        ║");
  console.log("║  SuperAdmin:  platform@perform360.com    ║");
  console.log("║  Acme Admin:  sarah@acme.com             ║");
  console.log(`║    passphrase: "${ACME_PASSPHRASE}"  ║`);
  console.log("║  Globex Admin: tom@globex.com            ║");
  console.log(`║    passphrase: "${GLOBEX_PASSPHRASE}"║`);
  console.log("╚══════════════════════════════════════════╝\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
