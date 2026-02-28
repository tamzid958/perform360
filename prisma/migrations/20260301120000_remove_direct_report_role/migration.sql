-- AlterEnum: Remove DIRECT_REPORT from TeamMemberRole
-- First ensure no rows use this value
UPDATE "TeamMember" SET "role" = 'MEMBER' WHERE "role" = 'DIRECT_REPORT';

-- Recreate the enum without DIRECT_REPORT
ALTER TYPE "TeamMemberRole" RENAME TO "TeamMemberRole_old";
CREATE TYPE "TeamMemberRole" AS ENUM ('MANAGER', 'MEMBER');
ALTER TABLE "TeamMember" ALTER COLUMN "role" TYPE "TeamMemberRole" USING ("role"::text::"TeamMemberRole");
DROP TYPE "TeamMemberRole_old";
