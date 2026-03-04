-- AlterTable: make levelId nullable for relationship-only template overrides
ALTER TABLE "CycleTeamLevelTemplate" ALTER COLUMN "levelId" DROP NOT NULL;

-- Drop existing unique index (created as an index, not a constraint)
DROP INDEX IF EXISTS "CycleTeamLevelTemplate_cycleTeamId_levelId_relationship_key";

-- Re-add unique constraint for level-specific entries (levelId IS NOT NULL)
CREATE UNIQUE INDEX "CycleTeamLevelTemplate_cycleTeamId_levelId_relationship_key"
  ON "CycleTeamLevelTemplate" ("cycleTeamId", "levelId", "relationship")
  WHERE "levelId" IS NOT NULL;

-- Add unique constraint for relationship-only entries (levelId IS NULL)
CREATE UNIQUE INDEX "CycleTeamLevelTemplate_cycleTeamId_relationship_no_level_key"
  ON "CycleTeamLevelTemplate" ("cycleTeamId", "relationship")
  WHERE "levelId" IS NULL;
