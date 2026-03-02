-- CreateTable
CREATE TABLE "CycleReviewerLink" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CycleReviewerLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CycleReviewerLink_token_key" ON "CycleReviewerLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CycleReviewerLink_cycleId_reviewerId_key" ON "CycleReviewerLink"("cycleId", "reviewerId");

-- AddForeignKey
ALTER TABLE "CycleReviewerLink" ADD CONSTRAINT "CycleReviewerLink_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Make assignmentId optional and add reviewerLinkId
ALTER TABLE "OtpSession" ALTER COLUMN "assignmentId" DROP NOT NULL;

ALTER TABLE "OtpSession" ADD COLUMN "reviewerLinkId" TEXT;

-- AddForeignKey
ALTER TABLE "OtpSession" ADD CONSTRAINT "OtpSession_reviewerLinkId_fkey" FOREIGN KEY ("reviewerLinkId") REFERENCES "CycleReviewerLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
