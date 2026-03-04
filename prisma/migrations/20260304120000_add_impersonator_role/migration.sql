-- AlterEnum (idempotent: skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'IMPERSONATOR'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TeamMemberRole')
  ) THEN
    ALTER TYPE "TeamMemberRole" ADD VALUE 'IMPERSONATOR';
  END IF;
END
$$;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "impersonatorRelationships" TEXT[] DEFAULT ARRAY[]::TEXT[];
