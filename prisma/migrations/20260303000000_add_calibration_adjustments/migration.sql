-- AlterTable: Add team-level calibration fields to CycleTeam
ALTER TABLE "CycleTeam" ADD COLUMN "calibrationOffset" DOUBLE PRECISION;
ALTER TABLE "CycleTeam" ADD COLUMN "calibrationJustification" TEXT;
ALTER TABLE "CycleTeam" ADD COLUMN "calibrationAdjustedBy" TEXT;

-- CreateTable: Per-member per-team calibration overrides
CREATE TABLE "CalibrationAdjustment" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "adjustedBy" TEXT NOT NULL,
    "rawScore" DOUBLE PRECISION NOT NULL,
    "calibratedScore" DOUBLE PRECISION NOT NULL,
    "justification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalibrationAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalibrationAdjustment_cycleId_idx" ON "CalibrationAdjustment"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "CalibrationAdjustment_cycleId_teamId_subjectId_key" ON "CalibrationAdjustment"("cycleId", "teamId", "subjectId");

-- AddForeignKey
ALTER TABLE "CalibrationAdjustment" ADD CONSTRAINT "CalibrationAdjustment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationAdjustment" ADD CONSTRAINT "CalibrationAdjustment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationAdjustment" ADD CONSTRAINT "CalibrationAdjustment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationAdjustment" ADD CONSTRAINT "CalibrationAdjustment_adjustedBy_fkey" FOREIGN KEY ("adjustedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
