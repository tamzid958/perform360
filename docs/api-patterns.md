# API Patterns

## Endpoint Structure

Routes live in `src/app/api/` following Next.js App Router conventions:

```
src/app/api/
  teams/route.ts              → GET /api/teams, POST /api/teams
  teams/[id]/route.ts         → GET/PATCH/DELETE /api/teams/:id
  teams/[id]/members/route.ts → POST /api/teams/:id/members
  evaluate/[token]/route.ts   → GET/POST /api/evaluate/:token
  admin/companies/route.ts    → GET/POST /api/admin/companies (super admin only)
```

## Authentication Guards

Every route starts with an auth guard from `@/lib/api-auth`:

```typescript
import { requireAuth, requireAdminOrHR, requireSuperAdmin, isAuthError } from "@/lib/api-auth";

// Pattern: guard → check → proceed
export async function GET() {
  const authResult = await requireAuth();
  if (isAuthError(authResult)) return authResult;
  // authResult is now { userId, email, role, companyId }
}
```

Available guards:
- `requireAuth()` — any authenticated user
- `requireAdminOrHR()` — ADMIN or HR role
- `requireRole(...roles)` — specific roles
- `requireSuperAdmin()` — SaaS owner (separate `SuperAdmin` table)

## Request Validation

All inputs validated with Zod schemas defined at the top of each route file:

```typescript
const createTeamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

// In handler:
const body = await request.json();
const validated = createTeamSchema.parse(body);
```

Zod errors return 400:
```json
{ "success": false, "error": "Validation failed" }
```

## Response Format

Consistent envelope for all API responses:

```typescript
// Success (200/201)
{ "success": true, "data": { ... } }

// Error (400/401/403/500)
{ "success": false, "error": "Human-readable message" }
```

## Error Responses

| Status | Meaning | When |
|--------|---------|------|
| 400 | Bad Request | Zod validation failure |
| 401 | Unauthorized | No session or user not found |
| 403 | Forbidden | Role insufficient for action |
| 500 | Internal Server Error | Unhandled exception |

## Public Endpoints

Evaluation form routes (`/api/evaluate/[token]/*`) use OTP session authentication instead of NextAuth:

```
POST /api/evaluate/:token/otp/send   → Send 6-digit OTP to reviewer email
POST /api/evaluate/:token/otp/verify → Verify OTP, issue httpOnly session cookie
GET  /api/evaluate/:token/form       → Get form (requires valid OTP session)
POST /api/evaluate/:token            → Submit evaluation (encrypted)
```

## Tenant Scoping

All tenant queries use `companyId` from the auth result, never from the client:

```typescript
const authResult = await requireAuth();
if (isAuthError(authResult)) return authResult;

const teams = await prisma.team.findMany({
  where: { companyId: authResult.companyId },
});
```
