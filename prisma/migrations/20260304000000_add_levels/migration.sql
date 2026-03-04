-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CycleTeamLevelTemplate" (
    "id" TEXT NOT NULL,
    "cycleTeamId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "CycleTeamLevelTemplate_pkey" PRIMARY KEY ("id")
);

-- AlterTable: make CycleTeam.templateId nullable
ALTER TABLE "CycleTeam" ALTER COLUMN "templateId" DROP NOT NULL;

-- AlterTable: add levelId to TeamMember
ALTER TABLE "TeamMember" ADD COLUMN "levelId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Level_companyId_name_key" ON "Level"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CycleTeamLevelTemplate_cycleTeamId_levelId_relationship_key" ON "CycleTeamLevelTemplate"("cycleTeamId", "levelId", "relationship");

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleTeamLevelTemplate" ADD CONSTRAINT "CycleTeamLevelTemplate_cycleTeamId_fkey" FOREIGN KEY ("cycleTeamId") REFERENCES "CycleTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleTeamLevelTemplate" ADD CONSTRAINT "CycleTeamLevelTemplate_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleTeamLevelTemplate" ADD CONSTRAINT "CycleTeamLevelTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EvaluationTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
