-- DropForeignKey
ALTER TABLE "CycleTeam" DROP CONSTRAINT "CycleTeam_templateId_fkey";

-- DropForeignKey
ALTER TABLE "OtpSession" DROP CONSTRAINT "OtpSession_assignmentId_fkey";

-- AddForeignKey
ALTER TABLE "CycleTeam" ADD CONSTRAINT "CycleTeam_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EvaluationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpSession" ADD CONSTRAINT "OtpSession_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "EvaluationAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
