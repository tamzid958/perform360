-- AlterEnum
ALTER TYPE "TeamMemberRole" ADD VALUE 'IMPERSONATOR';

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN "impersonatorRelationships" TEXT[] DEFAULT ARRAY[]::TEXT[];
