-- AlterEnum: Remove MANAGER from UserRole
-- First update any existing users with MANAGER role to MEMBER
UPDATE "User" SET "role" = 'MEMBER' WHERE "role" = 'MANAGER';

-- Remove the MANAGER value from UserRole enum
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'HR', 'MEMBER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
DROP TYPE "UserRole_old";
