import { prisma } from "./prisma";

/**
 * Performs a full cascading delete of a company and all related data.
 * Deletes in leaf-to-root order to respect foreign key constraints.
 * Also invalidates all sessions for company users.
 */
export async function cascadeDeleteCompany(companyId: string): Promise<void> {
  // Invalidate all sessions for company users
  const companyUsers = await prisma.user.findMany({
    where: { companyId },
    select: { authUserId: true },
  });

  const authUserIds = companyUsers
    .map((u) => u.authUserId)
    .filter((id): id is string => id !== null);

  if (authUserIds.length > 0) {
    await prisma.session.deleteMany({
      where: { userId: { in: authUserIds } },
    });
  }

  // Cascading delete (leaf-to-root)

  // OTP sessions (via assignment → cycle)
  await prisma.otpSession.deleteMany({
    where: { assignment: { cycle: { companyId } } },
  });

  // Evaluation responses (via assignment → cycle)
  await prisma.evaluationResponse.deleteMany({
    where: { assignment: { cycle: { companyId } } },
  });

  // Evaluation assignments (via cycle)
  await prisma.evaluationAssignment.deleteMany({
    where: { cycle: { companyId } },
  });

  // Cycle-team links (via cycle)
  await prisma.cycleTeam.deleteMany({
    where: { cycle: { companyId } },
  });

  // Evaluation cycles
  await prisma.evaluationCycle.deleteMany({
    where: { companyId },
  });

  // Team members (via team)
  await prisma.teamMember.deleteMany({
    where: { team: { companyId } },
  });

  // Teams
  await prisma.team.deleteMany({
    where: { companyId },
  });

  // Company-scoped templates
  await prisma.evaluationTemplate.deleteMany({
    where: { companyId },
  });

  // Recovery codes
  await prisma.recoveryCode.deleteMany({
    where: { companyId },
  });

  // Audit logs
  await prisma.auditLog.deleteMany({
    where: { companyId },
  });

  // Company-scoped users (NOT AuthUser)
  await prisma.user.deleteMany({
    where: { companyId },
  });

  // Company itself
  await prisma.company.delete({
    where: { id: companyId },
  });
}
