-- Unlink AuthUser from EMPLOYEE and EXTERNAL users (they use OTP, not login)
UPDATE "User"
SET "authUserId" = NULL
WHERE role IN ('EMPLOYEE', 'EXTERNAL')
  AND "authUserId" IS NOT NULL;

-- Delete orphaned AuthUser records (no User references and no sessions/accounts)
DELETE FROM "auth_users" au
WHERE NOT EXISTS (
    SELECT 1 FROM "User" u WHERE u."authUserId" = au.id
)
AND NOT EXISTS (
    SELECT 1 FROM "Session" s WHERE s."userId" = au.id
)
AND NOT EXISTS (
    SELECT 1 FROM "Account" a WHERE a."userId" = au.id
);
