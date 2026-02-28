import { prisma } from "@/lib/prisma";
import { pruneOldJobs } from "@/lib/queue";
import type { CleanupOtpSessionsPayload } from "@/types/job";

/**
 * Deletes expired OTP sessions and prunes old completed/dead jobs.
 */
export async function handleCleanupOtpSessions(
  _payload: CleanupOtpSessionsPayload
): Promise<void> {
  const now = new Date();

  // Delete expired verified sessions (past sessionExpiry)
  const expiredSessions = await prisma.otpSession.deleteMany({
    where: {
      verifiedAt: { not: null },
      sessionExpiry: { lt: now },
    },
  });

  // Delete expired unverified OTPs (past expiresAt, never verified)
  const expiredOtps = await prisma.otpSession.deleteMany({
    where: {
      verifiedAt: null,
      expiresAt: { lt: now },
    },
  });

  // Prune old completed/dead jobs
  const prunedJobs = await pruneOldJobs();

  console.log(
    `[Jobs] Cleanup: ${expiredSessions.count} expired sessions, ` +
    `${expiredOtps.count} expired OTPs, ${prunedJobs} old jobs pruned`
  );
}
